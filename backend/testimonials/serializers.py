from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from common.serializers import BaseModelSerializer
from services.serializers import ServiceRefSerializer

from .models import Testimonial


class TestimonialSerializer(BaseModelSerializer):
    service = serializers.SerializerMethodField()

    class Meta:
        model = Testimonial
        fields = ["id", "author_name", "author_role", "content", "rating", "photo", "service", "created_at"]

    @extend_schema_field(ServiceRefSerializer(allow_null=True))
    def get_service(self, obj):
        # Un témoignage peut viser un service en brouillon : on n'en dévoile pas le titre.
        service = obj.service
        if service is None or not service.is_published:
            return None
        return ServiceRefSerializer(service).data


class AdminTestimonialSerializer(BaseModelSerializer):
    service_title = serializers.CharField(source="service.title", read_only=True, default=None)

    class Meta:
        model = Testimonial
        fields = [
            "id", "author_name", "author_role", "content", "rating", "photo",
            "service", "service_title", "is_published", "created_at",
        ]
        read_only_fields = ["created_at"]
        # null = retirer la photo
        extra_kwargs = {"photo": {"allow_null": True}}
