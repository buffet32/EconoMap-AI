import pandas as pd
from django.db.models import Avg, Count, Q

from entreprise.models import EconomicCell, Enterprise
from .predictor import predict_cell
from .preprocessing import cells_to_dataframe


def build_context_dataframe(city: str | None = None) -> pd.DataFrame:
    qs = EconomicCell.objects.all()
    if city:
        qs = qs.filter(city=city)
    return cells_to_dataframe(qs)


def predict_zone(cell: EconomicCell) -> dict:
    context = build_context_dataframe(city=cell.city)
    row = {
        "cell_id": cell.cell_id,
        "cell_lat": float(cell.cell_lat),
        "cell_lon": float(cell.cell_lon),
        "city": cell.city,
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
    combined = pd.concat([context, pd.DataFrame([row])], ignore_index=True)
    result = predict_cell(row, combined)
    result["cell_id"] = cell.cell_id
    result["sector_main"] = cell.sector_main
    result["city"] = cell.city
    return result


def recommend_zones(sector: str | None = None, city: str | None = None, limit: int = 10):
    qs = EconomicCell.objects.all()
    if city:
        qs = qs.filter(city=city)
    if sector:
        qs = qs.filter(sector_main=sector)
    context = cells_to_dataframe(qs)
    if context.empty:
        return []

    from .loaders import get_registry
    from .preprocessing import prepare_features_a

    reg = get_registry()["regression"]
    if reg is None:
        return []

    X = prepare_features_a(context)
    scores = reg.predict(X)
    context = context.copy()
    context["predicted_score"] = scores
    if sector:
        context = context[context["sector_main"] == sector]
    top = context.nlargest(limit, "predicted_score")
    return [
        {
            "cell_id": r["cell_id"],
            "city": r["city"],
            "sector_main": r["sector_main"],
            "cell_lat": float(r["cell_lat"]),
            "cell_lon": float(r["cell_lon"]),
            "predicted_score": round(float(r["predicted_score"]), 2),
            "entity_count_real": int(r["entity_count_real"]),
        }
        for _, r in top.iterrows()
    ]


def dashboard_stats(city: str | None = None):
    ent_qs = Enterprise.objects.all()
    cell_qs = EconomicCell.objects.all()
    if city:
        ent_qs = ent_qs.filter(city=city)
        cell_qs = cell_qs.filter(city=city)

    total_enterprises = ent_qs.count()
    active_count = ent_qs.filter(company_status__icontains="activ").count()
    cities = list(
        Enterprise.objects.values_list("city", flat=True).distinct().order_by("city")
    )

    by_city = list(
        Enterprise.objects.values("city")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    by_sector = list(
        Enterprise.objects.values("sector_main")
        .annotate(count=Count("id"))
        .order_by("-count")[:12]
    )

    cell_agg = cell_qs.aggregate(
        avg_density=Avg("density_log"),
        avg_active=Avg("active_rate"),
        total_cells=Count("id"),
    )

    top_zones = recommend_zones(city=city, limit=8)

    return {
        "total_enterprises": total_enterprises,
        "active_enterprises": active_count,
        "inactive_enterprises": total_enterprises - active_count,
        "active_rate": round(active_count / total_enterprises, 4) if total_enterprises else 0,
        "cities": cities,
        "enterprises_by_city": by_city,
        "enterprises_by_sector": by_sector,
        "economic_cells": cell_agg.get("total_cells") or 0,
        "avg_density_log": round(cell_agg.get("avg_density") or 0, 4),
        "avg_cell_active_rate": round(cell_agg.get("avg_active") or 0, 4),
        "top_attractive_zones": top_zones,
    }
