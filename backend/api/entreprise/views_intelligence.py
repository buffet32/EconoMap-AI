from __future__ import annotations

from django.core.paginator import Paginator
from django.db.models import Avg, Count, Min, Q, Sum
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from entreprise.services import MLServiceError, get_ml_service
from entreprise.services.text_cleaning import sanitize_latin_arabic_text
from ml.schemas import enterprise_brief, zone_summary

from .models import EconomicCell, Enterprise
from .serializers_intelligence import (
    EconomicCellSerializer,
    EnterpriseListSerializer,
)


SECTOR_COLORS = {
    "Commerce": "#4fd1c5",
    "Construction": "#f6ad55",
    "Information Technology": "#8c54bc",
    "Manufacturing": "#63b3ed",
    "Professional Services": "#68d391",
    "Real Estate": "#fc8181",
    "Tourism & Hospitality": "#f687b3",
    "Transport": "#90cdf4",
    "Healthcare": "#f56565",
    "Finance": "#ecc94b",
    "Education": "#9ae6b4",
    "Agriculture": "#48bb78",
    "Other": "#a0aec0",
}


def _to_int(value: str | None, default: int, minimum: int | None = None, maximum: int | None = None) -> int:
    try:
        parsed = int(value) if value is not None else default
    except (TypeError, ValueError):
        parsed = default
    if minimum is not None:
        parsed = max(minimum, parsed)
    if maximum is not None:
        parsed = min(maximum, parsed)
    return parsed


def _parse_bbox(bbox: str | None):
    if not bbox:
        return None
    try:
        south, west, north, east = [float(v) for v in bbox.split(",")]
        return south, west, north, east
    except (TypeError, ValueError):
        return None


def _to_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _confidence_percent_for_display(value):
    confidence = _to_float(value)
    if confidence is None:
        return None
    confidence = max(0.0, min(confidence, 0.999))
    return f"{confidence * 100:.1f}%"


def _summary_message_for_non_technical_users(
    label: str, sector: str | None, prediction: dict | None
) -> str:
    if not prediction:
        return (
            f"{label} ({sector or 'Secteur non renseigne'}) : "
            "pas assez de données pour produire une explication simple."
        )

    score = _to_float(prediction.get("attractivity_score"))
    class_name = sanitize_latin_arabic_text(prediction.get("attractivity_class") or "Non classee")
    confidence_text = _confidence_percent_for_display(prediction.get("class_confidence"))

    score_part = f"{score:.2f}/100" if score is not None else "non disponible"
    confidence_part = (
        f" Le niveau de confiance estime du modele est d'environ {confidence_text}."
        if confidence_text is not None
        else ""
    )

    normalized_class = (
        class_name.lower()
        .replace("é", "e")
        .replace("è", "e")
        .replace("ê", "e")
        .replace("à", "a")
        .replace("î", "i")
    )
    if "faible" in normalized_class:
        interpretation = "Le potentiel est actuellement limite pour cette activite."
    elif "eleve" in normalized_class or "fort" in normalized_class:
        interpretation = "Le potentiel est favorable pour cette activite."
    elif "moy" in normalized_class or "mod" in normalized_class:
        interpretation = "Le potentiel est correct, avec une marge d'amelioration."
    else:
        interpretation = "Le potentiel estime doit etre interprete avec prudence."

    return (
        f"{label} ({sector or 'Secteur non renseigne'}) : score estime {score_part}, "
        f"niveau {class_name}. {interpretation}{confidence_part}"
    )


def _apply_bbox_to_cells(qs, bbox: tuple[float, float, float, float] | None):
    if bbox is None:
        return qs
    south, west, north, east = bbox
    return qs.filter(
        cell_lat__gte=south,
        cell_lat__lte=north,
        cell_lon__gte=west,
        cell_lon__lte=east,
    )


def _apply_bbox_to_enterprises(qs, bbox: tuple[float, float, float, float] | None):
    if bbox is None:
        return qs
    south, west, north, east = bbox
    return qs.filter(
        latitude__gte=south,
        latitude__lte=north,
        longitude__gte=west,
        longitude__lte=east,
    )


def _base_cells_queryset(request):
    city = request.query_params.get("city")
    sector = request.query_params.get("sector")
    bbox = _parse_bbox(request.query_params.get("bbox"))

    qs = EconomicCell.objects.all()
    if city:
        qs = qs.filter(city=city)
    if sector:
        qs = qs.filter(sector_main=sector)
    return _apply_bbox_to_cells(qs, bbox)


@api_view(["GET"])
def cities_list(request):
    cities = list(EconomicCell.objects.values_list("city", flat=True).distinct().order_by("city"))
    return Response({"cities": cities})


