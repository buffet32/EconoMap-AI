import json
import sys
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

from config import ARTIFACTS_DIR, REPORTS_DIR
from utils import get_logger

try:
    import geopandas as gpd  # type: ignore
    import contextily as ctx  # type: ignore
except Exception:  # pragma: no cover
    gpd = None
    ctx = None


logger = get_logger("visualize_results")
DEFAULT_MODE = "typology"
VALID_MODES = {"typology", "anomaly"}


def _load_mode_artifacts(mode: str) -> tuple[pd.DataFrame, dict]:
    zone_path = ARTIFACTS_DIR / f"zone_clusters_{mode}.csv"
    metrics_path = ARTIFACTS_DIR / f"cluster_classifier_metrics_{mode}.json"
    if not zone_path.exists():
        raise FileNotFoundError(f"{zone_path} not found. Run clustering first.")
    if not metrics_path.exists():
        raise FileNotFoundError(f"{metrics_path} not found. Run classifier first.")

    zones = pd.read_csv(zone_path, low_memory=False)
    with open(metrics_path, "r", encoding="utf-8") as f:
        clf_metrics = json.load(f)
    return zones, clf_metrics


def _prepare_geodata(zones: pd.DataFrame):
    if gpd is None:
        raise RuntimeError("GeoPandas not available")
    gdf = gpd.GeoDataFrame(
        zones.copy(),
        geometry=gpd.points_from_xy(zones["cell_lon"], zones["cell_lat"]),
        crs="EPSG:4326",
    )
    return gdf.to_crs(epsg=3857)


def _add_basemap(ax) -> None:
    if ctx is None:
        return
    ctx.add_basemap(ax, source=ctx.providers.CartoDB.Positron, alpha=0.95)


def _save_cluster_map(zones: pd.DataFrame, mode: str, output_dir: Path) -> Path:
    fig, ax = plt.subplots(figsize=(10, 8))
    if gpd is not None:
        gdf = _prepare_geodata(zones)
        gdf.plot(
            ax=ax,
            column="cluster_label",
            categorical=True,
            cmap="tab10",
            markersize=45,
            alpha=0.9,
            legend=True,
            legend_kwds={"title": "Cluster"},
        )
        _add_basemap(ax)
        ax.set_axis_off()
    else:
        # Fallback if geopandas/contextily unavailable
        sns.scatterplot(data=zones, x="cell_lon", y="cell_lat", hue="cluster_label", palette="tab10", s=60, ax=ax)
        ax.grid(alpha=0.2, linestyle="--")
    ax.set_title(f"Morocco Economic Zones - Cluster Map ({mode})")
    out_path = output_dir / f"morocco_cluster_map_{mode}.png"
    fig.tight_layout()
    fig.savefig(out_path, dpi=220)
    plt.close(fig)
    return out_path


def _save_density_heatmap(zones: pd.DataFrame, mode: str, output_dir: Path) -> Path:
    fig, ax = plt.subplots(figsize=(10, 8))
    if gpd is not None:
        gdf = _prepare_geodata(zones)
        x = gdf.geometry.x.values
        y = gdf.geometry.y.values
    else:
        x = zones["cell_lon"].values
        y = zones["cell_lat"].values
    hb = ax.hexbin(
        x,
        y,
        C=zones["density_log"],
        gridsize=35,
        reduce_C_function=np.mean,
        cmap="YlOrRd",
        mincnt=1,
        alpha=0.72,
    )
    cb = fig.colorbar(hb, ax=ax)
    cb.set_label("Mean density_log")
    ax.set_title(f"Morocco Density Heatmap ({mode})")
    if gpd is not None:
        _add_basemap(ax)
        ax.set_axis_off()
    else:
        ax.set_xlabel("Longitude")
        ax.set_ylabel("Latitude")
        ax.grid(alpha=0.2, linestyle="--")
    out_path = output_dir / f"morocco_density_heatmap_{mode}.png"
    fig.tight_layout()
    fig.savefig(out_path, dpi=220)
    plt.close(fig)
    return out_path


