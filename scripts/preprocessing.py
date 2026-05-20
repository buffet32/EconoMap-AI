# preprocessing.py
# Chargement du dataset et construction des pipelines sklearn.
# Le dataset dataset.csv est déjà propre (zéro NaN).
# Ce module construit les ColumnTransformers pour Modèle A et B.

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split

from config import (DATA_PATH, ID_COLS, TARGET_REG, TARGET_CLF, TARGET_B,
                    TEST_SIZE, RANDOM_STATE)
from features import engineer_features, get_feature_list_a, get_feature_list_b
from utils import get_logger

logger = get_logger("preprocessing")


def load_data() -> pd.DataFrame:
    """Charge dataset.csv et applique le feature engineering."""
    logger.info(f"Chargement : {DATA_PATH}")
    df = pd.read_csv(DATA_PATH, low_memory=False)
    logger.info(f"Shape brute : {df.shape}")

    # Supprimer colonnes identifiants — jamais features
    drop = [c for c in ID_COLS if c in df.columns]
    df.drop(columns=drop, inplace=True)
    logger.info(f"Colonnes ID supprimées : {drop}")

    # Feature engineering
    df = engineer_features(df)
    logger.info(f"Shape après feature engineering : {df.shape}")
    return df


def build_preprocessor_a(num_features: list, cat_features: list) -> ColumnTransformer:
    """
    ColumnTransformer pour Modèle A.
    - Numériques : StandardScaler
    - Catégorielles : OneHotEncoder (drop first pour éviter la multicolinéarité)
    """
    return ColumnTransformer(transformers=[
        ("num", StandardScaler(), num_features),
        ("cat", OneHotEncoder(drop="first", handle_unknown="ignore", sparse_output=False), cat_features),
    ], remainder="drop")


def build_preprocessor_b(num_features: list, cat_features: list) -> ColumnTransformer:
    """
    ColumnTransformer pour Modèle B.
    Même logique que A, sans sector_main (c'est la target).
    """
    return ColumnTransformer(transformers=[
        ("num", StandardScaler(), num_features),
        ("cat", OneHotEncoder(drop="first", handle_unknown="ignore", sparse_output=False), cat_features),
    ], remainder="drop")


def prepare_model_a(df: pd.DataFrame):
    """
    Prépare X_train, X_test, y_train, y_test pour Modèle A.
    Retourne deux versions : régression (score continu) et classification.

    ⚠️ Anti data-leakage :
    - pour la classification  : on n'utilise PAS attractivity_score comme feature
    - pour la régression      : on n'utilise PAS attractivity_class comme feature
    """
    num_feat, cat_feat = get_feature_list_a()

    # Vérifier que les features existent
    available = set(df.columns)
    num_feat = [f for f in num_feat if f in available]
    cat_feat = [f for f in cat_feat if f in available]

    X = df[num_feat + cat_feat]

    # Target régression
    y_reg = df[TARGET_REG].astype(float)

    # Target classification — encoder les labels texte en entiers
    y_clf_raw = df[TARGET_CLF].astype(str)
    le = LabelEncoder()
    y_clf = le.fit_transform(y_clf_raw)

    # Split stratifié sur la classification
    X_train, X_test, yr_train, yr_test, yc_train, yc_test = train_test_split(
        X, y_reg, y_clf,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y_clf
    )

    logger.info(f"Modèle A — train : {X_train.shape}  test : {X_test.shape}")
    logger.info(f"Classes : {le.classes_}")

    preprocessor = build_preprocessor_a(num_feat, cat_feat)

    return {
        "X_train"     : X_train,
        "X_test"      : X_test,
        "yr_train"    : yr_train,
        "yr_test"     : yr_test,
        "yc_train"    : yc_train,
        "yc_test"     : yc_test,
        "preprocessor": preprocessor,
        "label_encoder": le,
        "num_features" : num_feat,
        "cat_features" : cat_feat,
    }


def prepare_model_b(df: pd.DataFrame):
    """
    Prépare X_train, X_test, y_train, y_test pour Modèle B.
    Target : sector_main (multi-classe).
    """
    num_feat, cat_feat = get_feature_list_b()

    available = set(df.columns)
    num_feat = [f for f in num_feat if f in available]
    cat_feat = [f for f in cat_feat if f in available]

    X = df[num_feat + cat_feat]
    y_raw = df[TARGET_B].astype(str)

    le = LabelEncoder()
    y = le.fit_transform(y_raw)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y
    )

    logger.info(f"Modèle B — train : {X_train.shape}  test : {X_test.shape}")
    logger.info(f"Secteurs : {le.classes_}")

    preprocessor = build_preprocessor_b(num_feat, cat_feat)

    return {
        "X_train"      : X_train,
        "X_test"       : X_test,
        "y_train"      : y_train,
        "y_test"       : y_test,
        "preprocessor" : preprocessor,
        "label_encoder": le,
        "num_features" : num_feat,
        "cat_features" : cat_feat,
    }
