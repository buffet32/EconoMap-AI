# features.py
# Feature engineering appliqué au dataset ML final.
# Les features géo et sectorielles ont déjà été construites
# dans le pipeline de preprocessing (density_log, dist_casa_center,
# formal_ratio, sector_diversity). Ce fichier ajoute les features
# dérivées supplémentaires utiles pour l'entraînement.

import pandas as pd
import numpy as np

from config import NUM_FEATURES, CAT_FEATURES_A, SECTOR_FEATURE
from utils import get_logger

logger = get_logger("features")


def add_interaction_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Crée des features d'interaction entre variables économiques.
    Ces combinaisons capturent des effets non linéaires que
    les arbres peuvent exploiter mais que les features seules
    ne représentent pas.
    """
    df = df.copy()

    # Score de vitalité économique : densité × taux d'activité
    df["vitality"] = df["density_log"] * df["active_rate"]

    # Capital pondéré par l'activité : proxy de richesse réelle
    df["weighted_capital"] = df["capital_median"] * df["active_rate"]

    # Ratio densité réelle / totale : mesure la qualité GPS des entités
    df["gps_quality"] = np.where(
        df["entity_count_total"] > 0,
        df["entity_count_real"] / df["entity_count_total"],
        0.0
    )

    logger.info(f"Features d'interaction ajoutées : vitality, weighted_capital, gps_quality")
    return df


def add_city_aggregates(df: pd.DataFrame) -> pd.DataFrame:
    """
    Ajoute des statistiques agrégées au niveau ville.
    Permet au modèle de comparer une cellule à sa ville d'appartenance.
    """
    df = df.copy()

    city_stats = df.groupby("city").agg(
        city_avg_density    = ("density_log",    "mean"),
        city_avg_active     = ("active_rate",    "mean"),
        city_avg_capital    = ("capital_median", "mean"),
        city_n_sectors      = ("sector_main",    "nunique"),
    ).reset_index()

    df = df.merge(city_stats, on="city", how="left")

    # Position relative de la cellule par rapport à sa ville
    df["rel_density"] = df["density_log"]    / (df["city_avg_density"]  + 1e-6)
    df["rel_capital"] = df["capital_median"] / (df["city_avg_capital"]  + 1e-6)

    logger.info("Agrégats ville ajoutés : city_avg_*, rel_density, rel_capital")
    return df


def get_feature_list_a() -> list:
    """
    Retourne la liste complète des features pour le Modèle A
    (zone + secteur → score/classe d'attractivité).
    """
    base = NUM_FEATURES + [
        "vitality", "weighted_capital", "gps_quality",
        "city_avg_density", "city_avg_active", "city_avg_capital",
        "city_n_sectors", "rel_density", "rel_capital",
    ]
    # sector_main et city seront encodés via ColumnTransformer
    cat = CAT_FEATURES_A + [SECTOR_FEATURE]
    return base, cat


def get_feature_list_b() -> list:
    """
    Retourne la liste complète des features pour le Modèle B
    (zone → meilleur secteur).
    Exclut sector_main (c'est la target).
    """
    base = NUM_FEATURES + [
        "vitality", "weighted_capital", "gps_quality",
        "city_avg_density", "city_avg_active", "city_avg_capital",
        "city_n_sectors", "rel_density", "rel_capital",
    ]
    cat = ["city"]
    return base, cat


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Point d'entrée principal : applique toutes les transformations."""
    logger.info(f"Feature engineering — shape initiale : {df.shape}")
    df = add_interaction_features(df)
    df = add_city_aggregates(df)
    logger.info(f"Feature engineering — shape finale : {df.shape}")
    return df
