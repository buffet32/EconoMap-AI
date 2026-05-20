from __future__ import annotations

from math import isfinite
from pathlib import Path
from threading import Lock

from django.conf import settings
from django.db.models import Avg, Case, CharField, Count, F, Value, When
from django.db.models.functions import Lower, Trim

from entreprise.models import EconomicCell, Enterprise
from .text_cleaning import sanitize_latin_arabic_text

try:
    import joblib
except ImportError:  # pragma: no cover - dependency is environment-specific
    joblib = None

try:
    import numpy as np
except ImportError:  # pragma: no cover - dependency is environment-specific
    np = None

try:
    import pandas as pd
except ImportError:  # pragma: no cover - dependency is environment-specific
    pd = None


class MLServiceError(Exception):
    pass


class EnterpriseMLService:
    _lock = Lock()

    def __init__(self, artifacts_dir: Path | None = None) -> None:
        self.artifacts_dir = artifacts_dir or Path(settings.ML_ARTIFACTS_DIR)
        self._loaded = False
        self._models: dict[str, object | None] = {
            "regression": None,
            "classification": None,
            "classification_encoder": None,
            "sector_model": None,
            "sector_encoder": None,
        }

    def _load_pickle(self, filename: str):
        if joblib is None:
            raise MLServiceError("joblib is required to load ML artifacts.")
        path = self.artifacts_dir / filename
        if not path.exists():
            return None
        try:
            return joblib.load(path)
        except ModuleNotFoundError as exc:
            missing = getattr(exc, "name", None) or "unknown"
            raise MLServiceError(
                f"Missing ML dependency '{missing}' required to load '{filename}'. "
                "Install API ML dependencies and restart the server."
            ) from exc
        except (ImportError, AttributeError, ValueError, TypeError) as exc:
            raise MLServiceError(f"Failed to load ML artifact '{filename}': {exc}") from exc

    def ensure_loaded(self) -> None:
        if self._loaded:
            return
        with self._lock:
            if self._loaded:
                return
            self._models["regression"] = self._load_pickle("model_a_regression.pkl")
            self._models["classification"] = self._load_pickle("model_a_classification.pkl")
            self._models["classification_encoder"] = self._load_pickle("model_a_label_encoder.pkl")
            self._models["sector_model"] = self._load_pickle("model_b.pkl")
            self._models["sector_encoder"] = self._load_pickle("model_b_label_encoder.pkl")
            self._loaded = True

    def _expected_columns(self, pipeline) -> list[str]:
        try:
            preprocessor = pipeline.named_steps["preprocessor"]
        except Exception:
            return []
        cols: list[str] = []
        for _, _, transformer_cols in getattr(preprocessor, "transformers_", []):
            if transformer_cols == "drop":
                continue
            if isinstance(transformer_cols, str):
                cols.append(transformer_cols)
            else:
                cols.extend(list(transformer_cols))
        return list(dict.fromkeys(cols))

    def _align_features(self, frame: pd.DataFrame, pipeline) -> pd.DataFrame:
        expected = self._expected_columns(pipeline)
        if not expected:
            return frame
        aligned = frame.copy()
        for col in expected:
            if col in aligned.columns:
                continue
            aligned[col] = "Unknown" if col in {"city", "sector_main"} else 0.0
        return aligned[expected]

    def _classification_confidence(self, proba: np.ndarray | None) -> float:
        if np is None:
            return 0.0
        if proba is None or len(proba) == 0:
            return 0.0
        return float(np.max(proba))

    def _bounded_score(self, value: float | None) -> float | None:
        if value is None:
            return None
        try:
            score = float(value)
        except (TypeError, ValueError):
            return None
        if not isfinite(score):
            return None
        return max(0.0, min(score, 100.0))

    def _display_confidence(self, value: float | None) -> float:
        if value is None:
            return 0.0
        try:
            confidence = float(value)
        except (TypeError, ValueError):
            return 0.0
        if not isfinite(confidence):
            return 0.0
        # Avoid UX-degrading "always 100%" while keeping high confidence visible.
        return max(0.0, min(confidence, 0.999))

    def _cell_to_row(self, cell: EconomicCell) -> dict:
        return {
            "id": cell.id,
            "cell_id": cell.cell_id,
            "cell_lat": float(cell.cell_lat),
            "cell_lon": float(cell.cell_lon),
            "city": cell.city,
            "zone_name": cell.zone_name,
            "district": cell.district,
            "region_name": cell.region_name,
            "display_name": cell.display_name,
            "sector_main": cell.sector_main,
            "entity_count_real": cell.entity_count_real,
            "entity_count_total": cell.entity_count_total,
            "density_log": cell.density_log,
            "active_rate": cell.active_rate,
            "capital_median": cell.capital_median,
            "capital_mean": cell.capital_mean,
            "capital_max": cell.capital_max,
            "sector_diversity": cell.sector_diversity,
            "formal_ratio": cell.formal_ratio,
            "sarl_count": cell.sarl_count,
            "sa_count": cell.sa_count,
        }

    def _context_dataframe(self, city: str | None = None) -> pd.DataFrame:
        if pd is None:
            raise MLServiceError("pandas is required for ML inference.")
        qs = EconomicCell.objects.all()
        if city:
            qs = qs.filter(city=city)
        rows = [self._cell_to_row(cell) for cell in qs.iterator()]
        return pd.DataFrame(rows)

    def _recommend_sector_by_regression(
        self,
        cell: EconomicCell,
        context_df: pd.DataFrame,
        reg,
        prepare_features_a,
    ) -> tuple[str | None, float]:
        if pd is None or np is None:
            return None, 0.0

        candidates = list(
            EconomicCell.objects.filter(cell_id=cell.cell_id, city=cell.city).order_by("sector_main")
        )
        if not candidates:
            return None, 0.0

        candidate_scores: list[float] = []
        for candidate in candidates:
            candidate_row = self._cell_to_row(candidate)
            candidate_frame = pd.DataFrame([candidate_row])
            combined = pd.concat([context_df, candidate_frame], ignore_index=True)
            x_candidate = self._align_features(prepare_features_a(combined).tail(1), reg)
            candidate_scores.append(float(reg.predict(x_candidate)[0]))

        best_index = int(np.argmax(candidate_scores))
        best_sector = str(candidates[best_index].sector_main)
        ordered_scores = sorted(candidate_scores, reverse=True)
        margin = ordered_scores[0] - ordered_scores[1] if len(ordered_scores) > 1 else 0.0
        confidence = max(0.0, min(margin / (abs(ordered_scores[0]) + 1e-6), 1.0))
        return best_sector, confidence

    def predict_zone(self, cell: EconomicCell) -> dict:
        if pd is None or np is None:
            raise MLServiceError("numpy and pandas are required for ML inference.")
        from ml.explainability import explain_prediction, tree_feature_importance
        from ml.preprocessing import prepare_features_a, prepare_features_b

        self.ensure_loaded()
        reg = self._models["regression"]
        clf = self._models["classification"]
        clf_encoder = self._models["classification_encoder"]
        sector_model = self._models["sector_model"]
        sector_encoder = self._models["sector_encoder"]

        if reg is None:
            raise MLServiceError("Regression model is unavailable.")

        context_df = self._context_dataframe(city=cell.city)
        row = self._cell_to_row(cell)
        combined = pd.concat([context_df, pd.DataFrame([row])], ignore_index=True)
        features_a = prepare_features_a(combined)
        features_b = prepare_features_b(combined)
        x_a = self._align_features(features_a.tail(1), reg)

        raw_score = float(reg.predict(x_a)[0])
        score = self._bounded_score(raw_score)

        attractivity_class = None
        class_confidence = 0.0
        if clf is not None and clf_encoder is not None:
            x_clf = self._align_features(features_a.tail(1), clf)
            pred = int(clf.predict(x_clf)[0])
            attractivity_class = str(clf_encoder.inverse_transform([pred])[0])
            if hasattr(clf, "predict_proba"):
                class_confidence = self._display_confidence(
                    self._classification_confidence(clf.predict_proba(x_clf)[0])
                )

        recommended_sector, sector_confidence = self._recommend_sector_by_regression(
            cell=cell,
            context_df=context_df,
            reg=reg,
            prepare_features_a=prepare_features_a,
        )
        if recommended_sector is None and sector_model is not None and sector_encoder is not None:
            x_sector = self._align_features(features_b.tail(1), sector_model)
            pred = int(sector_model.predict(x_sector)[0])
            recommended_sector = str(sector_encoder.inverse_transform([pred])[0])
            if hasattr(sector_model, "predict_proba"):
                sector_confidence = self._display_confidence(
                    self._classification_confidence(
                        sector_model.predict_proba(x_sector)[0]
                    )
                )

        return {
            "cell_id": cell.cell_id,
            "display_name": sanitize_latin_arabic_text(cell.display_name),
            "city": sanitize_latin_arabic_text(cell.city),
            "sector_main": cell.sector_main,
            "attractivity_score": round(score, 2) if score is not None else None,
            "attractivity_class": attractivity_class,
            "class_confidence": round(class_confidence, 4),
            "recommended_sector": recommended_sector,
            "sector_confidence": round(sector_confidence, 4),
            "explanations": {
                "score": explain_prediction(reg, x_a),
                "class": tree_feature_importance(clf) if clf is not None else [],
            },
        }

    def recommend_zones(
        self, sector: str | None = None, city: str | None = None, limit: int = 10
    ) -> list[dict]:
        if pd is None:
            raise MLServiceError("pandas is required for ML recommendations.")
        from ml.preprocessing import prepare_features_a

        self.ensure_loaded()
        reg = self._models["regression"]
        if reg is None:
            return []

        qs = EconomicCell.objects.all()
        if city:
            qs = qs.filter(city=city)
        if sector:
            qs = qs.filter(sector_main=sector)
        rows = [self._cell_to_row(cell) for cell in qs.iterator()]
        if not rows:
            return []

        frame = pd.DataFrame(rows)
        features = prepare_features_a(frame)
        features = self._align_features(features, reg)
        scores = reg.predict(features)
        frame = frame.copy()
        frame["predicted_score"] = scores
        top = frame.nlargest(limit, "predicted_score")
        return [
            {
                "id": int(r["id"]) if "id" in r and not pd.isna(r["id"]) else None,
                "cell_id": str(r["cell_id"]),
                "display_name": sanitize_latin_arabic_text(str(r.get("display_name", ""))),
                "city": sanitize_latin_arabic_text(str(r["city"])),
                "region_name": sanitize_latin_arabic_text(str(r.get("region_name", ""))),
                "sector_main": str(r["sector_main"]),
                "cell_lat": float(r["cell_lat"]),
                "cell_lon": float(r["cell_lon"]),
                "predicted_score": round(self._bounded_score(float(r["predicted_score"])) or 0.0, 2),
                "entity_count_real": int(r["entity_count_real"]),
            }
            for _, r in top.iterrows()
        ]

    def dashboard_stats(self, city: str | None = None) -> dict:
        ent_qs = Enterprise.objects.all()
        cell_qs = EconomicCell.objects.all()
        if city:
            ent_qs = ent_qs.filter(city=city)
            cell_qs = cell_qs.filter(city=city)

        total_entities = ent_qs.count()
        active_entities = ent_qs.filter(company_status__icontains="activ").count()
        top_sector_rows = list(
            ent_qs.annotate(sector_main_norm=Lower(Trim(F("sector_main"))))
            .annotate(
                sector_main_resolved=Case(
                    When(sector_main__isnull=True, then=Value("Other")),
                    When(sector_main_norm="", then=Value("Other")),
                    When(sector_main_norm__in=["nan", "none", "null", "n/a", "-", "unknown"], then=Value("Other")),
                    default=F("sector_main"),
                    output_field=CharField(),
                )
            )
            .values("sector_main_resolved")
            .annotate(count=Count("id"))
            .order_by("-count")[:12]
        )
        top_sectors = [
            {"sector_main": str(row["sector_main_resolved"]), "count": int(row["count"])}
            for row in top_sector_rows
        ]

        region_analytics = list(
            cell_qs.values("region_name")
            .annotate(
                zones=Count("id"),
                entities=Count("enterprises"),
                avg_density=Avg("density_log"),
                avg_sector_diversity=Avg("sector_diversity"),
            )
            .order_by("-entities")
        )

        top_zone_qs = cell_qs.order_by("-entity_count_real")[:8]
        top_zones = []
        for zone in top_zone_qs:
            try:
                prediction = self.predict_zone(zone)
            except Exception:
                prediction = {}
            top_zones.append(
                {
                    "id": zone.id,
                    "display_name": sanitize_latin_arabic_text(zone.display_name),
                    "city": sanitize_latin_arabic_text(zone.city),
                    "region_name": sanitize_latin_arabic_text(zone.region_name),
                    "sector_main": zone.sector_main,
                    "entity_count_real": zone.entity_count_real,
                    "predicted_score": prediction.get("attractivity_score"),
                    "attractivity_class": prediction.get("attractivity_class"),
                    "class_confidence": prediction.get("class_confidence"),
                }
            )

        aggregates = cell_qs.aggregate(
            total_cells=Count("id"),
            avg_density=Avg("density_log"),
            avg_active=Avg("active_rate"),
            avg_sector_diversity=Avg("sector_diversity"),
        )

        return {
            "total_entities": total_entities,
            "active_companies": active_entities,
            "inactive_entities": total_entities - active_entities,
            "active_rate": round(active_entities / total_entities, 4) if total_entities else 0.0,
            "top_sectors": top_sectors,
            "total_zones": aggregates.get("total_cells") or 0,
            "avg_density_log": round(aggregates.get("avg_density") or 0.0, 4),
            "avg_zone_active_rate": round(aggregates.get("avg_active") or 0.0, 4),
            "avg_sector_diversity": round(aggregates.get("avg_sector_diversity") or 0.0, 4),
            "top_zones": top_zones,
            "regional_analytics": region_analytics,
            "cities": list(EconomicCell.objects.values_list("city", flat=True).distinct().order_by("city")),
        }


_ML_SERVICE: EnterpriseMLService | None = None


def get_ml_service() -> EnterpriseMLService:
    global _ML_SERVICE
    if _ML_SERVICE is None:
        _ML_SERVICE = EnterpriseMLService()
    return _ML_SERVICE