def _save_capital_heatmap(zones: pd.DataFrame, mode: str, output_dir: Path) -> Path:
    fig, ax = plt.subplots(figsize=(10, 8))
    if gpd is not None:
        gdf = _prepare_geodata(zones)
        x = gdf.geometry.x.values
        y = gdf.geometry.y.values
    else:
        x = zones["cell_lon"].values
        y = zones["cell_lat"].values
    hb = ax.hexbin(
        x,
        y,
        C=zones["capital_mean"],
        gridsize=35,
        reduce_C_function=np.mean,
        cmap="viridis",
        mincnt=1,
        alpha=0.72,
    )
    cb = fig.colorbar(hb, ax=ax)
    cb.set_label("Mean capital_mean")
    ax.set_title(f"Morocco Capital Heatmap ({mode})")
    if gpd is not None:
        _add_basemap(ax)
        ax.set_axis_off()
    else:
        ax.set_xlabel("Longitude")
        ax.set_ylabel("Latitude")
        ax.grid(alpha=0.2, linestyle="--")
    out_path = output_dir / f"morocco_capital_heatmap_{mode}.png"
    fig.tight_layout()
    fig.savefig(out_path, dpi=220)
    plt.close(fig)
    return out_path


def _save_cluster_profile_heatmap(zones: pd.DataFrame, mode: str, output_dir: Path) -> Path:
    profile_cols = [
        "density_log",
        "active_rate",
        "capital_mean",
        "formal_ratio",
        "n_sectors_present",
    ]
    cols = [c for c in profile_cols if c in zones.columns]
    cluster_profile = zones.groupby("cluster_label")[cols].mean()
    # Min-max per feature for readability
    norm = (cluster_profile - cluster_profile.min()) / (cluster_profile.max() - cluster_profile.min() + 1e-9)

    fig, ax = plt.subplots(figsize=(8, 5))
    sns.heatmap(norm, annot=True, fmt=".2f", cmap="coolwarm", cbar_kws={"label": "Normalized level"}, ax=ax)
    ax.set_title(f"Cluster Economic Profile Heatmap ({mode})")
    ax.set_xlabel("Economic features")
    ax.set_ylabel("Cluster label")
    out_path = output_dir / f"cluster_profile_heatmap_{mode}.png"
    fig.tight_layout()
    fig.savefig(out_path, dpi=220)
    plt.close(fig)
    return out_path


def _write_manifest(mode: str, clf_metrics: dict, outputs: list[Path], output_dir: Path) -> Path:
    payload = {
        "mode": mode,
        "classifier_selected_model": clf_metrics.get("selected_model"),
        "classifier_test_f1_macro": clf_metrics.get("test_f1_macro"),
        "classifier_test_accuracy": clf_metrics.get("test_accuracy"),
        "generated_figures": [str(p) for p in outputs],
    }
    manifest_path = output_dir / f"visualization_manifest_{mode}.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    return manifest_path


def _export_to_report_figures(paths: list[Path]) -> list[Path]:
    report_dir = REPORTS_DIR / "figures"
    report_dir.mkdir(parents=True, exist_ok=True)
    exported = []
    for src in paths:
        dst = report_dir / src.name
        dst.write_bytes(src.read_bytes())
        exported.append(dst)
    return exported


def main() -> None:
    mode = DEFAULT_MODE
    if len(sys.argv) > 1:
        mode = sys.argv[1].strip().lower()
    if mode not in VALID_MODES:
        raise ValueError(f"Invalid mode '{mode}'. Allowed modes: {sorted(VALID_MODES)}")

    output_dir = ARTIFACTS_DIR / "figures"
    output_dir.mkdir(parents=True, exist_ok=True)

    zones, clf_metrics = _load_mode_artifacts(mode)
    outputs = [
        _save_cluster_map(zones, mode, output_dir),
        _save_density_heatmap(zones, mode, output_dir),
        _save_capital_heatmap(zones, mode, output_dir),
        _save_cluster_profile_heatmap(zones, mode, output_dir),
    ]
    report_outputs = _export_to_report_figures(outputs)
    manifest = _write_manifest(mode, clf_metrics, outputs, output_dir)

    logger.info("Generated %s figures for mode '%s'.", len(outputs), mode)
    for path in outputs:
        logger.info("Figure saved: %s", path)
    for path in report_outputs:
        logger.info("Figure exported to report folder: %s", path)
    if gpd is None or ctx is None:
        logger.warning("Geo map background disabled (geopandas/contextily unavailable).")
    logger.info("Visualization manifest: %s", manifest)


if __name__ == "__main__":
    main()
