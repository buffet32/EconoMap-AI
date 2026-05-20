# train_model_a.py
# Entraîne Modèle A : zone + secteur → attractivity_score (régression)
#                                    → attractivity_class (classification)
# Compare Random Forest, XGBoost, LightGBM via cross-validation.
# Sauvegarde le meilleur modèle pour chaque tâche.

import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.model_selection import StratifiedKFold, KFold, cross_val_score, GridSearchCV
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

try:
    from xgboost import XGBRegressor, XGBClassifier
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

try:
    from lightgbm import LGBMRegressor, LGBMClassifier
    HAS_LGB = True
except ImportError:
    HAS_LGB = False

from preprocessing import load_data, prepare_model_a
from config import CV_FOLDS, RANDOM_STATE, RF_PARAM_GRID, XGB_PARAM_GRID, LGB_PARAM_GRID
from config import ARTIFACTS_DIR
from utils import get_logger, save_artifact, save_metrics

logger = get_logger("train_model_a")


# ── Registre des modèles ─────────────────────────────────────
def get_regression_candidates():
    models = {
        "RandomForest": RandomForestRegressor(random_state=RANDOM_STATE, n_jobs=-1),
    }
    if HAS_XGB:
        models["XGBoost"] = XGBRegressor(random_state=RANDOM_STATE,
                                          verbosity=0, n_jobs=-1)
    if HAS_LGB:
        models["LightGBM"] = LGBMRegressor(random_state=RANDOM_STATE,
                                            verbosity=-1, n_jobs=-1)
    return models


def get_classification_candidates():
    models = {
        "RandomForest": RandomForestClassifier(random_state=RANDOM_STATE,
                                               n_jobs=-1, class_weight="balanced"),
    }
    if HAS_XGB:
        models["XGBoost"] = XGBClassifier(random_state=RANDOM_STATE,
                                           verbosity=0, n_jobs=-1,
                                           use_label_encoder=False,
                                           eval_metric="mlogloss")
    if HAS_LGB:
        models["LightGBM"] = LGBMClassifier(random_state=RANDOM_STATE,
                                             verbosity=-1, n_jobs=-1,
                                             class_weight="balanced")
    return models


# ── Entraînement régression ──────────────────────────────────
def train_regression(data: dict) -> dict:
    logger.info("=" * 50)
    logger.info("MODÈLE A — RÉGRESSION (attractivity_score)")
    logger.info("=" * 50)

    X_train = data["X_train"]
    y_train = data["yr_train"]
    X_test  = data["X_test"]
    y_test  = data["yr_test"]
    prep    = data["preprocessor"]

    kf = KFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    results = {}

    for name, model in get_regression_candidates().items():
        pipe = Pipeline([("preprocessor", prep), ("model", model)])
        scores = cross_val_score(pipe, X_train, y_train,
                                 cv=kf, scoring="neg_root_mean_squared_error", n_jobs=-1)
        logger.info(f"  {name:15s} CV neg-RMSE : {scores.mean():.4f} ± {scores.std():.4f}")
        results[name] = {"cv_neg_rmse_mean": scores.mean(), "cv_neg_rmse_std": scores.std()}

    # Meilleur modèle par CV
    best_name = max(results, key=lambda k: results[k]["cv_neg_rmse_mean"])
    logger.info(f"\n  ✅ Meilleur modèle régression : {best_name}")

    # Ré-entraîner sur tout le train set
    best_model = get_regression_candidates()[best_name]
    best_pipe  = Pipeline([("preprocessor", prep), ("model", best_model)])
    best_pipe.fit(X_train, y_train)

    # Évaluation test
    y_pred = best_pipe.predict(X_test)
    test_metrics = {
        "model"   : best_name,
        "test_r2" : round(r2_score(y_test, y_pred), 4),
        "test_mae": round(mean_absolute_error(y_test, y_pred), 4),
        "test_rmse": round(np.sqrt(mean_squared_error(y_test, y_pred)), 4),
        "cv_results": results,
    }
    logger.info(f"  Test R²   : {test_metrics['test_r2']}")
    logger.info(f"  Test MAE  : {test_metrics['test_mae']}")
    logger.info(f"  Test RMSE : {test_metrics['test_rmse']}")

    save_artifact(best_pipe, "model_a_regression")
    save_metrics(test_metrics, "model_a_regression")

    # Prédictions test
    preds_df = pd.DataFrame({
        "y_true": y_test.values,
        "y_pred": y_pred
    })
    preds_df.to_csv(ARTIFACTS_DIR / "model_a_regression_predictions.csv", index=False)

    return {"pipeline": best_pipe, "metrics": test_metrics}


