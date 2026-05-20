# evaluate.py
# Évaluation complète des modèles entraînés sur le test set.
# Métriques : RMSE (primaire régression), F1-macro (primaire classification),
# Top-K accuracy, F1 par classe, confusion matrix.

import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
from sklearn.metrics import (
    r2_score, mean_absolute_error, mean_squared_error,
    accuracy_score, f1_score, precision_score, recall_score,
    classification_report, confusion_matrix,
    top_k_accuracy_score,
)

from config import ARTIFACTS_DIR
from preprocessing import load_data, prepare_model_a, prepare_model_b
from utils import get_logger, load_artifact, save_metrics

logger = get_logger("evaluate")


def evaluate_regression(pipeline, X_test, y_test, name="model_a_regression"):
    """
    Métriques régression.
    Primaire : RMSE — pénalise les grandes erreurs.
    Secondaires : MAE (robuste outliers), R² (variance expliquée).
    """
    y_pred = pipeline.predict(X_test)
    residuals = np.array(y_test) - y_pred

    metrics = {
        # ── Primaire ──────────────────────────────────────────
        "rmse"       : round(float(np.sqrt(mean_squared_error(y_test, y_pred))), 4),
        # ── Secondaires ───────────────────────────────────────
        "mae"        : round(float(mean_absolute_error(y_test, y_pred)), 4),
        "r2"         : round(float(r2_score(y_test, y_pred)), 4),
        # ── Diagnostics ───────────────────────────────────────
        "max_error"  : round(float(np.max(np.abs(residuals))), 4),
        "mean_bias"  : round(float(np.mean(residuals)), 4),
        "residual_std": round(float(residuals.std()), 4),
        "residual_p5" : round(float(np.percentile(residuals, 5)), 4),
        "residual_p95": round(float(np.percentile(residuals, 95)), 4),
    }

    logger.info(f"\n── Évaluation Régression ({name}) ──")
    logger.info(f"  [PRIMAIRE] RMSE : {metrics['rmse']}")
    logger.info(f"  MAE             : {metrics['mae']}")
    logger.info(f"  R²              : {metrics['r2']}")
    logger.info(f"  Max error       : {metrics['max_error']}")
    logger.info(f"  Biais moyen     : {metrics['mean_bias']}")
    logger.info(f"  Résidus P5/P95  : {metrics['residual_p5']} / {metrics['residual_p95']}")

    save_metrics(metrics, f"{name}_eval")

    pd.DataFrame({
        "y_true": np.array(y_test),
        "y_pred": y_pred,
        "residual": residuals,
    }).to_csv(ARTIFACTS_DIR / f"{name}_eval.csv", index=False)

    return metrics


def evaluate_classification(pipeline, X_test, y_test, label_encoder,
                             name="model", top_k=2):
    """
    Métriques classification.
    Primaire : F1-macro (toutes classes à poids égal).
    Secondaires : accuracy, F1 par classe, Top-K accuracy, confusion matrix.

    top_k : 2 pour Modèle A (3 classes), 3 pour Modèle B (13 classes).
    """
    y_pred      = pipeline.predict(X_test)
    classes     = label_encoder.classes_
    n_classes   = len(classes)

    # ── F1 par classe ──────────────────────────────────────────
    f1_per_class = f1_score(y_test, y_pred, average=None, zero_division=0)
    f1_dict = {f"f1_{cls}": round(float(v), 4)
               for cls, v in zip(classes, f1_per_class)}

    # ── Top-K accuracy ─────────────────────────────────────────
    top_k_val = None
    top_k_key = f"top_{top_k}_accuracy"
    try:
        y_proba = pipeline.predict_proba(X_test)
        k_eff   = min(top_k, n_classes)
        top_k_val = round(float(top_k_accuracy_score(y_test, y_proba, k=k_eff)), 4)
    except Exception:
        top_k_val = None

    # ── Métriques principales ──────────────────────────────────
    metrics = {
        # Primaire
        "f1_macro"        : round(float(f1_score(y_test, y_pred, average="macro",
                                                  zero_division=0)), 4),
        # Secondaires
        "accuracy"        : round(float(accuracy_score(y_test, y_pred)), 4),
        "f1_weighted"     : round(float(f1_score(y_test, y_pred, average="weighted",
                                                  zero_division=0)), 4),
        "precision_macro" : round(float(precision_score(y_test, y_pred, average="macro",
                                                         zero_division=0)), 4),
        "recall_macro"    : round(float(recall_score(y_test, y_pred, average="macro",
                                                      zero_division=0)), 4),
        top_k_key         : top_k_val,
        # F1 par classe
        **f1_dict,
    }

    logger.info(f"\n── Évaluation Classification ({name}) ──")
    logger.info(f"  [PRIMAIRE] F1-macro     : {metrics['f1_macro']}")
    logger.info(f"  Accuracy                : {metrics['accuracy']}")
    logger.info(f"  F1-weighted             : {metrics['f1_weighted']}")
    logger.info(f"  {top_k_key:<25s}: {top_k_val}")
    logger.info(f"\n  F1 par classe :")
    for cls, v in f1_dict.items():
        logger.info(f"    {cls:<30s}: {v}")
    logger.info(f"\n{classification_report(y_test, y_pred, target_names=classes, zero_division=0)}")

    # Confusion matrix
    cm    = confusion_matrix(y_test, y_pred)
    cm_df = pd.DataFrame(cm, index=classes, columns=classes)
    logger.info(f"\n  Matrice de confusion :\n{cm_df.to_string()}")
    cm_df.to_csv(ARTIFACTS_DIR / f"{name}_confusion_matrix.csv")

    save_metrics(metrics, f"{name}_eval")

    pd.DataFrame({
        "y_true" : label_encoder.inverse_transform(y_test),
        "y_pred" : label_encoder.inverse_transform(y_pred),
        "correct": (np.array(y_test) == np.array(y_pred)).astype(int),
    }).to_csv(ARTIFACTS_DIR / f"{name}_eval_predictions.csv", index=False)

    return metrics


def main():
    logger.info("Chargement des données et modèles...")
    df = load_data()

    # ── Modèle A ──────────────────────────────────────────────
    data_a = prepare_model_a(df)
    try:
        pipe_reg = load_artifact("model_a_regression")
        le_a     = load_artifact("model_a_label_encoder")
        pipe_clf = load_artifact("model_a_classification")

        logger.info("\n═══ MODÈLE A ═══")
        evaluate_regression(pipe_reg,
                            data_a["X_test"], data_a["yr_test"],
                            name="model_a_regression")
        evaluate_classification(pipe_clf,
                                data_a["X_test"], data_a["yc_test"],
                                le_a, name="model_a_classification",
                                top_k=2)   # 3 classes → Top-2
    except FileNotFoundError as e:
        logger.warning(f"Modèle A non trouvé : {e}. Lance train_model_a.py d'abord.")

    # ── Modèle B ──────────────────────────────────────────────
    data_b = prepare_model_b(df)
    try:
        pipe_b = load_artifact("model_b")
        le_b   = load_artifact("model_b_label_encoder")

        logger.info("\n═══ MODÈLE B ═══")
        evaluate_classification(pipe_b,
                                data_b["X_test"], data_b["y_test"],
                                le_b, name="model_b",
                                top_k=3)   # 13 classes → Top-3
    except FileNotFoundError as e:
        logger.warning(f"Modèle B non trouvé : {e}. Lance train_model_b.py d'abord.")

    logger.info("\n✅ Évaluation terminée — fichiers dans model/artifacts/")


if __name__ == "__main__":
    main()
