from django.db.models import Count, Q
from drf_spectacular.utils import extend_schema
from rest_framework import generics, viewsets

from .filters import ServiceFilter
from .models import Category, Service
from .serializers import CategorySerializer, ServiceDetailSerializer, ServiceListSerializer


@extend_schema(tags=["Public"], summary="Catégories avec le nombre de services publiés")
class CategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    # Peu nombreuses et affichées en entier (onglets de filtre) : pas de pagination.
    pagination_class = None
    # order_by explicite : Django n'applique pas Meta.ordering aux requêtes avec agrégat (Count).
    queryset = Category.objects.annotate(
        service_count=Count("services", filter=Q(services__is_published=True))
    ).order_by("display_order", "name")


@extend_schema(tags=["Public"])
class ServiceViewSet(viewsets.ReadOnlyModelViewSet):
    """Services publiés uniquement : un brouillon renvoie 404, même par son slug."""

    lookup_field = "slug"
    filterset_class = ServiceFilter
    search_fields = ["title", "short_description", "description", "category__name"]
    ordering_fields = ["display_order", "title", "updated_at"]

    def get_queryset(self):
        queryset = Service.objects.published().select_related("category")
        if self.action == "retrieve":
            queryset = queryset.prefetch_related("images", "features")
        return queryset

    def get_serializer_class(self):
        return ServiceDetailSerializer if self.action == "retrieve" else ServiceListSerializer
