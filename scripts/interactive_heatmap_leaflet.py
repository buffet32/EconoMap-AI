"""
interactive_heatmap_leaflet.py
Génère une heatmap interactive HTML avec Leaflet (Folium)
"""

import pandas as pd
import folium
from folium.plugins import HeatMap

from config import DATA_PATH, OUTPUTS_DIR

OUT_FILE = OUTPUTS_DIR / "heatmap_interactive_leaflet.html"

def main():
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
    df = pd.read_csv(DATA_PATH)

    # agrégation par cellule
    df_cell = df.groupby("cell_id").agg(
        lat=("cell_lat", "first"),
        lon=("cell_lon", "first"),
        score=("attractivity_score", "mean")
    ).reset_index()

    # centre carte
    center_lat = df_cell["lat"].mean()
    center_lon = df_cell["lon"].mean()

    m = folium.Map(
        location=[center_lat, center_lon],
        zoom_start=9,
        tiles="cartodbpositron"
    )

    # préparation données heatmap
    heat_data = [
        [row["lat"], row["lon"], row["score"]]
        for _, row in df_cell.iterrows()
    ]

    HeatMap(
        heat_data,
        radius=25,
        blur=20,
        max_zoom=13
    ).add_to(m)

    m.save(str(OUT_FILE))
    print("Saved:", OUT_FILE)


if __name__ == "__main__":
    main()