@api_view(["GET"])
def sectors_list(request):
    city = request.query_params.get("city")
    qs = EconomicCell.objects.all()
    if city:
        qs = qs.filter(city=city)
    sectors = list(qs.values_list("sector_main", flat=True).distinct().order_by("sector_main"))
    return Response({"sectors": sectors})


@api_view(["GET"])
def zones_summary(request):
    page = _to_int(request.query_params.get("page"), default=1, minimum=1)
    page_size = _to_int(request.query_params.get("page_size"), default=200, minimum=20, maximum=1000)
    qs = _base_cells_queryset(request)

    grouped = (
        qs.values(
            "cell_id",
            "display_name",
            "zone_name",
            "district",
            "region_name",
            "city",
            "cell_lat",
            "cell_lon",
        )
        .annotate(
            zone_id=Min("id"),
            sectors_count=Count("sector_main", distinct=True),
            entity_count_real=Sum("entity_count_real"),
            entity_count_total=Sum("entity_count_total"),
            avg_density=Avg("density_log"),
        )
        .order_by("-entity_count_real")
    )

    paginator = Paginator(grouped, page_size)
    current = paginator.get_page(page)
    zones = [
        {
            "id": int(row["zone_id"]),
            "cell_id": row["cell_id"],
            "display_name": sanitize_latin_arabic_text(
                row["display_name"] or f"{row['city']} Center - {row['city']}"
            ),
            "zone_name": sanitize_latin_arabic_text(row["zone_name"]),
            "district": sanitize_latin_arabic_text(row["district"]),
            "region_name": sanitize_latin_arabic_text(row["region_name"]),
            "city": sanitize_latin_arabic_text(row["city"]),
            "cell_lat": float(row["cell_lat"]),
            "cell_lon": float(row["cell_lon"]),
            "entity_count_real": int(row["entity_count_real"] or 0),
            "entity_count_total": int(row["entity_count_total"] or 0),
            "density_log": float(row["avg_density"] or 0.0),
            "sectors_count": int(row["sectors_count"] or 0),
            "color": "#4fd1c5",
        }
        for row in current.object_list
    ]
    return Response(
        {
            "count": paginator.count,
            "page": current.number,
            "page_size": page_size,
            "has_next": current.has_next(),
            "zones": zones,
        }
    )


@api_view(["GET"])
def zones_list(request):
    page = _to_int(request.query_params.get("page"), default=1, minimum=1)
    page_size = _to_int(request.query_params.get("page_size"), default=250, minimum=20, maximum=1000)
    predict = request.query_params.get("predict", "false").lower() == "true"

    qs = _base_cells_queryset(request).order_by("-entity_count_real")
    paginator = Paginator(qs, page_size)
    current = paginator.get_page(page)

    ml_service = get_ml_service()
    zones = []
    for cell in current.object_list:
        item = EconomicCellSerializer(cell).data
        item["color"] = SECTOR_COLORS.get(cell.sector_main, "#718096")
        if predict:
            try:
                item["prediction"] = ml_service.predict_zone(cell)
            except Exception:
                item["prediction"] = None
        zones.append(item)

    unique_cells = qs.values("cell_id").distinct().count()
    return Response(
        {
            "count": paginator.count,
            "unique_cells": unique_cells,
            "page": current.number,
            "page_size": page_size,
            "has_next": current.has_next(),
            "zones": zones,
        }
    )


