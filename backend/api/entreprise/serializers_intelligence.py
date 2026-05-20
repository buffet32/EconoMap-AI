from rest_framework import serializers

from .models import EconomicCell, Enterprise
from .services.text_cleaning import sanitize_latin_arabic_text


class EconomicCellSerializer(serializers.ModelSerializer):
    class Meta:
        model = EconomicCell
        fields = [
            "id",
            "cell_id",
            "cell_lat",
            "cell_lon",
            "city",
            "zone_name",
            "district",
            "region_name",
            "display_name",
            "sector_main",
            "entity_count_real",
            "entity_count_total",
            "density_log",
            "active_rate",
            "capital_median",
            "capital_mean",
            "capital_max",
            "sector_diversity",
            "formal_ratio",
            "sarl_count",
            "sa_count",
        ]

    def to_representation(self, instance):
        payload = super().to_representation(instance)
        for field in ("city", "zone_name", "district", "region_name", "display_name"):
            payload[field] = sanitize_latin_arabic_text(payload.get(field))
        return payload


class EnterpriseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enterprise
        fields = "__all__"


class EnterpriseListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enterprise
        fields = [
            "id",
            "entity_name",
            "sector_main",
            "sector",
            "legal_form",
            "company_status",
            "city",
            "latitude",
            "longitude",
            "geo_cell_key",
        ]

    def to_representation(self, instance):
        payload = super().to_representation(instance)
        payload["entity_name"] = sanitize_latin_arabic_text(payload.get("entity_name"))
        payload["city"] = sanitize_latin_arabic_text(payload.get("city"))
        return payload
