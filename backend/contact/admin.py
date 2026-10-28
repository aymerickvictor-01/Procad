from django.contrib import admin

from .models import ContactMessage


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ["full_name", "subject", "email", "service", "is_read", "created_at"]
    list_filter = ["is_read", "created_at"]
    list_select_related = ["service"]
    search_fields = ["full_name", "email", "subject", "message"]
    date_hierarchy = "created_at"
    actions = ["mark_read", "mark_unread"]
    # Les messages viennent des visiteurs : l'admin les lit, il ne les réécrit pas.
    readonly_fields = ["full_name", "email", "phone", "subject", "message", "service", "created_at"]
    fields = readonly_fields[:6] + ["is_read", "created_at"]

    def has_add_permission(self, request):
        return False

    @admin.action(description="Marquer comme lu")
    def mark_read(self, request, queryset):
        queryset.update(is_read=True)

    @admin.action(description="Marquer comme non lu")
    def mark_unread(self, request, queryset):
        queryset.update(is_read=False)
