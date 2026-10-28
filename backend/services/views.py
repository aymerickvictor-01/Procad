from django.db.models import Count, ProtectedError, Q
from django.shortcuts import get_object_or_404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import generics, mixins, status, viewsets
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from .filters import ServiceFilter
from .models import Category, Service, ServiceImage
from .serializers import (
    AdminCategorySerializer,
    AdminServiceImageSerializer,
    AdminServiceSerializer,
    CategorySerializer,
    ServiceDetailSerializer,
    ServiceListSerializer,
)


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


# --- Administration -----------------------------------------------------------


@extend_schema(tags=["Admin - Catégories"])
class AdminCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = AdminCategorySerializer
    pagination_class = None
    search_fields = ["name"]
    queryset = Category.objects.annotate(service_count=Count("services")).order_by("display_order", "name")

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()
        try:
            category.delete()
        except ProtectedError:
            return Response(
                {
                    "detail": f"Impossible de supprimer « {category.name} » : elle contient "
                    f"{category.service_count} service(s). Déplacez d'abord ces services "
                    "vers une autre catégorie."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=["Admin - Services"])
class AdminServiceViewSet(viewsets.ModelViewSet):
    """Tous les services, brouillons compris."""

    permission_classes = [IsAdminUser]
    serializer_class = AdminServiceSerializer
    filterset_fields = ["category", "is_published", "is_featured"]
    search_fields = ["title", "short_description", "description"]
    ordering_fields = ["title", "display_order", "created_at", "updated_at"]
    queryset = Service.objects.select_related("category").prefetch_related("features", "images")


@extend_schema(
    tags=["Admin - Services"],
    parameters=[
        OpenApiParameter("service_pk", OpenApiTypes.INT, OpenApiParameter.PATH, description="Id du service."),
    ],
)
class AdminServiceImageViewSet(
    mixins.CreateModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet
):
    """Galerie d'un service : ajout (multipart), modification du texte alternatif ou de l'ordre, suppression."""

    permission_classes = [IsAdminUser]
    serializer_class = AdminServiceImageSerializer
    lookup_url_kwarg = "image_id"

    def get_queryset(self):
        return ServiceImage.objects.filter(service_id=self.kwargs["service_pk"])

    def perform_create(self, serializer):
        serializer.save(service=get_object_or_404(Service, pk=self.kwargs["service_pk"]))
