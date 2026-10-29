from django.db import transaction
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from common.images import existing_variants
from common.serializers import BaseModelSerializer, ImageVariantsField

from .models import Category, Service, ServiceFeature, ServiceImage


class CategorySerializer(BaseModelSerializer):
    service_count = serializers.IntegerField(read_only=True, help_text="Nombre de services publiés.")
    image = serializers.SerializerMethodField(
        help_text="Couverture du premier service publié de la catégorie (illustration), ou null."
    )
    image_variants = serializers.SerializerMethodField(help_text="Versions WebP allégées de `image`.")

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "service_count", "image", "image_variants"]

    def _cover(self, category):
        # Liste préchargée par CategoryListView (services publiés avec couverture, dans l'ordre).
        services = category.illustrated_services
        return services[0].cover_image if services else None

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_image(self, category):
        cover = self._cover(category)
        return cover.url if cover else None

    @extend_schema_field(ImageVariantsField())
    def get_image_variants(self, category):
        return existing_variants(self._cover(category))


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
    image_variants = ImageVariantsField(source="image")

    class Meta:
        model = ServiceImage
        fields = ["id", "image", "image_variants", "alt_text"]


class ServiceListSerializer(BaseModelSerializer):
    category = CategoryRefSerializer(read_only=True)
    cover_image_variants = ImageVariantsField(source="cover_image")

    class Meta:
        model = Service
        fields = [
            "id", "title", "slug", "category", "short_description",
            "cover_image", "cover_image_variants", "price_label", "is_featured",
        ]


class ServiceDetailSerializer(ServiceListSerializer):
    images = ServiceImageSerializer(many=True, read_only=True)
    features = serializers.SlugRelatedField(many=True, read_only=True, slug_field="label")

    class Meta(ServiceListSerializer.Meta):
        fields = ServiceListSerializer.Meta.fields + ["description", "images", "features", "updated_at"]


# --- Administration -----------------------------------------------------------


class AdminCategorySerializer(BaseModelSerializer):
    service_count = serializers.SerializerMethodField(help_text="Nombre total de services (tous statuts).")

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "display_order", "service_count", "created_at"]
        read_only_fields = ["created_at"]

    @extend_schema_field(serializers.IntegerField())
    def get_service_count(self, obj):
        # Annoté par la vue ; absent juste après une création (0 service).
        return getattr(obj, "service_count", 0)


class FeatureListField(serializers.ListField):
    """Points forts sous forme de liste de textes, dans l'ordre d'affichage."""

    child = serializers.CharField(max_length=200)

    def to_representation(self, manager):
        return [feature.label for feature in manager.all()]


class AdminServiceImageSerializer(BaseModelSerializer):
    class Meta:
        model = ServiceImage
        fields = ["id", "image", "alt_text", "display_order"]


class AdminServiceSerializer(BaseModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    features = FeatureListField(
        required=False,
        help_text="Liste complète des points forts : elle remplace l'existante. Absente = inchangée.",
    )
    images = AdminServiceImageSerializer(many=True, read_only=True)

    class Meta:
        model = Service
        fields = [
            "id", "title", "slug", "category", "category_name", "short_description", "description",
            "cover_image", "price_label", "is_published", "is_featured", "display_order",
            "features", "images", "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]
        # null = retirer l'image de couverture
        extra_kwargs = {"cover_image": {"allow_null": True}}

    @transaction.atomic
    def create(self, validated_data):
        features = validated_data.pop("features", None)
        service = super().create(validated_data)
        if features is not None:
            self._set_features(service, features)
        return service

    @transaction.atomic
    def update(self, instance, validated_data):
        features = validated_data.pop("features", None)
        service = super().update(instance, validated_data)
        if features is not None:
            self._set_features(service, features)
        return service

    def _set_features(self, service, labels):
        service.features.all().delete()
        ServiceFeature.objects.bulk_create(
            ServiceFeature(service=service, label=label, display_order=index)
            for index, label in enumerate(labels)
        )
        # Vide un éventuel cache prefetch_related pour que la réponse montre la nouvelle liste.
        getattr(service, "_prefetched_objects_cache", {}).pop("features", None)
