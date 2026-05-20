from __future__ import annotations

import argparse
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd
import requests


NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
USER_AGENT = "GeoEconomicIntelligencePlatform/1.0 (student-research-project)"
REQUEST_TIMEOUT = 15
MAX_RETRIES = 3
SAVE_EVERY = 50

ZONE_PRIORITY = [
    "suburb",
    "neighbourhood",
    "borough",
    "quarter",
    "village",
    "town",
    "city_district",
    "municipality",
    "city",
]

DISTRICT_PRIORITY = ["county", "state_district", "region"]
REGION_PRIORITY = ["state", "region"]
CITY_PRIORITY = ["city", "town", "municipality", "village", "county", "state_district"]

INVALID_VALUES = {
    "",
    "unknown",
    "unnamed road",
    "nan",
    "null",
    "none",
    "n/a",
    "-",
}


def normalize_text(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    if not text:
        return ""
    lowered = text.lower()
    if lowered in INVALID_VALUES:
        return ""
    if lowered.startswith("unnamed road"):
        return ""
    return text


def cache_key(lat: float, lon: float) -> str:
    return f"{float(lat):.6f}_{float(lon):.6f}"


def pick_first(address: dict[str, Any], priorities: list[str]) -> str:
    for key in priorities:
        value = normalize_text(address.get(key))
        if value:
            return value
    return ""


def load_cache(cache_path: Path) -> dict[str, dict[str, str]]:
    if not cache_path.exists():
        return {}
    try:
        with cache_path.open("r", encoding="utf-8") as handle:
            raw = json.load(handle)
        if isinstance(raw, dict):
            return raw
    except json.JSONDecodeError:
        corrupted_name = (
            f"{cache_path.stem}.corrupted.{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.json"
        )
        corrupted_path = cache_path.with_name(corrupted_name)
        cache_path.rename(corrupted_path)
        print(f"[WARN] Corrupted cache moved to: {corrupted_path}")
    except Exception as exc:
        print(f"[WARN] Could not read cache: {exc}")
    return {}


def save_cache(cache_path: Path, cache: dict[str, dict[str, str]]) -> None:
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = cache_path.with_suffix(".tmp")
    with temp_path.open("w", encoding="utf-8") as handle:
        json.dump(cache, handle, ensure_ascii=False, indent=2)
    temp_path.replace(cache_path)


def build_display_fields(
    address: dict[str, Any], fallback_city: str
) -> dict[str, str]:
    city = pick_first(address, CITY_PRIORITY) or normalize_text(fallback_city) or "Unknown"
    zone_name = pick_first(address, ZONE_PRIORITY)
    if not zone_name:
        zone_name = f"{city} Center"
    district = pick_first(address, DISTRICT_PRIORITY) or city
    region_name = pick_first(address, REGION_PRIORITY) or district
    display_name = f"{zone_name} - {city}"
    return {
        "zone_name": zone_name,
        "district": district,
        "region_name": region_name,
        "display_name": display_name,
    }


class ReverseGeocoder:
    def __init__(self) -> None:
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT})
        self.last_request_time = 0.0

    def reverse(self, lat: float, lon: float) -> dict[str, Any] | None:
        for attempt in range(1, MAX_RETRIES + 1):
            elapsed = time.time() - self.last_request_time
            if elapsed < 1.0:
                time.sleep(1.0 - elapsed)
            try:
                response = self.session.get(
                    NOMINATIM_URL,
                    params={"lat": lat, "lon": lon, "format": "jsonv2", "addressdetails": 1},
                    timeout=REQUEST_TIMEOUT,
                )
                self.last_request_time = time.time()
                if response.status_code == 200:
                    payload = response.json()
                    address = payload.get("address") if isinstance(payload, dict) else {}
                    return address if isinstance(address, dict) else {}
                print(
                    f"[WARN] Nominatim HTTP {response.status_code} for ({lat}, {lon}) "
                    f"attempt {attempt}/{MAX_RETRIES}"
                )
            except requests.Timeout:
                print(f"[WARN] Timeout for ({lat}, {lon}) attempt {attempt}/{MAX_RETRIES}")
            except requests.RequestException as exc:
                print(f"[WARN] Request error for ({lat}, {lon}) attempt {attempt}/{MAX_RETRIES}: {exc}")
            if attempt < MAX_RETRIES:
                time.sleep(min(2**attempt, 5))
        return None


