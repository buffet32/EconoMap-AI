# train_model_b.py
# Entraîne Modèle B : features zone → sector_main (multi-classe)
# "Quel est le meilleur secteur pour cette zone ?"

import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import accuracy_score, f1_score, classification_report

try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

try:
    from lightgbm import LGBMClassifier
    HAS_LGB = True
except ImportError:
    HAS_LGB = False

from preprocessing import load_data, prepare_model_b
from config import CV_FOLDS, RANDOM_STATE
from config import ARTIFACTS_DIR
from utils import get_logger, save_artifact, save_metrics

logger = get_logger("train_model_b")


def get_candidates():
    models = {
        "RandomForest": RandomForestClassifier(
            random_state=RANDOM_STATE, n_jobs=-1,
            class_weight="balanced", n_estimators=200
        ),
    }
    if HAS_XGB:
        models["XGBoost"] = XGBClassifier(
            random_state=RANDOM_STATE, verbosity=0,
            n_jobs=-1, use_label_encoder=False,
            eval_metric="mlogloss", n_estimators=200
        )
    if HAS_LGB:
        models["LightGBM"] = LGBMClassifier(
            random_state=RANDOM_STATE, verbosity=-1,
            n_jobs=-1, class_weight="balanced", n_estimators=200
        )
    return models


def train(data: dict) -> dict:
    logger.info("=" * 50)
    logger.info("MODÈLE B — CLASSIFICATION MULTI-CLASSE (sector_main)")
    logger.info("=" * 50)

    X_train = data["X_train"]
    y_train = data["y_train"]
    X_test  = data["X_test"]
    y_test  = data["y_test"]
    prep    = data["preprocessor"]
    le      = data["label_encoder"]

    logger.info(f"  Secteurs cibles ({len(le.classes_)}) : {list(le.classes_)}")

    skf = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    results = {}

    for name, model in get_candidates().items():
        pipe = Pipeline([("preprocessor", prep), ("model", model)])
        f1_scores = cross_val_score(pipe, X_train, y_train,
                                    cv=skf, scoring="f1_macro", n_jobs=-1)
        acc_scores = cross_val_score(pipe, X_train, y_train,
                                     cv=skf, scoring="accuracy", n_jobs=-1)
        logger.info(f"  {name:15s}  CV F1-macro : {f1_scores.mean():.4f} ± {f1_scores.std():.4f}"
                    f"  |  CV Acc : {acc_scores.mean():.4f} ± {acc_scores.std():.4f}")
        results[name] = {
            "cv_f1_macro_mean" : float(f1_scores.mean()),
            "cv_f1_macro_std"  : float(f1_scores.std()),
            "cv_acc_mean": float(acc_scores.mean()),
        }

    best_name = max(results, key=lambda k: results[k]["cv_f1_macro_mean"])
    logger.info(f"\n  ✅ Meilleur modèle : {best_name}")

    # Ré-entraîner sur tout le train
    best_model = get_candidates()[best_name]
    best_pipe  = Pipeline([("preprocessor", prep), ("model", best_model)])
    best_pipe.fit(X_train, y_train)

    # Évaluation test
    y_pred = best_pipe.predict(X_test)
    test_metrics = {
        "model"            : best_name,
        "test_accuracy"    : round(accuracy_score(y_test, y_pred), 4),
        "test_f1_weighted" : round(f1_score(y_test, y_pred, average="weighted"), 4),
        "test_f1_macro"    : round(f1_score(y_test, y_pred, average="macro"), 4),
        "cv_results"       : results,
        "classes"          : list(le.classes_),
    }

    logger.info(f"  Test Accuracy    : {test_metrics['test_accuracy']}")
    logger.info(f"  Test F1-weighted : {test_metrics['test_f1_weighted']}")
    logger.info(f"  Test F1-macro    : {test_metrics['test_f1_macro']}")
    logger.info(f"\n{classification_report(y_test, y_pred, target_names=le.classes_)}")

    save_artifact(best_pipe, "model_b")
    save_artifact(le, "model_b_label_encoder")
    save_metrics(test_metrics, "model_b")

    preds_df = pd.DataFrame({
        "y_true": le.inverse_transform(y_test),
        "y_pred": le.inverse_transform(y_pred),
    })
    preds_df.to_csv(ARTIFACTS_DIR / "model_b_predictions.csv", index=False)

    return {"pipeline": best_pipe, "metrics": test_metrics, "label_encoder": le}


def main():
    df   = load_data()
    data = prepare_model_b(df)
    result = train(data)
    logger.info("\n✅ Modèle B — entraînement terminé.")
    logger.info(f"   Accuracy : {result['metrics']['test_accuracy']}")
    logger.info(f"   F1w      : {result['metrics']['test_f1_weighted']}")


if __name__ == "__main__":
    main()
