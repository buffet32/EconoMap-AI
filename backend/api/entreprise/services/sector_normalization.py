from __future__ import annotations

import re
import unicodedata
from typing import Any

CANONICAL_SECTORS = [
    "Agriculture",
    "Commerce",
    "Construction",
    "Education",
    "Finance",
    "Healthcare",
    "Information Technology",
    "Manufacturing",
    "Professional Services",
    "Real Estate",
    "Tourism & Hospitality",
    "Transport",
    "Other",
]

INVALID_SECTOR_VALUES = {"", "nan", "none", "null", "n/a", "-", "unknown"}


def _normalize_text(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    if not text:
        return ""
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = text.upper()
    text = re.sub(r"[^A-Z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


_CANONICAL_LOOKUP = {_normalize_text(label): label for label in CANONICAL_SECTORS}

KEYWORD_MAP: list[tuple[str, tuple[str, ...]]] = [
    ("Finance", ("BANQUE", "BANQUES", "BANK", "ASSURANCE", "CREDIT", "FINANCE")),
    (
        "Healthcare",
        (
            "MEDECIN",
            "MEDECINS",
            "PHARMACIE",
            "PHARMACIES",
            "DENTISTE",
            "DENTISTES",
            "LABORATOIRE",
            "LABORATOIRES",
            "CLINIQUE",
            "HOPITAL",
            "VETERINAIRE",
            "VETERINAIRES",
            "SANTE",
        ),
    ),
    ("Real Estate", ("IMMOBILIER", "IMMOBILIERE", "IMMOBILIERES", "REAL ESTATE")),
    ("Education", ("ECOLE", "UNIVERSITE", "FORMATION", "EDUCATION")),
    ("Tourism & Hospitality", ("HOTEL", "HOTELLERIE", "RESTAURANT", "CAFE", "TOURISME", "RIAD")),
    ("Transport", ("TRANSPORT", "LOGISTIQUE", "STATION SERVICE", "STATIONS SERVICE")),
    ("Construction", ("CONSTRUCTION", "BTP", "CHANTIER", "GENIE CIVIL")),
    ("Information Technology", ("INFORMATIQUE", "IT", "SOFTWARE", "DIGITAL", "NUMERIQUE", "TELECOM")),
    ("Manufacturing", ("INDUSTRIE", "INDUSTRIEL", "USINE", "MANUFACTUR")),
    ("Professional Services", ("AVOCAT", "AVOCATS", "CONSEIL", "CONSULT", "SERVICE", "SERVICES")),
    ("Commerce", ("COMMERCE", "MARCHE", "VENTE", "BOUTIQUE", "MAGASIN", "RETAIL")),
    ("Agriculture", ("AGRICULTURE", "AGRICOLE", "AGRO", "ELEVAGE")),
]


def normalize_sector_main(sector_main: Any, sector_detail: Any = None) -> str:
    primary = _normalize_text(sector_main)
    detail = _normalize_text(sector_detail)

    if primary and primary.lower() not in INVALID_SECTOR_VALUES:
        exact = _CANONICAL_LOOKUP.get(primary)
        if exact:
            return exact

    text = " ".join(part for part in (primary, detail) if part)
    if not text:
        return "Other"

    for target, keywords in KEYWORD_MAP:
        if any(keyword in text for keyword in keywords):
            return target

    return "Other"
