# explain.py
# Explicabilité des modèles via SHAP.
# Génère feature importance globale et valeurs SHAP par observation.

import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd

try:
    import shap
    HAS_SHAP = True
except ImportError:
    HAS_SHAP = False

from preprocessing import load_data, prepare_model_a, prepare_model_b
from config import ARTIFACTS_DIR, SHAP_SAMPLE_SIZE
from utils import get_logger, load_artifact

logger = get_logger("explain")


def get_feature_names(pipeline) -> list:
    """Extrait les noms de features après ColumnTransformer."""
    try:
        prep = pipeline.named_steps["preprocessor"]
        names = []
        for name, transformer, cols in prep.transformers_:
            if name == "num":
                names += cols
            elif hasattr(transformer, "get_feature_names_out"):
                names += list(transformer.get_feature_names_out(cols))
            else:
                names += cols
        return names
    except Exception:
        return []


def explain_tree_model(pipeline, X, model_name: str, feature_names: list = None):
    """
    Calcule les SHAP values pour un modèle arbre (RF, XGB, LGB).
    Utilise TreeExplainer — rapide et exact pour les tree-based models.
    """
    if not HAS_SHAP:
        logger.warning("SHAP non installé. pip install shap")
        return None

    logger.info(f"Calcul SHAP pour {model_name}...")

    # Transformer X via le preprocessor
    prep = pipeline.named_steps["preprocessor"]
    model = pipeline.named_steps["model"]

    X_transformed = prep.transform(X)

    # Échantillonner pour la vitesse
    n = min(SHAP_SAMPLE_SIZE, len(X_transformed))
    idx = np.random.choice(len(X_transformed), n, replace=False)
    X_sample = X_transformed[idx]

    if feature_names is None:
        feature_names = get_feature_names(pipeline)
        if not feature_names:
            feature_names = [f"feature_{i}" for i in range(X_sample.shape[1])]

    try:
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_sample)

        # Pour la classification multi-classe, shap_values est une liste
        if isinstance(shap_values, list):
            # Moyenne des valeurs absolues sur toutes les classes
            shap_abs = np.mean([np.abs(sv) for sv in shap_values], axis=0)
        else:
            shap_abs = np.abs(shap_values)

        # Feature importance globale (moyenne des |SHAP values|)
        mean_shap = shap_abs.mean(axis=0)
        importance_df = pd.DataFrame({
            "feature"         : feature_names[:len(mean_shap)],
            "mean_abs_shap"   : mean_shap,
        }).sort_values("mean_abs_shap", ascending=False)

        out_path = ARTIFACTS_DIR / f"{model_name}_feature_importance.csv"
        importance_df.to_csv(out_path, index=False)
        logger.info(f"  Feature importance sauvegardée : {out_path}")
        logger.info(f"\n  Top 10 features :\n{importance_df.head(10).to_string(index=False)}")

        # SHAP values brutes (échantillon)
        if isinstance(shap_values, list):
            shap_flat = shap_values[0]  # classe 0 pour référence
        else:
            shap_flat = shap_values

        shap_df = pd.DataFrame(
            shap_flat,
            columns=feature_names[:shap_flat.shape[1]]
        )
        shap_out = ARTIFACTS_DIR / f"{model_name}_shap_values.csv"
        shap_df.to_csv(shap_out, index=False)
        logger.info(f"  SHAP values sauvegardées : {shap_out}")

        return importance_df

    except Exception as e:
        logger.error(f"Erreur SHAP ({model_name}) : {e}")
        return None


def explain_with_permutation(pipeline, X, y, model_name: str, scoring="r2"):
    """
    Fallback : permutation importance si SHAP échoue ou non dispo.
    Compatible avec tous les modèles sklearn.
    """
    from sklearn.inspection import permutation_importance

    logger.info(f"Permutation importance pour {model_name}...")
    prep  = pipeline.named_steps["preprocessor"]
    model = pipeline.named_steps["model"]

    X_t = prep.transform(X)
    result = permutation_importance(model, X_t, y,
                                    n_repeats=10,
                                    random_state=42,
                                    scoring=scoring)

    feature_names = get_feature_names(pipeline)
    if not feature_names:
        feature_names = [f"f_{i}" for i in range(X_t.shape[1])]

    imp_df = pd.DataFrame({
        "feature"    : feature_names[:len(result.importances_mean)],
        "importance" : result.importances_mean,
        "std"        : result.importances_std,
    }).sort_values("importance", ascending=False)

    out = ARTIFACTS_DIR / f"{model_name}_permutation_importance.csv"
    imp_df.to_csv(out, index=False)
    logger.info(f"  Permutation importance sauvegardée : {out}")
    logger.info(f"\n  Top 10 :\n{imp_df.head(10).to_string(index=False)}")
    return imp_df


def main():
    logger.info("Chargement des données et modèles pour explicabilité...")
    df = load_data()

    # ── Modèle A Régression ───────────────────────────────────
    data_a = prepare_model_a(df)
    try:
        pipe_reg = load_artifact("model_a_regression")
        logger.info("\n═══ SHAP — Modèle A Régression ═══")
        result = explain_tree_model(
            pipe_reg, data_a["X_test"],
            "model_a_regression"
        )
        if result is None:
            explain_with_permutation(
                pipe_reg, data_a["X_test"], data_a["yr_test"],
                "model_a_regression", scoring="r2"
            )
    except FileNotFoundError:
        logger.warning("model_a_regression non trouvé.")

    # ── Modèle A Classification ───────────────────────────────
    try:
        pipe_clf = load_artifact("model_a_classification")
        logger.info("\n═══ SHAP — Modèle A Classification ═══")
        result = explain_tree_model(
            pipe_clf, data_a["X_test"],
            "model_a_classification"
        )
        if result is None:
            explain_with_permutation(
                pipe_clf, data_a["X_test"], data_a["yc_test"],
                "model_a_classification", scoring="f1_weighted"
            )
    except FileNotFoundError:
        logger.warning("model_a_classification non trouvé.")

    # ── Modèle B ──────────────────────────────────────────────
    data_b = prepare_model_b(df)
    try:
        pipe_b = load_artifact("model_b")
        logger.info("\n═══ SHAP — Modèle B ═══")
        result = explain_tree_model(
            pipe_b, data_b["X_test"],
            "model_b"
        )
        if result is None:
            explain_with_permutation(
                pipe_b, data_b["X_test"], data_b["y_test"],
                "model_b", scoring="f1_weighted"
            )
    except FileNotFoundError:
        logger.warning("model_b non trouvé.")

    logger.info("\n✅ Explicabilité terminée — fichiers dans model/artifacts/")


if __name__ == "__main__":
    main()
