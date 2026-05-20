"""
generate_geo_heatmap_geopandas.py
Version PROPRE avec GeoPandas + projection correcte (EPSG:3857)
"""

import warnings
warnings.filterwarnings("ignore")

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
import matplotlib.cm as cm

import geopandas as gpd
from shapely.geometry import box
import contextily as ctx

# ── CONFIG ─────────────────────────────────────────────
from config import DATA_PATH, REPORTS_DIR

OUT_DIR = REPORTS_DIR / "figures"
OUT_DIR.mkdir(parents=True, exist_ok=True)

GRID_KM = 1.5
LAT_DEG = GRID_KM / 111.0
LON_DEG = GRID_KM / 85.0

CMAP = mcolors.LinearSegmentedColormap.from_list(
    "attractivity",
    ["#D64045", "#F5C518", "#048A81"],
    N=256
)

# ── LOAD + GEO ─────────────────────────────────────────
def load_data():
    df = pd.read_csv(DATA_PATH, low_memory=False)

    df["lat_min"] = df["cell_lat"] - LAT_DEG / 2
    df["lat_max"] = df["cell_lat"] + LAT_DEG / 2
    df["lon_min"] = df["cell_lon"] - LON_DEG / 2
    df["lon_max"] = df["cell_lon"] + LON_DEG / 2

    return df


def to_geodf(df):
    df["geometry"] = df.apply(
        lambda r: box(r["lon_min"], r["lat_min"], r["lon_max"], r["lat_max"]),
        axis=1
    )

    gdf = gpd.GeoDataFrame(df, geometry="geometry", crs="EPSG:4326")

    # conversion vers Web Mercator (OBLIGATOIRE pour contextily)
    return gdf.to_crs(epsg=3857)


# ── UTIL ───────────────────────────────────────────────
def save(fig, name):
    path = OUT_DIR / name
    fig.savefig(path, dpi=200, bbox_inches="tight")
    plt.close(fig)
    print("Saved:", path)


def add_basemap(ax):
    ctx.add_basemap(
        ax,
        source=ctx.providers.CartoDB.Positron,
        zoom=10,
        alpha=0.7
    )


def add_colorbar(fig, ax, norm):
    sm = cm.ScalarMappable(norm=norm, cmap=CMAP)
    sm.set_array([])
    cbar = fig.colorbar(sm, ax=ax, fraction=0.03, pad=0.02)
    cbar.set_label("Score d'attractivité [0–100]")


# ── MAP 1 GLOBAL ───────────────────────────────────────
def map_global(df):
    print("[1] Global heatmap")

    df_cell = df.groupby("cell_id").agg(
        cell_lat=("cell_lat", "first"),
        cell_lon=("cell_lon", "first"),
        lat_min=("lat_min", "first"),
        lat_max=("lat_max", "first"),
        lon_min=("lon_min", "first"),
        lon_max=("lon_max", "first"),
        attractivity_score=("attractivity_score", "mean"),
    ).reset_index()

    gdf = to_geodf(df_cell)

    fig, ax = plt.subplots(figsize=(12, 10))

    norm = mcolors.Normalize(0, 100)

    gdf.plot(
        column="attractivity_score",
        cmap=CMAP,
        linewidth=0.2,
        edgecolor="white",
        alpha=0.85,
        ax=ax
    )

    add_basemap(ax)
    add_colorbar(fig, ax, norm)

    ax.set_title("Attractivité économique (global)")
    ax.set_axis_off()

    save(fig, "geo_heatmap_global.png")


# ── MAP 2 FORT ONLY ────────────────────────────────────
def map_fort(df):
    print("[2] Zones Fort")

    df_fort = df[df["attractivity_class"] == "Fort"]

    df_cell = df_fort.groupby("cell_id").agg(
        lat_min=("lat_min", "first"),
        lat_max=("lat_max", "first"),
        lon_min=("lon_min", "first"),
        lon_max=("lon_max", "first"),
        attractivity_score=("attractivity_score", "mean"),
    ).reset_index()

    gdf = to_geodf(df_cell)

    fig, ax = plt.subplots(figsize=(12, 10))

    gdf.plot(
        column="attractivity_score",
        cmap=CMAP,
        linewidth=0.3,
        edgecolor="white",
        alpha=0.9,
        ax=ax
    )

    add_basemap(ax)

    ax.set_title("Zones à forte attractivité")
    ax.set_axis_off()

    save(fig, "geo_heatmap_fort_only.png")


# ── MAP 3 BUBBLE ───────────────────────────────────────
def map_bubble(df):
    print("[3] Bubble map")

    df_cell = df.groupby("cell_id").agg(
        cell_lat=("cell_lat", "first"),
        cell_lon=("cell_lon", "first"),
        attractivity_score=("attractivity_score", "mean"),
        entity_count_real=("entity_count_real", "sum"),
    ).reset_index()

    gdf = gpd.GeoDataFrame(
        df_cell,
        geometry=gpd.points_from_xy(df_cell.cell_lon, df_cell.cell_lat),
        crs="EPSG:4326"
    ).to_crs(epsg=3857)

    fig, ax = plt.subplots(figsize=(12, 10))

    norm = mcolors.Normalize(0, 100)

    sizes = np.clip(
        df_cell["entity_count_real"] / df_cell["entity_count_real"].max() * 300,
        10, 300
    )

    gdf.plot(
        ax=ax,
        column="attractivity_score",
        cmap=CMAP,
        markersize=sizes,
        alpha=0.8,
        edgecolor="white",
        linewidth=0.5,
    )

    add_basemap(ax)
    add_colorbar(fig, ax, norm)

    ax.set_title("Densité vs attractivité")
    ax.set_axis_off()

    save(fig, "geo_heatmap_bubble.png")


