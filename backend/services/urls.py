from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import CategoryListView, ServiceViewSet

router = SimpleRouter()
router.register("services", ServiceViewSet, basename="service")

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="category-list"),
    *router.urls,
]
