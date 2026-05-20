import json
import sys

import numpy as np
import pandas as pd

from config import ARTIFACTS_DIR, DATA_PATH
from utils import get_logger


logger = get_logger("analyze_clusters")
DEFAULT_MODE = "typology"
VALID_MODES = {"typology", "anomaly"}


def _cluster_profile_name(cluster_means: pd.Series, global_means: pd.Series) -> str:
    density_ratio = cluster_means.get("density_log", 0.0) / max(global_means.get("density_log", 1.0), 1e-9)
    capital_ratio = cluster_means.get("capital_mean", 0.0) / max(global_means.get("capital_mean", 1.0), 1e-9)
    formal_ratio = cluster_means.get("formal_ratio", 0.0) / max(global_means.get("formal_ratio", 1.0), 1e-9)
    sector_ratio = cluster_means.get("n_sectors_present", 0.0) / max(global_means.get("n_sectors_present", 1.0), 1e-9)

    if density_ratio > 1.25 and capital_ratio > 1.25:
        return "High-density capital hubs"
    if density_ratio < 0.85 and capital_ratio < 0.85:
        return "Emerging low-capital zones"
    if formal_ratio > 1.20:
        return "Structured formal business zones"
    if sector_ratio > 1.20:
        return "Diversified multi-sector zones"
    return "Intermediate mixed economic zones"


def _top_items(series: pd.Series, top_n: int = 3) -> list[dict]:
    counts = series.value_counts(dropna=True).head(top_n)
    total = max(int(series.notna().sum()), 1)
    return [
        {"name": str(name), "count": int(cnt), "share": float(cnt / total)}
        for name, cnt in counts.items()
    ]


def main() -> None:
    mode = DEFAULT_MODE
    if len(sys.argv) > 1:
        mode = sys.argv[1].strip().lower()
    if mode not in VALID_MODES:
        raise ValueError(f"Invalid mode '{mode}'. Allowed modes: {sorted(VALID_MODES)}")

    labels_path = ARTIFACTS_DIR / f"zone_clusters_{mode}.csv"
    if not labels_path.exists():
        raise FileNotFoundError(
            f"{labels_path} not found. Run cluster_zones.py {mode} first."
        )

    ARTIFACTS_DIR.mkdir(exist_ok=True)

    zone_clusters = pd.read_csv(labels_path, low_memory=False)
    raw = pd.read_csv(DATA_PATH, low_memory=False)

    merge_cols = ["cell_id", "cluster_label"]
    zone_cluster_map = zone_clusters[merge_cols].drop_duplicates()
    raw_clustered = raw.merge(zone_cluster_map, on="cell_id", how="inner")

    numeric_cols = [
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
    numeric_cols = [c for c in numeric_cols if c in zone_clusters.columns]

    global_means = zone_clusters[numeric_cols].mean(numeric_only=True)
    summary = []

    for cluster_id, group in zone_clusters.groupby("cluster_label", sort=True):
        cluster_means = group[numeric_cols].mean(numeric_only=True)
        profile_name = _cluster_profile_name(cluster_means, global_means)

        raw_group = raw_clustered[raw_clustered["cluster_label"] == cluster_id]
        top_sectors = _top_items(raw_group["sector_main"], top_n=4) if "sector_main" in raw_group else []
        city_distribution = _top_items(group["city"], top_n=4) if "city" in group else []

        score_stats = {}
        if "attractivity_score" in group.columns:
            score_stats = {
                "mean": float(group["attractivity_score"].mean()),
                "std": float(group["attractivity_score"].std(ddof=0)),
                "min": float(group["attractivity_score"].min()),
                "max": float(group["attractivity_score"].max()),
            }

        summary.append(
            {
                "cluster_label": int(cluster_id),
                "profile_name": profile_name,
                "n_zones": int(len(group)),
                "mean_features": {k: float(v) for k, v in cluster_means.items()},
                "dominant_sectors": top_sectors,
                "city_distribution": city_distribution,
                "attractivity_score_validation": score_stats,
            }
        )

    output_json = {
        "title": "Economic zone cluster analysis",
        "mode": mode,
        "methodology": {
            "target_usage": "No supervised target used in clustering.",
            "attractivity_score_usage": "Descriptive post-analysis validation only.",
        },
        "n_clusters_detected": int(zone_clusters["cluster_label"].nunique()),
        "clusters": summary,
    }

    json_path = ARTIFACTS_DIR / f"cluster_summary_{mode}.json"
    latest_json_path = ARTIFACTS_DIR / "cluster_summary.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(output_json, f, indent=2, ensure_ascii=False)
    with open(latest_json_path, "w", encoding="utf-8") as f:
        json.dump(output_json, f, indent=2, ensure_ascii=False)

    text_lines = [
        "Cluster Summary Report",
        "======================",
        "",
        f"Mode: {mode}",
        "Scientific framing: discovered economic structures from unsupervised clustering.",
        "Validation only: attractivity_score used for interpretation, never as training target.",
        "",
    ]
    for item in summary:
        text_lines.append(f"Cluster {item['cluster_label']} - {item['profile_name']}")
        text_lines.append(f"  Zones: {item['n_zones']}")
        if item["dominant_sectors"]:
            sectors_txt = ", ".join(
                f"{x['name']} ({x['share']:.0%})" for x in item["dominant_sectors"]
            )
            text_lines.append(f"  Dominant sectors: {sectors_txt}")
        if item["city_distribution"]:
            city_txt = ", ".join(
                f"{x['name']} ({x['share']:.0%})" for x in item["city_distribution"]
            )
            text_lines.append(f"  City distribution: {city_txt}")
        sc = item["attractivity_score_validation"]
        if sc:
            text_lines.append(
                f"  Attractivity score (validation): mean={sc['mean']:.2f}, std={sc['std']:.2f}, "
                f"range=[{sc['min']:.2f}, {sc['max']:.2f}]"
            )
        text_lines.append("")

    txt_path = ARTIFACTS_DIR / f"cluster_summary_{mode}.txt"
    latest_txt_path = ARTIFACTS_DIR / "cluster_summary.txt"
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(text_lines))
    with open(latest_txt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(text_lines))

    logger.info("Saved cluster summary JSON: %s", json_path)
    logger.info("Saved cluster summary report: %s", txt_path)
    logger.info("Saved latest summary snapshots: %s, %s", latest_json_path, latest_txt_path)


if __name__ == "__main__":
    main()