def safe_float(value: Any) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def load_existing_enrichment(output_path: Path) -> dict[tuple[str, str], dict[str, str]]:
    if not output_path.exists():
        return {}
    try:
        edf = pd.read_csv(output_path, low_memory=False)
    except Exception as exc:
        print(f"[WARN] Could not read existing output for resume: {exc}")
        return {}

    required = {"cell_id", "sector_main", "zone_name", "district", "region_name", "display_name"}
    if not required.issubset(set(edf.columns)):
        return {}

    resume_lookup: dict[tuple[str, str], dict[str, str]] = {}
    for _, row in edf.iterrows():
        key = (str(row.get("cell_id", "")).strip(), str(row.get("sector_main", "")).strip())
        resume_lookup[key] = {
            "zone_name": normalize_text(row.get("zone_name")),
            "district": normalize_text(row.get("district")),
            "region_name": normalize_text(row.get("region_name")),
            "display_name": normalize_text(row.get("display_name")),
        }
    print(f"[INFO] Resume data loaded for {len(resume_lookup)} rows from existing output.")
    return resume_lookup


def persist_progress(
    df: pd.DataFrame,
    output_path: Path,
    cache_path: Path,
    cache: dict[str, dict[str, str]],
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    temp_output = output_path.with_suffix(".tmp.csv")
    df.to_csv(temp_output, index=False)
    temp_output.replace(output_path)
    save_cache(cache_path, cache)


def main() -> None:
    script_path = Path(__file__).resolve()
    project_root = script_path.parents[3]
    api_root = script_path.parents[1]

    parser = argparse.ArgumentParser(description="Enrich economic zones with reverse geocoding.")
    parser.add_argument(
        "--input",
        default=str(project_root / "model" / "dataset.csv"),
        help="Input CSV path.",
    )
    parser.add_argument(
        "--output",
        default=str(project_root / "model" / "data_ml_final_enriched.csv"),
        help="Output CSV path.",
    )
    parser.add_argument(
        "--cache",
        default=str(api_root / "cache" / "geocode_cache.json"),
        help="JSON cache path.",
    )
    args = parser.parse_args()

    input_path = Path(args.input).resolve()
    output_path = Path(args.output).resolve()
    cache_path = Path(args.cache).resolve()

    if not input_path.exists():
        raise FileNotFoundError(f"Input dataset not found: {input_path}")

    print(f"[INFO] Input:  {input_path}")
    print(f"[INFO] Output: {output_path}")
    print(f"[INFO] Cache:  {cache_path}")

    df = pd.read_csv(input_path, low_memory=False)
    for col in ("zone_name", "district", "region_name", "display_name"):
        if col not in df.columns:
            df[col] = ""

    resume_lookup = load_existing_enrichment(output_path)
    if resume_lookup:
        for idx, row in df.iterrows():
            key = (str(row.get("cell_id", "")).strip(), str(row.get("sector_main", "")).strip())
            enriched = resume_lookup.get(key)
            if not enriched:
                continue
            for col in ("zone_name", "district", "region_name", "display_name"):
                if not normalize_text(df.at[idx, col]):
                    df.at[idx, col] = enriched.get(col, "")

    cache = load_cache(cache_path)
    geocoder = ReverseGeocoder()

    processed = 0
    cache_hits = 0
    api_calls = 0
    failures = 0

    total_rows = len(df)
    print(f"[INFO] Total rows: {total_rows}")
    try:
        for idx, row in df.iterrows():
            if normalize_text(row.get("display_name")):
                continue

            lat = safe_float(row.get("cell_lat"))
            lon = safe_float(row.get("cell_lon"))
            fallback_city = normalize_text(row.get("city"))

            if lat is None or lon is None:
                failures += 1
                fallback_fields = build_display_fields({}, fallback_city)
                for col, value in fallback_fields.items():
                    df.at[idx, col] = value
                continue

            key = cache_key(lat, lon)
            cached_payload = cache.get(key)
            if cached_payload:
                cache_hits += 1
                fields = {
                    "zone_name": normalize_text(cached_payload.get("zone_name")),
                    "district": normalize_text(cached_payload.get("district")),
                    "region_name": normalize_text(cached_payload.get("region_name")),
                    "display_name": normalize_text(cached_payload.get("display_name")),
                }
                if not fields["display_name"]:
                    fields = build_display_fields({}, fallback_city)
            else:
                api_calls += 1
                address = geocoder.reverse(lat, lon)
                if address is None:
                    failures += 1
                    fields = build_display_fields({}, fallback_city)
                else:
                    fields = build_display_fields(address, fallback_city)
                cache[key] = fields

            for col, value in fields.items():
                df.at[idx, col] = value

            processed += 1
            if processed % SAVE_EVERY == 0:
                persist_progress(df, output_path, cache_path, cache)
                print(
                    f"[INFO] Processed {processed}/{total_rows} rows | "
                    f"cache_hits={cache_hits} api_calls={api_calls} failures={failures}"
                )
    except KeyboardInterrupt:
        print("\n[WARN] Interrupted by user. Saving progress...")
    finally:
        persist_progress(df, output_path, cache_path, cache)
        print(
            f"[DONE] Rows processed={processed} | cache_hits={cache_hits} "
            f"| api_calls={api_calls} | failures={failures}"
        )
        print(f"[DONE] Enriched dataset written to: {output_path}")


if __name__ == "__main__":
    main()
