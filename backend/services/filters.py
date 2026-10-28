import django_filters

from .models import Service


class ServiceFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name="category__slug", help_text="Slug de la catégorie.")
    featured = django_filters.BooleanFilter(field_name="is_featured", help_text="true : services mis en avant.")

    class Meta:
        model = Service
        fields = ["category", "featured"]