def map_by_sector(df):
    print("[4] Heatmap par secteur (top 6)")

    TOP_SECTORS = [
        "Commerce", "Construction", "Information Technology",
        "Healthcare", "Transport", "Finance"
    ]

    sectors = [s for s in TOP_SECTORS if s in df["sector_main"].unique()]

    fig, axes = plt.subplots(2, 3, figsize=(18, 12))
    axes = axes.flatten()

    norm = mcolors.Normalize(0, 100)

    # base cellules (fond gris)
    df_cells = df.groupby("cell_id").agg(
        lat_min=("lat_min", "first"),
        lat_max=("lat_max", "first"),
        lon_min=("lon_min", "first"),
        lon_max=("lon_max", "first"),
    ).reset_index()

    gdf_base = to_geodf(df_cells)

    for i, sector in enumerate(sectors[:6]):
        ax = axes[i]

        # fond gris (toutes cellules)
        gdf_base.plot(
            ax=ax,
            color="#E0E0E0",
            edgecolor="white",
            linewidth=0.1,
            alpha=0.5
        )

        df_s = df[df["sector_main"] == sector]

        if df_s.empty:
            ax.set_title(f"{sector}\n(no data)")
            ax.set_axis_off()
            continue

        df_s_cell = df_s.groupby("cell_id").agg(
            lat_min=("lat_min", "first"),
            lat_max=("lat_max", "first"),
            lon_min=("lon_min", "first"),
            lon_max=("lon_max", "first"),
            attractivity_score=("attractivity_score", "mean"),
        ).reset_index()

        gdf_s = to_geodf(df_s_cell)

        gdf_s.plot(
            ax=ax,
            column="attractivity_score",
            cmap=CMAP,
            linewidth=0.2,
            edgecolor="white",
            alpha=0.9,
        )

        add_basemap(ax)

        n_cells = df_s_cell.shape[0]
        avg_score = df_s_cell["attractivity_score"].mean()

        ax.set_title(
            f"{sector}\n(n={n_cells}, score={avg_score:.1f})",
            fontsize=10
        )
        ax.set_axis_off()

    # supprimer axes inutilisés
    for j in range(len(sectors), 6):
        axes[j].axis("off")

    # colorbar globale
    sm = cm.ScalarMappable(norm=norm, cmap=CMAP)
    sm.set_array([])

    cbar = fig.colorbar(sm, ax=axes, fraction=0.02, pad=0.02)
    cbar.set_label("Score d'attractivité")

    fig.suptitle("Attractivité par secteur", fontsize=14)

    save(fig, "geo_heatmap_by_sector.png")


def map_smooth_heatmap(df):
    print("[5] Smooth heatmap (KDE)")

    from scipy.stats import gaussian_kde

    # ── Agrégation cellule → point
    df_cell = df.groupby("cell_id").agg(
        cell_lat=("cell_lat", "first"),
        cell_lon=("cell_lon", "first"),
        attractivity_score=("attractivity_score", "mean"),
    ).reset_index()

    # ── Geo → projection Web Mercator
    gdf = gpd.GeoDataFrame(
        df_cell,
        geometry=gpd.points_from_xy(df_cell.cell_lon, df_cell.cell_lat),
        crs="EPSG:4326"
    ).to_crs(epsg=3857)

    x = gdf.geometry.x.values
    y = gdf.geometry.y.values
    weights = gdf["attractivity_score"].values

    # ── KDE pondérée
    kde = gaussian_kde(
        np.vstack([x, y]),
        weights=weights,
        bw_method=0.15   # 🔥 param clé (smoothness)
    )

    # ── Grille raster
    xmin, ymin, xmax, ymax = gdf.total_bounds
    xx, yy = np.mgrid[
        xmin:xmax:500j,
        ymin:ymax:500j
    ]

    positions = np.vstack([xx.ravel(), yy.ravel()])
    z = np.reshape(kde(positions).T, xx.shape)

    # ── Plot
    fig, ax = plt.subplots(figsize=(12, 10))

    img = ax.imshow(
        np.rot90(z),
        cmap=CMAP,
        extent=[xmin, xmax, ymin, ymax],
        alpha=0.75
    )

    add_basemap(ax)

    cbar = fig.colorbar(img, ax=ax, fraction=0.03, pad=0.02)
    cbar.set_label("Densité d'attractivité (lissée)")

    ax.set_title("Heatmap fluide — attractivité économique")
    ax.set_axis_off()

    save(fig, "geo_heatmap_smooth.png")    

# ── MAIN ───────────────────────────────────────────────
def main():
    print("=== GEO HEATMAP GENERATION ===")

    if not DATA_PATH.exists():
        print("Missing dataset")
        return

    df = load_data()

    map_global(df)
    map_fort(df)
    map_bubble(df)
    map_by_sector(df)
    map_smooth_heatmap(df)

    print("DONE")


if __name__ == "__main__":
    main()