import joblib
from pathlib import Path

from .config import ARTIFACTS_DIR

_REGISTRY = {
    "regression": None,
    "classification": None,
    "classification_encoder": None,
    "sector_model": None,
    "sector_encoder": None,
    "cluster_pipeline": None,
    "feature_importance_reg": None,
    "feature_importance_clf": None,
}


def _load(path: Path):
    if not path.exists():
        return None
    return joblib.load(path)


def ensure_models_loaded():
    if _REGISTRY["regression"] is not None:
        return _REGISTRY
    base = ARTIFACTS_DIR
    _REGISTRY["regression"] = _load(base / "model_a_regression.pkl")
    _REGISTRY["classification"] = _load(base / "model_a_classification.pkl")
    _REGISTRY["classification_encoder"] = _load(base / "model_a_label_encoder.pkl")
    _REGISTRY["sector_model"] = _load(base / "model_b.pkl")
    _REGISTRY["sector_encoder"] = _load(base / "model_b_label_encoder.pkl")
    _REGISTRY["cluster_pipeline"] = _load(base / "cluster_classifier_pipeline.pkl")
    return _REGISTRY


def get_registry():
    ensure_models_loaded()
    return _REGISTRY
