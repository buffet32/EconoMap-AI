import numpy as np
import pandas as pd

from .loaders import get_registry


def _feature_names(pipeline) -> list:
    try:
        prep = pipeline.named_steps["preprocessor"]
        names = []
        for name, transformer, cols in prep.transformers_:
            if name == "num":
                names.extend(cols)
            elif hasattr(transformer, "get_feature_names_out"):
                names.extend(list(transformer.get_feature_names_out(cols)))
            else:
                names.extend(cols)
        return names
    except Exception:
        return []


def tree_feature_importance(pipeline, top_n: int = 8) -> list:
    model = pipeline.named_steps["model"]
    names = _feature_names(pipeline)
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
    else:
        return []
    if len(names) != len(importances):
        names = [f"feature_{i}" for i in range(len(importances))]
    pairs = sorted(zip(names, importances), key=lambda x: x[1], reverse=True)
    total = sum(v for _, v in pairs) or 1.0
    return [
        {
            "feature": n,
            "importance": round(float(v), 6),
            "share": round(float(v) / total, 4),
        }
        for n, v in pairs[:top_n]
    ]


def explain_prediction(pipeline, X: pd.DataFrame, top_n: int = 6) -> list:
    try:
        import shap
    except Exception:
        return tree_feature_importance(pipeline, top_n)

    prep = pipeline.named_steps["preprocessor"]
    model = pipeline.named_steps["model"]
    X_t = prep.transform(X)
    names = _feature_names(pipeline) or [f"f{i}" for i in range(X_t.shape[1])]
    try:
        explainer = shap.TreeExplainer(model)
        values = explainer.shap_values(X_t)
        if isinstance(values, list):
            values = np.mean([np.abs(v) for v in values], axis=0)
        row = np.abs(values[0])
        pairs = sorted(zip(names, row), key=lambda x: x[1], reverse=True)[:top_n]
        total = sum(v for _, v in pairs) or 1.0
        return [
            {
                "feature": str(n),
                "impact": round(float(v), 6),
                "share": round(float(v) / total, 4),
            }
            for n, v in pairs
        ]
    except Exception:
        return tree_feature_importance(pipeline, top_n)
