import numpy as np
import pandas as pd

from .config import NUM_FEATURES, CAT_FEATURES_A, SECTOR_FEATURE


def add_interaction_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["vitality"] = df["density_log"] * df["active_rate"]
    df["weighted_capital"] = df["capital_median"] * df["active_rate"]
    df["gps_quality"] = np.where(
        df["entity_count_total"] > 0,
        df["entity_count_real"] / df["entity_count_total"],
        0.0,
    )
    return df


def add_city_aggregates(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    city_stats = df.groupby("city").agg(
        city_avg_density=("density_log", "mean"),
        city_avg_active=("active_rate", "mean"),
        city_avg_capital=("capital_median", "mean"),
        city_n_sectors=("sector_main", "nunique"),
    ).reset_index()
    df = df.merge(city_stats, on="city", how="left")
    df["rel_density"] = df["density_log"] / (df["city_avg_density"] + 1e-6)
    df["rel_capital"] = df["capital_median"] / (df["city_avg_capital"] + 1e-6)
    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = add_interaction_features(df)
    df = add_city_aggregates(df)
    return df


def get_feature_list_a():
    base = NUM_FEATURES + [
        "vitality",
        "weighted_capital",
        "gps_quality",
        "city_avg_density",
        "city_avg_active",
        "city_avg_capital",
        "city_n_sectors",
        "rel_density",
        "rel_capital",
    ]
    cat = CAT_FEATURES_A + [SECTOR_FEATURE]
    return base, cat


def get_feature_list_b():
    base = NUM_FEATURES + [
        "vitality",
        "weighted_capital",
        "gps_quality",
        "city_avg_density",
        "city_avg_active",
        "city_avg_capital",
        "city_n_sectors",
        "rel_density",
        "rel_capital",
    ]
    return base, ["city"]
