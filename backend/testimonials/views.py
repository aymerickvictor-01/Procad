import django_filters
from drf_spectacular.utils import extend_schema
from rest_framework import generics

from .models import Testimonial
from .serializers import TestimonialSerializer


class TestimonialFilter(django_filters.FilterSet):
    service = django_filters.CharFilter(field_name="service__slug", help_text="Slug du service.")

    class Meta:
        model = Testimonial
        fields = ["service"]


@extend_schema(tags=["Public"], summary="Témoignages publiés")
class TestimonialListView(generics.ListAPIView):
    serializer_class = TestimonialSerializer
    filterset_class = TestimonialFilter
    queryset = Testimonial.objects.filter(is_published=True).select_related("service")
