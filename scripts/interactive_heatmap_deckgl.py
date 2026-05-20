"""
interactive_heatmap_deckgl.py
Heatmap interactive haute qualité avec deck.gl
"""

import pandas as pd
import pydeck as pdk

from config import DATA_PATH, OUTPUTS_DIR

OUT_FILE = OUTPUTS_DIR / "heatmap_interactive_deckgl.html"

def main():
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
    df = pd.read_csv(DATA_PATH)

    df_cell = df.groupby("cell_id").agg(
        lat=("cell_lat", "first"),
        lon=("cell_lon", "first"),
        score=("attractivity_score", "mean")
    ).reset_index()

    # normalisation score (important pour rendu)
    df_cell["weight"] = df_cell["score"] / 100.0

    layer = pdk.Layer(
        "HeatmapLayer",
        data=df_cell,
        get_position='[lon, lat]',
        get_weight="weight",
        radiusPixels=60,
        intensity=1,
        threshold=0.03,
    )

    view_state = pdk.ViewState(
        latitude=df_cell["lat"].mean(),
        longitude=df_cell["lon"].mean(),
        zoom=9,
        pitch=40,
    )

    deck = pdk.Deck(
        layers=[layer],
        initial_view_state=view_state,
        map_style="mapbox://styles/mapbox/light-v9",
        tooltip={"text": "Score: {score}"}
    )

    deck.to_html(str(OUT_FILE))
    print("Saved:", OUT_FILE)


if __name__ == "__main__":
    main()