# ── Entraînement classification ──────────────────────────────
def train_classification(data: dict) -> dict:
    logger.info("=" * 50)
    logger.info("MODÈLE A — CLASSIFICATION (attractivity_class)")
    logger.info("=" * 50)

    X_train = data["X_train"]
    y_train = data["yc_train"]
    X_test  = data["X_test"]
    y_test  = data["yc_test"]
    prep    = data["preprocessor"]
    le      = data["label_encoder"]

    skf = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    results = {}

    for name, model in get_classification_candidates().items():
        pipe = Pipeline([("preprocessor", prep), ("model", model)])
        scores = cross_val_score(pipe, X_train, y_train,
                                 cv=skf, scoring="f1_macro", n_jobs=-1)
        logger.info(f"  {name:15s} CV F1-macro : {scores.mean():.4f} ± {scores.std():.4f}")
        results[name] = {"cv_f1_macro_mean": scores.mean(), "cv_f1_macro_std": scores.std()}

    best_name = max(results, key=lambda k: results[k]["cv_f1_macro_mean"])
    logger.info(f"\n  ✅ Meilleur modèle classification : {best_name}")

    best_model = get_classification_candidates()[best_name]
    best_pipe  = Pipeline([("preprocessor", prep), ("model", best_model)])
    best_pipe.fit(X_train, y_train)

    from sklearn.metrics import (accuracy_score, f1_score,
                                  classification_report, confusion_matrix)
    y_pred = best_pipe.predict(X_test)
    test_metrics = {
        "model"       : best_name,
        "test_accuracy": round(accuracy_score(y_test, y_pred), 4),
        "test_f1_weighted": round(f1_score(y_test, y_pred, average="weighted"), 4),
        "test_f1_macro"   : round(f1_score(y_test, y_pred, average="macro"), 4),
        "cv_results"  : results,
        "classes"     : list(le.classes_),
    }
    logger.info(f"  Test Accuracy : {test_metrics['test_accuracy']}")
    logger.info(f"  Test F1-weighted : {test_metrics['test_f1_weighted']}")
    logger.info(f"\n{classification_report(y_test, y_pred, target_names=le.classes_)}")

    save_artifact(best_pipe, "model_a_classification")
    save_artifact(le, "model_a_label_encoder")
    save_metrics(test_metrics, "model_a_classification")

    preds_df = pd.DataFrame({
        "y_true"      : le.inverse_transform(y_test),
        "y_pred"      : le.inverse_transform(y_pred),
    })
    preds_df.to_csv(ARTIFACTS_DIR / "model_a_classification_predictions.csv", index=False)

    return {"pipeline": best_pipe, "metrics": test_metrics, "label_encoder": le}


# ── Main ─────────────────────────────────────────────────────
def main():
    df   = load_data()
    data = prepare_model_a(df)

    reg_result = train_regression(data)
    clf_result = train_classification(data)

    logger.info("\n✅ Modèle A — entraînement terminé.")
    logger.info(f"   Régression    → R²  : {reg_result['metrics']['test_r2']}")
    logger.info(f"   Classification → F1w : {clf_result['metrics']['test_f1_weighted']}")


if __name__ == "__main__":
    main()
