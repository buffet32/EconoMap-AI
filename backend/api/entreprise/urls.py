from rest_framework import routers
from django.urls import path, include

from .views import (
    EntrepriseViewSet,
    UserRegisterView,
    CustomUserAdminViewSet,
    login_view,
)
from .views_intelligence import (
    cities_list,
    sectors_list,
    zones_list,
    zones_summary,
    zone_detail,
    zone_companies,
    map_viewport,
    predict_view,
    dashboard_view,
    heatmap_view,
    recommendations_view,
    insights_view,
    enterprises_list,
)

router = routers.DefaultRouter()
router.register(r"entreprises", EntrepriseViewSet)

admin_router = routers.DefaultRouter()
admin_router.register(r"users", CustomUserAdminViewSet, basename="user")

urlpatterns = [
    path("", include(router.urls)),
    path("", include(admin_router.urls)),
    path("register/", UserRegisterView.as_view(), name="register"),
    path("login/", login_view, name="login"),
    path("cities/", cities_list),
    path("sectors/", sectors_list),
    path("zones/", zones_list),
    path("zones/summary/", zones_summary),
    path("zones/<int:pk>/", zone_detail),
    path("zones/<int:pk>/companies/", zone_companies),
    path("zones/<int:pk>/enterprises/", zone_companies),
    path("map/viewport/", map_viewport),
    path("predict/", predict_view),
    path("dashboard/", dashboard_view),
    path("heatmap/", heatmap_view),
    path("recommendations/", recommendations_view),
    path("insights/<int:pk>/", insights_view),
    path("enterprises/", enterprises_list),
] 