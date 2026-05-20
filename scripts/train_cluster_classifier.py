import json
import sys

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.inspection import permutation_importance
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from config import ARTIFACTS_DIR, RANDOM_STATE, TEST_SIZE
from utils import get_logger, save_artifact


logger = get_logger("train_cluster_classifier")
DEFAULT_MODE = "typology"
VALID_MODES = {"typology", "anomaly"}


def _compute_shap_outputs(best_pipe: Pipeline, X_train: pd.DataFrame, mode: str) -> dict:
    """
    Compute SHAP-based global explainability when shap is available.
    Returns metadata for metrics JSON.
    """
    try:
        import shap  # type: ignore
    except Exception:
        logger.info("SHAP not installed; skipping SHAP explainability artifacts.")
        return {"status": "not_available"}

    try:
        X_sample = X_train.sample(n=min(120, len(X_train)), random_state=RANDOM_STATE)
        X_trans = best_pipe.named_steps["preprocessor"].transform(X_sample)
        feature_names = best_pipe.named_steps["preprocessor"].get_feature_names_out()
        model = best_pipe.named_steps["model"]

        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_trans)

        # Multi-class shape handling: list[n_classes](n_samples, n_features) or 3D array
        if isinstance(shap_values, list):
            shap_array = np.mean(np.abs(np.stack(shap_values, axis=0)), axis=0)
        else:
            shap_np = np.asarray(shap_values)
            if shap_np.ndim == 3:
                shap_array = np.mean(np.abs(shap_np), axis=2)
            else:
                shap_array = np.abs(shap_np)

        mean_abs = np.mean(shap_array, axis=0)
        shap_importance = pd.DataFrame(
            {"feature": feature_names, "mean_abs_shap": mean_abs}
        ).sort_values("mean_abs_shap", ascending=False)

        shap_importance_path = ARTIFACTS_DIR / f"cluster_classifier_shap_importance_{mode}.csv"
        latest_shap_importance_path = ARTIFACTS_DIR / "cluster_classifier_shap_importance.csv"
        shap_importance.to_csv(shap_importance_path, index=False, encoding="utf-8")
        shap_importance.to_csv(latest_shap_importance_path, index=False, encoding="utf-8")

        shap_values_df = pd.DataFrame(shap_array, columns=feature_names)
        shap_values_path = ARTIFACTS_DIR / f"cluster_classifier_shap_values_{mode}.csv"
        latest_shap_values_path = ARTIFACTS_DIR / "cluster_classifier_shap_values.csv"
        shap_values_df.to_csv(shap_values_path, index=False, encoding="utf-8")
        shap_values_df.to_csv(latest_shap_values_path, index=False, encoding="utf-8")

        return {
            "status": "computed",
            "n_samples": int(X_sample.shape[0]),
            "n_features": int(len(feature_names)),
            "importance_path": str(shap_importance_path),
            "values_path": str(shap_values_path),
        }
    except Exception as exc:
        logger.warning("SHAP computation failed; skipping SHAP artifacts. Reason: %s", exc)
        return {"status": "failed", "reason": str(exc)}


def _optional_models():
    models = {
        "RandomForest": RandomForestClassifier(
            n_estimators=400,
            random_state=RANDOM_STATE,
            class_weight="balanced",
            n_jobs=-1,
        )
    }
    try:
        from xgboost import XGBClassifier  # type: ignore

        models["XGBoost"] = XGBClassifier(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.07,
            subsample=0.9,
            colsample_bytree=0.9,
            random_state=RANDOM_STATE,
            objective="multi:softprob",
            eval_metric="mlogloss",
            n_jobs=-1,
        )
    except Exception:
        logger.info("XGBoost unavailable, skipping.")

    try:
        from lightgbm import LGBMClassifier  # type: ignore

        models["LightGBM"] = LGBMClassifier(
            n_estimators=300,
            learning_rate=0.07,
            num_leaves=31,
            random_state=RANDOM_STATE,
            class_weight="balanced",
            n_jobs=-1,
        )
    except Exception:
        logger.info("LightGBM unavailable, skipping.")

    return models


def build_feature_sets(df: pd.DataFrame):
    forbidden = {
        "cluster_label",
        "attractivity_score",
        "attractivity_class",
        "cell_id",
        "dominant_sector",
    }
    candidate_numeric = [
        "entity_count_real",
        "entity_count_total",
        "density_log",
        "active_rate",
        "capital_median",
        "capital_mean",
        "capital_max",
        "sector_diversity",
        "formal_ratio",
        "sarl_count",
        "sa_count",
        "n_sectors_present",
        "cell_lat",
        "cell_lon",
    ]
    num_features = [c for c in candidate_numeric if c in df.columns and c not in forbidden]
    cat_features = [c for c in ["city"] if c in df.columns and c not in forbidden]
    return num_features, cat_features


