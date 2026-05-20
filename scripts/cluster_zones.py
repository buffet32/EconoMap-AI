import json
import sys

import numpy as np
import pandas as pd
from sklearn.cluster import AgglomerativeClustering, DBSCAN, KMeans, SpectralClustering
from sklearn.mixture import GaussianMixture
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

from config import ARTIFACTS_DIR, DATA_PATH, RANDOM_STATE
from utils import get_logger


logger = get_logger("cluster_zones")


MIN_CLUSTER_SIZE_SUPERVISED = 3
DEFAULT_MODE = "typology"
VALID_MODES = {"typology", "anomaly"}
TARGET_K_RANGE = [3, 4, 5, 6]


ZONE_NUMERIC_FEATURES = [
    "entity_count_real",
    "entity_count_total",
    "density_log",
    "active_rate",
    "capital_median",
    "capital_mean",
    "capital_max",
    "sector_diversity",
    "formal_ratio",
    "sarl_count",
    "sa_count",
    "n_sectors_present",
]


def _safe_mode(series: pd.Series) -> str:
    mode_values = series.mode(dropna=True)
    if mode_values.empty:
        return "Unknown"
    return str(mode_values.iloc[0])


def build_zone_table(df_raw: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate sector-level rows into one row per geographic zone (cell_id).
    """
    df = df_raw.copy()
    required_cols = {"cell_id", "sector_main", "city"}
    missing = required_cols.difference(df.columns)
    if missing:
        raise ValueError(f"Missing required columns for zone aggregation: {sorted(missing)}")

    # Dominant sector in each zone (highest real entity count over sectors).
    dominant_sector = (
        df.sort_values("entity_count_real", ascending=False)
        .groupby("cell_id", as_index=False)
        .first()[["cell_id", "sector_main"]]
        .rename(columns={"sector_main": "dominant_sector"})
    )

    zone = (
        df.groupby("cell_id", as_index=False)
        .agg(
            cell_lat=("cell_lat", "first"),
            cell_lon=("cell_lon", "first"),
            city=("city", _safe_mode),
            entity_count_real=("entity_count_real", "sum"),
            entity_count_total=("entity_count_total", "sum"),
            active_rate=("active_rate", "mean"),
            capital_median=("capital_median", "median"),
            capital_mean=("capital_mean", "mean"),
            capital_max=("capital_max", "max"),
            sector_diversity=("sector_diversity", "max"),
            formal_ratio=("formal_ratio", "mean"),
            sarl_count=("sarl_count", "sum"),
            sa_count=("sa_count", "sum"),
            attractivity_score=("attractivity_score", "mean"),
            attractivity_class=("attractivity_class", _safe_mode),
            n_sectors_present=("sector_main", "nunique"),
        )
        .merge(dominant_sector, on="cell_id", how="left")
    )

    zone["density_log"] = np.log1p(zone["entity_count_real"])
    zone = zone.replace([np.inf, -np.inf], np.nan).dropna(subset=ZONE_NUMERIC_FEATURES).reset_index(drop=True)
    return zone


def evaluate_kmeans(X_scaled: np.ndarray) -> tuple[KMeans, dict]:
    n_samples = X_scaled.shape[0]
    k_max = min(8, n_samples - 1)
    if k_max < 2:
        raise ValueError("Not enough zones to run KMeans.")

    k_results = []
    for k in range(2, k_max + 1):
        model = KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init=20)
        labels = model.fit_predict(X_scaled)
        sil = silhouette_score(X_scaled, labels)
        _, counts = np.unique(labels, return_counts=True)
        min_cluster_size = int(counts.min())
        k_results.append(
            {
                "k": int(k),
                "silhouette": float(sil),
                "inertia": float(model.inertia_),
                "min_cluster_size": min_cluster_size,
                "valid_for_supervised": bool(min_cluster_size >= MIN_CLUSTER_SIZE_SUPERVISED),
            }
        )

    valid_rows = [r for r in k_results if r["valid_for_supervised"]]
    if valid_rows:
        best_row = max(valid_rows, key=lambda x: x["silhouette"])
    else:
        best_row = max(k_results, key=lambda x: x["silhouette"])
    best_model = KMeans(n_clusters=int(best_row["k"]), random_state=RANDOM_STATE, n_init=20)
    best_model.fit(X_scaled)
    return best_model, {"search": k_results, "best": best_row}


def evaluate_dbscan(X_scaled: np.ndarray) -> tuple[DBSCAN | None, dict]:
    eps_grid = [0.4, 0.6, 0.8, 1.0, 1.2, 1.5, 2.0]
    min_samples_grid = [3, 4, 6, 8]

    candidates = []
    best_model = None
    best_score = -1.0

    for eps in eps_grid:
        for min_samples in min_samples_grid:
            model = DBSCAN(eps=eps, min_samples=min_samples)
            labels = model.fit_predict(X_scaled)
            core_mask = labels != -1
            unique_clusters = np.unique(labels[core_mask])
            n_clusters = int(len(unique_clusters))
            noise_ratio = float(np.mean(labels == -1))

            if n_clusters < 2 or np.sum(core_mask) < 3:
                continue

            cluster_counts = [int(np.sum(labels == c)) for c in unique_clusters]
            min_cluster_size = min(cluster_counts) if cluster_counts else 0
            if min_cluster_size < MIN_CLUSTER_SIZE_SUPERVISED:
                continue

            sil = silhouette_score(X_scaled[core_mask], labels[core_mask])
            quality = float(sil * (1.0 - noise_ratio))
            row = {
                "eps": float(eps),
                "min_samples": int(min_samples),
                "n_clusters": n_clusters,
                "min_cluster_size": int(min_cluster_size),
                "noise_ratio": noise_ratio,
                "silhouette_core": float(sil),
                "quality_score": quality,
            }
            candidates.append(row)

            if quality > best_score:
                best_score = quality
                best_model = model

    best_meta = None
    if candidates:
        best_meta = max(candidates, key=lambda x: x["quality_score"])
    return best_model, {"candidates": candidates, "best": best_meta}


def _balance_score(labels: np.ndarray) -> float:
    _, counts = np.unique(labels, return_counts=True)
    p = counts / counts.sum()
    entropy = -np.sum(p * np.log(p + 1e-12))
    max_entropy = np.log(len(counts) + 1e-12)
    return float(entropy / max_entropy) if max_entropy > 0 else 0.0


def _evaluate_partition(
    X_scaled: np.ndarray,
    labels: np.ndarray,
    model_name: str,
    model_params: dict,
) -> dict | None:
    unique = np.unique(labels)
    if len(unique) < 2:
        return None
    _, counts = np.unique(labels, return_counts=True)
    min_size = int(counts.min())
    max_share = float(counts.max() / counts.sum())
    min_share = float(counts.min() / counts.sum())
    sil = float(silhouette_score(X_scaled, labels))
    balance = _balance_score(labels)
    valid = bool(min_size >= MIN_CLUSTER_SIZE_SUPERVISED and min_share >= 0.08 and max_share <= 0.75)
    objective = float(0.60 * sil + 0.40 * balance)
    if not valid:
        objective -= 0.35
    return {
        "model": model_name,
        "params": model_params,
        "n_clusters": int(len(unique)),
        "silhouette": sil,
        "balance_score": balance,
        "min_cluster_size": min_size,
        "max_cluster_share": max_share,
        "min_cluster_share": min_share,
        "valid_for_supervised": valid,
        "selection_objective": objective,
        "labels": labels,
    }


def evaluate_typology_models(X_scaled: np.ndarray) -> dict:
    candidates = []

    for k in TARGET_K_RANGE:
        km = KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init=20)
        labels = km.fit_predict(X_scaled)
        row = _evaluate_partition(X_scaled, labels, "kmeans", {"k": k})
        if row:
            candidates.append(row)

    for k in TARGET_K_RANGE:
        for covariance_type in ("full", "diag"):
            gmm = GaussianMixture(
                n_components=k,
                covariance_type=covariance_type,
                random_state=RANDOM_STATE,
            )
            labels = gmm.fit_predict(X_scaled)
            row = _evaluate_partition(
                X_scaled,
                labels,
                "gmm",
                {"k": k, "covariance_type": covariance_type, "bic": float(gmm.bic(X_scaled))},
            )
            if row:
                candidates.append(row)

    for k in TARGET_K_RANGE:
        for linkage in ("ward", "average", "complete"):
            if linkage != "ward":
                model = AgglomerativeClustering(n_clusters=k, linkage=linkage, metric="euclidean")
            else:
                model = AgglomerativeClustering(n_clusters=k, linkage=linkage)
            labels = model.fit_predict(X_scaled)
            row = _evaluate_partition(
                X_scaled,
                labels,
                "agglomerative",
                {"k": k, "linkage": linkage},
            )
            if row:
                candidates.append(row)

    for k in TARGET_K_RANGE:
        spectral = SpectralClustering(
            n_clusters=k,
            random_state=RANDOM_STATE,
            affinity="nearest_neighbors",
            n_neighbors=10,
            assign_labels="kmeans",
        )
        labels = spectral.fit_predict(X_scaled)
        row = _evaluate_partition(
            X_scaled,
            labels,
            "spectral",
            {"k": k, "affinity": "nearest_neighbors", "n_neighbors": 10},
        )
        if row:
            candidates.append(row)

    valid = [c for c in candidates if c["valid_for_supervised"]]
    best = max(valid, key=lambda x: x["selection_objective"]) if valid else max(
        candidates, key=lambda x: x["selection_objective"]
    )
    return {
        "search": [{k: v for k, v in c.items() if k != "labels"} for c in candidates],
        "best": {k: v for k, v in best.items() if k != "labels"},
        "labels": best["labels"],
    }


def choose_strategy(kmeans_meta: dict, dbscan_meta: dict) -> tuple[str, dict]:
    km_sil = float(kmeans_meta["best"]["silhouette"])
    km_valid = bool(kmeans_meta["best"].get("valid_for_supervised", False))
    db_best = dbscan_meta.get("best")
    db_valid = db_best is not None

    if km_valid and not db_valid:
        return "kmeans", {
            "reason": "KMeans is supervised-valid while DBSCAN has no valid candidate.",
            "kmeans_silhouette": km_sil,
            "kmeans_valid_for_supervised": km_valid,
            "dbscan_valid_for_supervised": db_valid,
        }

    if db_valid and not km_valid:
        return "dbscan", {
            "reason": "DBSCAN selected because KMeans best split is not supervised-valid.",
            "kmeans_silhouette": km_sil,
            "kmeans_valid_for_supervised": km_valid,
            "dbscan_valid_for_supervised": db_valid,
            "dbscan_quality_score": float(db_best["quality_score"]),
        }

    if db_best is None:
        return "kmeans", {
            "reason": "DBSCAN did not find valid multi-cluster structures.",
            "kmeans_silhouette": km_sil,
            "kmeans_valid_for_supervised": km_valid,
            "dbscan_valid_for_supervised": db_valid,
        }

    db_quality = float(db_best["quality_score"])
    if db_quality >= km_sil:
        return "dbscan", {
            "reason": "DBSCAN quality_score >= KMeans silhouette.",
            "kmeans_silhouette": km_sil,
            "dbscan_quality_score": db_quality,
            "kmeans_valid_for_supervised": km_valid,
            "dbscan_valid_for_supervised": db_valid,
        }
    return "kmeans", {
        "reason": "KMeans silhouette > DBSCAN quality_score.",
        "kmeans_silhouette": km_sil,
        "dbscan_quality_score": db_quality,
        "kmeans_valid_for_supervised": km_valid,
        "dbscan_valid_for_supervised": db_valid,
    }


def main() -> None:
    mode = DEFAULT_MODE
    if len(sys.argv) > 1:
        mode = sys.argv[1].strip().lower()
    if mode not in VALID_MODES:
        raise ValueError(f"Invalid mode '{mode}'. Allowed modes: {sorted(VALID_MODES)}")

    ARTIFACTS_DIR.mkdir(exist_ok=True)
    logger.info("Loading data from %s", DATA_PATH)
    raw = pd.read_csv(DATA_PATH, low_memory=False)
    zone_df = build_zone_table(raw)
    logger.info("Zone-level table shape: %s", zone_df.shape)

    X = zone_df[ZONE_NUMERIC_FEATURES].copy()
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    if mode == "anomaly":
        kmeans_model, kmeans_meta = evaluate_kmeans(X_scaled)
        dbscan_model, dbscan_meta = evaluate_dbscan(X_scaled)
        strategy, strategy_meta = choose_strategy(kmeans_meta, dbscan_meta)

        if strategy == "dbscan" and dbscan_model is not None:
            labels = dbscan_model.fit_predict(X_scaled)
        else:
            labels = kmeans_model.fit_predict(X_scaled)
        typology_meta = None
    else:
        typology_meta = evaluate_typology_models(X_scaled)
        labels = typology_meta["labels"]
        strategy = "balanced_typology"
        strategy_meta = {
            "reason": "Selected by multi-objective optimization (separation + balanced cluster sizes).",
            "selected_model": typology_meta["best"]["model"],
            "selected_params": typology_meta["best"]["params"],
            "selected_silhouette": typology_meta["best"]["silhouette"],
            "selected_balance_score": typology_meta["best"]["balance_score"],
            "valid_for_supervised": typology_meta["best"]["valid_for_supervised"],
        }
        kmeans_meta, dbscan_meta = None, None

    out = zone_df.copy()
    out["cluster_label"] = labels.astype(int)

    labels_path = ARTIFACTS_DIR / f"zone_clusters_{mode}.csv"
    latest_labels_path = ARTIFACTS_DIR / "zone_clusters.csv"
    out.to_csv(labels_path, index=False, encoding="utf-8")
    out.to_csv(latest_labels_path, index=False, encoding="utf-8")

    metrics = {
        "n_zones": int(len(out)),
        "n_features_for_clustering": int(len(ZONE_NUMERIC_FEATURES)),
        "features_used": ZONE_NUMERIC_FEATURES,
        "mode": mode,
        "selected_strategy": strategy,
        "selection_details": strategy_meta,
        "kmeans": kmeans_meta,
        "dbscan": dbscan_meta,
        "typology_models": (
            {
                "search": typology_meta["search"],
                "best": typology_meta["best"],
            }
            if typology_meta is not None
            else None
        ),
        "cluster_counts": {str(k): int(v) for k, v in out["cluster_label"].value_counts().sort_index().items()},
        "notes": [
            "attractivity_score is excluded from clustering features.",
            "attractivity_score remains in output only for post-hoc validation.",
            f"Clustering selection enforces min cluster size >= {MIN_CLUSTER_SIZE_SUPERVISED} for supervised readiness when possible.",
            "Use mode='typology' for balanced economic profiles and mode='anomaly' for atypical pocket detection.",
        ],
    }
    metrics_path = ARTIFACTS_DIR / f"clustering_metrics_{mode}.json"
    latest_metrics_path = ARTIFACTS_DIR / "clustering_metrics.json"
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2, ensure_ascii=False)
    with open(latest_metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2, ensure_ascii=False)

    logger.info("Saved labels: %s", labels_path)
    logger.info("Saved latest labels snapshot: %s", latest_labels_path)
    logger.info("Saved clustering diagnostics: %s", metrics_path)
    logger.info("Saved latest clustering diagnostics snapshot: %s", latest_metrics_path)
    logger.info("Done. Selected strategy: %s", strategy)


if __name__ == "__main__":
    main()
