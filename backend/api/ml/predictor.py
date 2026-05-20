import numpy as np

from .explainability import explain_prediction, tree_feature_importance
from .loaders import get_registry
from .preprocessing import prepare_features_a, prepare_features_b


def _classification_confidence(proba: np.ndarray) -> float:
    if proba is None or len(proba) == 0:
        return 0.0
    return float(np.max(proba))


def predict_cell(df_row, context_df):
    reg = get_registry()
    reg_pipe = reg["regression"]
    clf_pipe = reg["classification"]
    le_clf = reg["classification_encoder"]
    sector_pipe = reg["sector_model"]
    le_sector = reg["sector_encoder"]

    X_a = prepare_features_a(context_df)
    X_b = prepare_features_b(context_df)
    idx = len(context_df) - 1
    x_a = X_a.iloc[[idx]]
    x_b = X_b.iloc[[idx]]

    score = float(reg_pipe.predict(x_a)[0]) if reg_pipe else None
    clf_label = None
    clf_conf = 0.0
    if clf_pipe and le_clf is not None:
        pred = int(clf_pipe.predict(x_a)[0])
        clf_label = str(le_clf.inverse_transform([pred])[0])
        if hasattr(clf_pipe, "predict_proba"):
            clf_conf = _classification_confidence(clf_pipe.predict_proba(x_a)[0])

    recommended_sector = None
    sector_conf = 0.0
    if sector_pipe and le_sector is not None:
        sp = int(sector_pipe.predict(x_b)[0])
        recommended_sector = str(le_sector.inverse_transform([sp])[0])
        if hasattr(sector_pipe, "predict_proba"):
            sector_conf = _classification_confidence(sector_pipe.predict_proba(x_b)[0])

    explanations = {
        "score": explain_prediction(reg_pipe, x_a) if reg_pipe else [],
        "class": tree_feature_importance(clf_pipe) if clf_pipe else [],
    }

    return {
        "attractivity_score": round(score, 2) if score is not None else None,
        "attractivity_class": clf_label,
        "class_confidence": round(clf_conf, 4),
        "recommended_sector": recommended_sector,
        "sector_confidence": round(sector_conf, 4),
        "explanations": explanations,
    }