def main() -> None:
    mode = DEFAULT_MODE
    if len(sys.argv) > 1:
        mode = sys.argv[1].strip().lower()
    if mode not in VALID_MODES:
        raise ValueError(f"Invalid mode '{mode}'. Allowed modes: {sorted(VALID_MODES)}")

    ARTIFACTS_DIR.mkdir(exist_ok=True)
    source = ARTIFACTS_DIR / f"zone_clusters_{mode}.csv"
    if not source.exists():
        raise FileNotFoundError(f"{source} not found. Run cluster_zones.py {mode} first.")

    df = pd.read_csv(source, low_memory=False)
    df = df.copy()

    # Optional: DBSCAN noise points are excluded for supervised training.
    if (df["cluster_label"] == -1).any():
        noise_count = int((df["cluster_label"] == -1).sum())
        logger.info("Dropping %s noise zones (cluster_label = -1) for classifier training.", noise_count)
        df = df[df["cluster_label"] != -1].reset_index(drop=True)

    # Rare clusters are expected in unsupervised discovery; they are not
    # statistically valid for supervised train/test + CV.
    class_counts_all = df["cluster_label"].value_counts()
    rare_classes = class_counts_all[class_counts_all < 3].index.tolist()
    if rare_classes:
        logger.warning(
            "Dropping rare clusters with <3 zones for supervised stage: %s",
            sorted(int(x) for x in rare_classes),
        )
        df = df[~df["cluster_label"].isin(rare_classes)].reset_index(drop=True)
        class_counts_all = df["cluster_label"].value_counts()

    if df["cluster_label"].nunique() < 2:
        raise ValueError(
            "Need at least 2 sufficiently represented clusters for supervised classification."
        )

    num_features, cat_features = build_feature_sets(df)
    if not num_features:
        raise ValueError("No valid numeric features found for cluster classifier.")

    X = df[num_features + cat_features]
    y = df["cluster_label"].astype(int)

    stratify_y = y if int(class_counts_all.min()) >= 2 else None
    if stratify_y is None:
        logger.warning("Proceeding without stratified split due to low class counts.")

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=stratify_y,
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), num_features),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_features),
        ],
        remainder="drop",
    )

    class_counts = y_train.value_counts()
    min_class_count = int(class_counts.min())
    can_run_cv = min_class_count >= 2
    cv = None
    if can_run_cv:
        cv_folds = min(5, min_class_count)
        cv = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=RANDOM_STATE)
    else:
        logger.warning(
            "Skipping CV model selection: at least one training class has <2 samples."
        )

    models = _optional_models()
    cv_results = {}
    best_name = None
    best_score = -np.inf

    for name, model in models.items():
        pipe = Pipeline([("preprocessor", preprocessor), ("model", model)])
        if can_run_cv and cv is not None:
            score = float(cross_val_score(pipe, X_train, y_train, cv=cv, scoring="f1_macro", n_jobs=-1).mean())
            cv_results[name] = score
            logger.info("CV f1_macro [%s]: %.4f", name, score)
            if score > best_score:
                best_score = score
                best_name = name

    if not can_run_cv:
        best_name = "RandomForest"
        best_score = None
        cv_results = {}
        logger.info("Fallback model selected without CV: %s", best_name)

    assert best_name is not None
    best_model = models[best_name]
    best_pipe = Pipeline([("preprocessor", preprocessor), ("model", best_model)])
    best_pipe.fit(X_train, y_train)

    y_pred = best_pipe.predict(X_test)
    test_f1 = float(f1_score(y_test, y_pred, average="macro"))
    test_acc = float(accuracy_score(y_test, y_pred))
    cls_report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

    pred_out = X_test.copy()
    pred_out["y_true"] = y_test.values
    pred_out["y_pred"] = y_pred
    pred_path = ARTIFACTS_DIR / f"cluster_classifier_predictions_{mode}.csv"
    latest_pred_path = ARTIFACTS_DIR / "cluster_classifier_predictions.csv"
    pred_out.to_csv(pred_path, index=False, encoding="utf-8")
    pred_out.to_csv(latest_pred_path, index=False, encoding="utf-8")

    save_artifact(best_pipe, f"cluster_classifier_pipeline_{mode}", logger=logger)
    save_artifact(best_pipe, "cluster_classifier_pipeline", logger=logger)

    transformed_features = best_pipe.named_steps["preprocessor"].get_feature_names_out().tolist()
    model = best_pipe.named_steps["model"]
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
    else:
        pi = permutation_importance(best_pipe, X_test, y_test, n_repeats=10, random_state=RANDOM_STATE, n_jobs=-1)
        importances = pi.importances_mean

    fi_df = pd.DataFrame({"feature": transformed_features, "importance": importances})
    fi_path = ARTIFACTS_DIR / f"cluster_classifier_feature_importance_{mode}.csv"
    latest_fi_path = ARTIFACTS_DIR / "cluster_classifier_feature_importance.csv"
    fi_df.sort_values("importance", ascending=False).to_csv(fi_path, index=False, encoding="utf-8")
    fi_df.sort_values("importance", ascending=False).to_csv(latest_fi_path, index=False, encoding="utf-8")
    shap_meta = _compute_shap_outputs(best_pipe, X_train, mode)

    metrics = {
        "task": "Predict economic cluster membership",
        "mode": mode,
        "selected_model": best_name,
        "cv_f1_macro_by_model": cv_results,
        "cv_f1_macro_selected": best_score,
        "test_accuracy": test_acc,
        "test_f1_macro": test_f1,
        "classification_report": cls_report,
        "features_numeric": num_features,
        "features_categorical": cat_features,
        "leakage_controls": [
            "attractivity_score excluded from classifier features",
            "attractivity_class excluded from classifier features",
            "cluster_label used as target only",
        ],
        "dropped_rare_clusters": [int(x) for x in rare_classes],
        "shap_explainability": shap_meta,
    }
    metrics_path = ARTIFACTS_DIR / f"cluster_classifier_metrics_{mode}.json"
    latest_metrics_path = ARTIFACTS_DIR / "cluster_classifier_metrics.json"
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2, ensure_ascii=False)
    with open(latest_metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2, ensure_ascii=False)

    logger.info("Saved cluster classifier metrics and artifacts for mode: %s", mode)
    logger.info("Best model: %s | Test F1-macro: %.4f | Test Accuracy: %.4f", best_name, test_f1, test_acc)


if __name__ == "__main__":
    main()
