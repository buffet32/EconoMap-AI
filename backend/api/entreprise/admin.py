from django.contrib import admin

from .models import CustomUser, EconomicCell, Enterprise, Entreprise


@admin.register(EconomicCell)
class EconomicCellAdmin(admin.ModelAdmin):
    list_display = ("display_name", "city", "zone_name", "sector_main", "entity_count_real", "density_log")
    list_filter = ("city", "region_name", "sector_main")
    search_fields = ("display_name", "zone_name", "cell_id", "city")


@admin.register(Enterprise)
class EnterpriseAdmin(admin.ModelAdmin):
    list_display = ("entity_name", "city", "sector_main", "company_status", "geo_cell_key")
    list_filter = ("city", "sector_main", "company_status")
    search_fields = ("entity_name", "geo_cell_key")


admin.site.register(Entreprise)
admin.site.register(CustomUser)
