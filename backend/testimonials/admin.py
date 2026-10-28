from django.contrib import admin

from .models import Testimonial


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ["author_name", "author_role", "rating", "service", "is_published", "created_at"]
    list_editable = ["is_published"]
    list_filter = ["is_published", "rating"]
    list_select_related = ["service"]
    search_fields = ["author_name", "author_role", "content"]
    autocomplete_fields = ["service"]
