from django.contrib import admin
from django.db.models import Count

from .models import Category, Service, ServiceFeature, ServiceImage


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "service_count", "display_order"]
    list_editable = ["display_order"]
    search_fields = ["name"]
    prepopulated_fields = {"slug": ["name"]}

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(_service_count=Count("services"))

    @admin.display(description="services", ordering="_service_count")
    def service_count(self, obj):
        return obj._service_count


class ServiceImageInline(admin.TabularInline):
    model = ServiceImage
    extra = 0


class ServiceFeatureInline(admin.TabularInline):
    model = ServiceFeature
    extra = 0


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "is_published", "is_featured", "display_order", "updated_at"]
    list_editable = ["is_published", "is_featured", "display_order"]
    list_filter = ["is_published", "is_featured", "category"]
    list_select_related = ["category"]
    search_fields = ["title", "short_description"]
    prepopulated_fields = {"slug": ["title"]}
    readonly_fields = ["created_at", "updated_at"]
    inlines = [ServiceFeatureInline, ServiceImageInline]
    fieldsets = [
        (None, {"fields": ["title", "slug", "category", "short_description", "description", "price_label"]}),
        ("Image", {"fields": ["cover_image"]}),
        ("Publication", {"fields": ["is_published", "is_featured", "display_order", "created_at", "updated_at"]}),
    ]
