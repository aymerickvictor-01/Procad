from django.contrib import admin

from .models import ContactAttachment, ContactMessage


class AttachmentInline(admin.TabularInline):
    model = ContactAttachment
    fields = ["original_name", "content_type", "size"]
    readonly_fields = fields
    extra = 0
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ["reference", "kind", "full_name", "subject", "phone", "service", "is_read", "created_at"]
    list_filter = ["kind", "is_read", "created_at"]
    inlines = [AttachmentInline]
    list_select_related = ["service"]
    search_fields = ["reference", "full_name", "email", "phone", "subject", "message", "city"]
    date_hierarchy = "created_at"
    actions = ["mark_read", "mark_unread"]
    # Les messages viennent des visiteurs : l'admin les lit, il ne les réécrit pas.
    readonly_fields = [
        "reference", "kind", "full_name", "email", "phone", "subject", "message", "service",
        "project_type", "city", "timeline", "budget", "created_at",
    ]
    fields = readonly_fields[:-1] + ["is_read", "created_at"]

    def has_add_permission(self, request):
        return False

    @admin.action(description="Marquer comme lu")
    def mark_read(self, request, queryset):
        queryset.update(is_read=True)

    @admin.action(description="Marquer comme non lu")
    def mark_unread(self, request, queryset):
        queryset.update(is_read=False)