@api_view(["GET"])
def map_viewport(request):
    bbox = _parse_bbox(request.query_params.get("bbox"))
    if bbox is None:
        return Response({"detail": "bbox is required (south,west,north,east)."}, status=400)

    zoom = _to_int(request.query_params.get("zoom"), default=6, minimum=1, maximum=22)
    zone_page = _to_int(request.query_params.get("zone_page"), default=1, minimum=1)
    zone_page_size = _to_int(request.query_params.get("zone_page_size"), default=400, minimum=50, maximum=1200)
    enterprise_page = _to_int(request.query_params.get("enterprise_page"), default=1, minimum=1)
    enterprise_page_size = _to_int(
        request.query_params.get("enterprise_page_size"), default=150, minimum=50, maximum=500
    )
    selected_zone_id = request.query_params.get("zone_id")

    cells_qs = _base_cells_queryset(request)
    zone_group = (
        _apply_bbox_to_cells(cells_qs, bbox)
        .values(
            "cell_id",
            "display_name",
            "zone_name",
            "district",
            "region_name",
            "city",
            "cell_lat",
            "cell_lon",
        )
        .annotate(
            zone_id=Min("id"),
            sectors_count=Count("sector_main", distinct=True),
            entity_count_real=Sum("entity_count_real"),
            entity_count_total=Sum("entity_count_total"),
            avg_density=Avg("density_log"),
        )
        .order_by("-entity_count_real")
    )
    zone_paginator = Paginator(zone_group, zone_page_size)
    zone_current = zone_paginator.get_page(zone_page)
    zones = [
        {
            "id": int(row["zone_id"]),
            "cell_id": row["cell_id"],
            "display_name": sanitize_latin_arabic_text(
                row["display_name"] or f"{row['city']} Center - {row['city']}"
            ),
            "zone_name": sanitize_latin_arabic_text(row["zone_name"]),
            "district": sanitize_latin_arabic_text(row["district"]),
            "region_name": sanitize_latin_arabic_text(row["region_name"]),
            "city": sanitize_latin_arabic_text(row["city"]),
            "cell_lat": float(row["cell_lat"]),
            "cell_lon": float(row["cell_lon"]),
            "entity_count_real": int(row["entity_count_real"] or 0),
            "entity_count_total": int(row["entity_count_total"] or 0),
            "density_log": float(row["avg_density"] or 0.0),
            "sectors_count": int(row["sectors_count"] or 0),
            "color": "#4fd1c5",
        }
        for row in zone_current.object_list
    ]

    enterprises_payload = {"count": 0, "page": enterprise_page, "page_size": enterprise_page_size, "items": []}
    if zoom >= 12:
        enterprise_qs = Enterprise.objects.all()
        city = request.query_params.get("city")
        sector = request.query_params.get("sector")
        if city:
            enterprise_qs = enterprise_qs.filter(city=city)
        if sector:
            enterprise_qs = enterprise_qs.filter(sector_main=sector)

        if selected_zone_id:
            try:
                zone = EconomicCell.objects.get(pk=int(selected_zone_id))
            except (ValueError, EconomicCell.DoesNotExist):
                zone = None
            if zone is not None:
                enterprise_qs = enterprise_qs.filter(Q(economic_cell=zone) | Q(geo_cell_key=zone.cell_id))
            else:
                enterprise_qs = enterprise_qs.none()
        else:
            enterprise_qs = _apply_bbox_to_enterprises(enterprise_qs, bbox)

        enterprise_paginator = Paginator(enterprise_qs.order_by("id"), enterprise_page_size)
        enterprise_current = enterprise_paginator.get_page(enterprise_page)
        enterprises_payload = {
            "count": enterprise_paginator.count,
            "page": enterprise_current.number,
            "page_size": enterprise_page_size,
            "has_next": enterprise_current.has_next(),
            "items": [enterprise_brief(ent) for ent in enterprise_current.object_list],
        }

    return Response(
        {
            "bbox": bbox,
            "zoom": zoom,
            "zones": {
                "count": zone_paginator.count,
                "page": zone_current.number,
                "page_size": zone_page_size,
                "has_next": zone_current.has_next(),
                "items": zones,
            },
            "enterprises": enterprises_payload,
        }
    )


@api_view(["GET"])
def zone_detail(request, pk):
    try:
        cell = EconomicCell.objects.get(pk=pk)
    except EconomicCell.DoesNotExist:
        return Response({"detail": "Zone not found"}, status=status.HTTP_404_NOT_FOUND)

    ml_service = get_ml_service()
    prediction = None
    try:
        prediction = ml_service.predict_zone(cell)
    except Exception:
        prediction = None
    return Response(zone_summary(cell, prediction))


@api_view(["GET"])
def zone_companies(request, pk):
    try:
        cell = EconomicCell.objects.get(pk=pk)
    except EconomicCell.DoesNotExist:
        return Response({"detail": "Zone not found"}, status=status.HTTP_404_NOT_FOUND)

    page = _to_int(request.query_params.get("page"), default=1, minimum=1)
    page_size = _to_int(request.query_params.get("page_size"), default=100, minimum=20, maximum=500)
    bbox = _parse_bbox(request.query_params.get("bbox"))

    qs = Enterprise.objects.filter(Q(economic_cell=cell) | Q(geo_cell_key=cell.cell_id))
    if request.query_params.get("sector_match") == "true":
        qs = qs.filter(sector_main=cell.sector_main)
    qs = _apply_bbox_to_enterprises(qs, bbox).order_by("id")

    paginator = Paginator(qs, page_size)
    current = paginator.get_page(page)
    return Response(
        {
            "zone": {
                "id": cell.id,
                "display_name": sanitize_latin_arabic_text(cell.display_name),
                "cell_id": cell.cell_id,
                "city": sanitize_latin_arabic_text(cell.city),
                "region_name": sanitize_latin_arabic_text(cell.region_name),
                "sector_main": cell.sector_main,
            },
            "total": paginator.count,
            "page": current.number,
            "page_size": page_size,
            "has_next": current.has_next(),
            "companies": [enterprise_brief(e) for e in current.object_list],
        }
    )


