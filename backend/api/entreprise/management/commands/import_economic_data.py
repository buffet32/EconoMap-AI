import math
from pathlib import Path

import pandas as pd
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from entreprise.models import EconomicCell, Enterprise
from entreprise.services.sector_normalization import normalize_sector_main
from entreprise.services.text_cleaning import sanitize_latin_arabic_text


def compute_cell_key(lat: float, lon: float) -> str:
    return f"{int(float(lat) * 74)}_{int(float(lon) * 56.8)}"


def haversine_km(lat1, lon1, lat2, lon2):
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlon / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def clean_str(
    value,
    fallback: str = "",
    max_len: int | None = None,
    latin_arabic_only: bool = False,
) -> str:
    if pd.isna(value):
        text = fallback
    else:
        text = str(value).strip()
    if not text:
        text = fallback
    if latin_arabic_only:
        text = sanitize_latin_arabic_text(text) or fallback
    if max_len is not None:
        return text[:max_len]
    return text


def to_float(value, default: float = 0.0) -> float:
    try:
        if pd.isna(value):
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def to_int(value, default: int = 0) -> int:
    try:
        if pd.isna(value):
            return default
        return int(float(value))
    except (TypeError, ValueError):
        return default


class Command(BaseCommand):
    help = "Import economic cells and enterprises from project CSV datasets."

    def add_arguments(self, parser):
        parser.add_argument("--clear", action="store_true", help="Clear existing data before import")
        parser.add_argument("--cells-only", action="store_true")
        parser.add_argument("--entities-only", action="store_true")
        parser.add_argument("--zones-path", type=str, default=None)
        parser.add_argument("--entities-path", type=str, default=None)

    @transaction.atomic
    def handle(self, *args, **options):
        default_zones_path = Path(getattr(settings, "DATA_ZONES_ENRICHED_CSV", settings.DATA_ZONES_CSV))
        if not default_zones_path.exists():
            default_zones_path = Path(settings.DATA_ZONES_CSV)

        zones_path = Path(options["zones_path"]) if options["zones_path"] else default_zones_path
        entities_path = Path(options["entities_path"]) if options["entities_path"] else Path(settings.DATA_ENTITIES_CSV)

        if options["clear"]:
            if not options["entities_only"]:
                EconomicCell.objects.all().delete()
            if not options["cells_only"]:
                Enterprise.objects.all().delete()
            self.stdout.write("Cleared existing economic data.")

        cell_lookup = {}

        if not options["entities_only"]:
            self.stdout.write(f"Loading zones: {zones_path}")
            zdf = pd.read_csv(zones_path, low_memory=False)
            cells = []
            for _, row in zdf.iterrows():
                city = clean_str(
                    row.get("city"),
                    fallback="Unknown City",
                    max_len=128,
                    latin_arabic_only=True,
                )
                zone_name = clean_str(
                    row.get("zone_name"),
                    fallback=f"{city} Center",
                    max_len=255,
                    latin_arabic_only=True,
                )
                district = clean_str(
                    row.get("district"),
                    fallback=city,
                    max_len=255,
                    latin_arabic_only=True,
                )
                region_name = clean_str(
                    row.get("region_name"),
                    fallback=district,
                    max_len=255,
                    latin_arabic_only=True,
                )
                display_name = clean_str(
                    row.get("display_name"),
                    fallback=f"{zone_name} - {city}",
                    max_len=320,
                    latin_arabic_only=True,
                )
                cells.append(
                    EconomicCell(
                        cell_id=clean_str(row.get("cell_id"), max_len=32),
                        cell_lat=to_float(row.get("cell_lat")),
                        cell_lon=to_float(row.get("cell_lon")),
                        city=city,
                        zone_name=zone_name,
                        district=district,
                        region_name=region_name,
                        display_name=display_name,
                        sector_main=normalize_sector_main(
                            row.get("sector_main"),
                            row.get("sector"),
                        ),
                        entity_count_real=to_int(row.get("entity_count_real")),
                        entity_count_total=to_int(row.get("entity_count_total")),
                        density_log=to_float(row.get("density_log")),
                        active_rate=to_float(row.get("active_rate")),
                        capital_median=to_float(row.get("capital_median")),
                        capital_mean=to_float(row.get("capital_mean")),
                        capital_max=to_float(row.get("capital_max")),
                        sector_diversity=to_float(row.get("sector_diversity")),
                        formal_ratio=to_float(row.get("formal_ratio")),
                        sarl_count=to_int(row.get("sarl_count")),
                        sa_count=to_int(row.get("sa_count")),
                    )
                )
            EconomicCell.objects.bulk_create(cells, batch_size=500, ignore_conflicts=True)
            for c in EconomicCell.objects.all().only("id", "cell_id", "sector_main", "cell_lat", "cell_lon"):
                cell_lookup[(c.cell_id, c.sector_main)] = c.id
            self.stdout.write(self.style.SUCCESS(f"Imported {len(cells)} economic cells."))

        if not options["cells_only"]:
            self.stdout.write(f"Loading entities: {entities_path}")
            edf = pd.read_csv(entities_path, low_memory=False)
            edf = edf.dropna(subset=["latitude", "longitude", "city"])
            geo_cells = (
                EconomicCell.objects.values("id", "cell_id", "cell_lat", "cell_lon")
                .distinct()
            )
            unique_geo = {}
            for g in geo_cells:
                if g["cell_id"] not in unique_geo:
                    unique_geo[g["cell_id"]] = g

            geo_list = list(unique_geo.values())
            batch = []
            for i, row in edf.iterrows():
                lat, lon = float(row["latitude"]), float(row["longitude"])
                cid = compute_cell_key(lat, lon)
                best_cell_id = cid
                best_dist = 999
                for g in geo_list:
                    d = haversine_km(lat, lon, float(g["cell_lat"]), float(g["cell_lon"]))
                    if d < best_dist:
                        best_dist = d
                        best_cell_id = g["cell_id"]
                if best_dist > 5:
                    best_cell_id = cid

                fk = None
                sm = normalize_sector_main(row.get("sector_main"), row.get("sector"))
                if (best_cell_id, sm) in cell_lookup:
                    fk = cell_lookup[(best_cell_id, sm)]
                elif best_cell_id in unique_geo:
                    fk = unique_geo[best_cell_id]["id"]

                ent = Enterprise(
                    entity_name=clean_str(row.get("entity_name"), max_len=512),
                    sector=clean_str(row.get("sector"), max_len=2000),
                    sector_main=sm,
                    entity_type=clean_str(row.get("entity_type"), max_len=128),
                    legal_form=clean_str(row.get("legal_form"), max_len=128),
                    company_status=clean_str(row.get("company_status"), max_len=64),
                    capital_dhs=to_float(row.get("capital_dhs")),
                    activity=clean_str(row.get("activity"), max_len=2000),
                    phone=clean_str(row.get("phone"), max_len=64),
                    address=clean_str(row.get("address"), max_len=2000),
                    city=clean_str(row.get("city"), fallback="Unknown City", max_len=128),
                    region=clean_str(row.get("region"), max_len=128),
                    latitude=lat,
                    longitude=lon,
                    source_dataset=clean_str(row.get("source_dataset"), max_len=64),
                    geo_cell_key=best_cell_id,
                    economic_cell_id=fk,
                )
                batch.append(ent)
                if len(batch) >= 1000:
                    Enterprise.objects.bulk_create(batch, batch_size=1000)
                    batch = []
                    if i % 5000 == 0:
                        self.stdout.write(f"  …{i} rows processed")

            if batch:
                Enterprise.objects.bulk_create(batch, batch_size=1000)
            self.stdout.write(self.style.SUCCESS(f"Imported {len(edf)} enterprises."))
