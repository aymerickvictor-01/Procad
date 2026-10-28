from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import AdminCategoryViewSet, AdminServiceImageViewSet, AdminServiceViewSet

router = SimpleRouter()
router.register("services", AdminServiceViewSet, basename="admin-service")
router.register("categories", AdminCategoryViewSet, basename="admin-category")

image_list = AdminServiceImageViewSet.as_view({"post": "create"})
image_detail = AdminServiceImageViewSet.as_view(
    {"put": "update", "patch": "partial_update", "delete": "destroy"}
)

urlpatterns = [
    path("services/<int:service_pk>/images/", image_list, name="admin-service-image-list"),
    path("services/<int:service_pk>/images/<int:image_id>/", image_detail, name="admin-service-image-detail"),
    *router.urls,
]