@api_view(["GET", "POST"])
def predict_view(request):
    if request.method == "POST":
        cell_pk = request.data.get("cell_id") or request.data.get("id")
        sector = request.data.get("sector_main")
        city = request.data.get("city")
    else:
        cell_pk = request.query_params.get("cell_id") or request.query_params.get("id")
        sector = request.query_params.get("sector_main")
        city = request.query_params.get("city")

    ml_service = get_ml_service()
    cell = None
    if cell_pk:
        try:
            cell = EconomicCell.objects.get(pk=int(cell_pk))
        except (ValueError, EconomicCell.DoesNotExist):
            if sector:
                cell = EconomicCell.objects.filter(cell_id=cell_pk, sector_main=sector).first()
            else:
                cell = EconomicCell.objects.filter(cell_id=cell_pk).first()
        if cell is None:
            return Response({"detail": "Zone not found"}, status=404)
    elif sector and city:
        cell = (
            EconomicCell.objects.filter(city=city, sector_main=sector)
            .order_by("-entity_count_real")
            .first()
        )
        if cell is None:
            return Response({"detail": "Zone not found for this city+sector"}, status=404)
    else:
        return Response({"detail": "Provide zone id (id/cell_id) or city+sector."}, status=400)

    try:
        return Response(ml_service.predict_zone(cell))
    except MLServiceError as exc:
        return Response({"detail": str(exc)}, status=503)


@api_view(["GET"])
def dashboard_view(request):
    city = request.query_params.get("city")
    try:
        stats = get_ml_service().dashboard_stats(city=city)
    except MLServiceError as exc:
        return Response({"detail": str(exc)}, status=503)

    # Backward-compatible aliases for existing UI code.
    stats["total_enterprises"] = stats["total_entities"]
    stats["active_enterprises"] = stats["active_companies"]
    stats["economic_cells"] = stats["total_zones"]
    stats["enterprises_by_sector"] = stats["top_sectors"]
    stats["top_attractive_zones"] = stats["top_zones"]
    return Response(stats)


@api_view(["GET"])
def heatmap_view(request):
    qs = _base_cells_queryset(request)
    points = [
        {
            "lat": float(cell.cell_lat),
            "lng": float(cell.cell_lon),
            "intensity": float(cell.density_log),
            "sector": cell.sector_main,
        }
        for cell in qs.iterator()
    ]
    return Response({"points": points, "count": len(points)})


@api_view(["GET"])
def recommendations_view(request):
    sector = request.query_params.get("sector")
    city = request.query_params.get("city")
    limit = _to_int(request.query_params.get("limit"), default=10, minimum=1, maximum=30)
    try:
        recommendations = get_ml_service().recommend_zones(sector=sector, city=city, limit=limit)
    except MLServiceError as exc:
        return Response({"detail": str(exc)}, status=503)
    return Response({"recommendations": recommendations})


@api_view(["GET"])
def insights_view(request, pk):
    try:
        cell = EconomicCell.objects.get(pk=pk)
    except EconomicCell.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)

    try:
        prediction = get_ml_service().predict_zone(cell)
    except Exception:
        prediction = {}

    dominant = (
        Enterprise.objects.filter(Q(economic_cell=cell) | Q(geo_cell_key=cell.cell_id))
        .values("sector_main")
        .annotate(n=Count("id"))
        .order_by("-n")
        .first()
    )
    label = sanitize_latin_arabic_text(cell.display_name or f"{cell.city} Center - {cell.city}")
    return Response(
        {
            "zone": zone_summary(cell, prediction),
            "why_attractive": prediction.get("explanations", {}).get("score", []),
            "class_drivers": prediction.get("explanations", {}).get("class", []),
            "dominant_sector_in_zone": dominant,
            "summary": _summary_message_for_non_technical_users(label, cell.sector_main, prediction),
        }
    )


@api_view(["GET"])
def enterprises_list(request):
    city = request.query_params.get("city")
    sector = request.query_params.get("sector")
    search = request.query_params.get("q")
    bbox = _parse_bbox(request.query_params.get("bbox"))
    page = _to_int(request.query_params.get("page"), default=1, minimum=1)
    page_size = _to_int(request.query_params.get("limit"), default=100, minimum=20, maximum=500)

    qs = Enterprise.objects.all()
    if city:
        qs = qs.filter(city=city)
    if sector:
        qs = qs.filter(sector_main=sector)
    if search:
        qs = qs.filter(entity_name__icontains=search)
    qs = _apply_bbox_to_enterprises(qs, bbox).order_by("id")

    paginator = Paginator(qs, page_size)
    current = paginator.get_page(page)
    return Response(
        {
            "count": paginator.count,
            "page": current.number,
            "page_size": page_size,
            "has_next": current.has_next(),
            "items": EnterpriseListSerializer(current.object_list, many=True).data,
        }
    )
