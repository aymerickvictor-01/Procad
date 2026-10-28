from rest_framework import serializers

from common.serializers import BaseModelSerializer

from .models import Category, Service, ServiceImage


class CategorySerializer(BaseModelSerializer):
    service_count = serializers.IntegerField(read_only=True, help_text="Nombre de services publiés.")

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "service_count"]


class CategoryRefSerializer(BaseModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class ServiceRefSerializer(BaseModelSerializer):
    """Référence courte vers un service (témoignages, messages)."""

    class Meta:
        model = Service
        fields = ["title", "slug"]


class ServiceImageSerializer(BaseModelSerializer):
    class Meta:
        model = ServiceImage
        fields = ["id", "image", "alt_text"]


class ServiceListSerializer(BaseModelSerializer):
    category = CategoryRefSerializer(read_only=True)

    class Meta:
        model = Service
        fields = [
            "id", "title", "slug", "category", "short_description",
            "cover_image", "price_label", "is_featured",
        ]


class ServiceDetailSerializer(ServiceListSerializer):
    images = ServiceImageSerializer(many=True, read_only=True)
    features = serializers.SlugRelatedField(many=True, read_only=True, slug_field="label")

    class Meta(ServiceListSerializer.Meta):
        fields = ServiceListSerializer.Meta.fields + ["description", "images", "features", "updated_at"]
