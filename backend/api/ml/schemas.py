from entreprise.services.text_cleaning import sanitize_latin_arabic_text


def zone_summary(cell, prediction=None):
    data = {
        "id": cell.id,
        "cell_id": cell.cell_id,
        "cell_lat": float(cell.cell_lat),
        "cell_lon": float(cell.cell_lon),
        "city": sanitize_latin_arabic_text(cell.city),
        "zone_name": sanitize_latin_arabic_text(cell.zone_name),
        "district": sanitize_latin_arabic_text(cell.district),
        "region_name": sanitize_latin_arabic_text(cell.region_name),
        "display_name": sanitize_latin_arabic_text(cell.display_name),
        "sector_main": cell.sector_main,
        "entity_count_real": cell.entity_count_real,
        "entity_count_total": cell.entity_count_total,
        "density_log": cell.density_log,
        "active_rate": cell.active_rate,
        "capital_median": cell.capital_median,
        "sector_diversity": cell.sector_diversity,
    }
    if prediction:
        data["prediction"] = prediction
    return data


def enterprise_brief(ent):
    return {
        "id": ent.id,
        "entity_name": sanitize_latin_arabic_text(ent.entity_name),
        "sector_main": ent.sector_main,
        "sector": ent.sector,
        "legal_form": ent.legal_form,
        "company_status": ent.company_status,
        "city": sanitize_latin_arabic_text(ent.city),
        "latitude": float(ent.latitude),
        "longitude": float(ent.longitude),
        "geo_cell_key": ent.geo_cell_key,
        "economic_cell_id": ent.economic_cell_id,
    }
