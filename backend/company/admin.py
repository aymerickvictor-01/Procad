from django.contrib import admin
from django.shortcuts import redirect
from django.urls import reverse

from .models import CompanyProfile


@admin.register(CompanyProfile)
class CompanyProfileAdmin(admin.ModelAdmin):
    fieldsets = [
        ("Identité", {"fields": ["name", "slogan", "logo", "hero_image"]}),
        ("Textes", {"fields": ["description", "about_text"]}),
        ("Coordonnées", {"fields": ["email", "phone", "whatsapp", "address", "city", "country", "opening_hours"]}),
        ("Réseaux sociaux", {"fields": ["facebook_url", "linkedin_url", "instagram_url"]}),
    ]

    def changelist_view(self, request, extra_context=None):
        # Un seul profil : on ouvre directement sa fiche.
        profile = CompanyProfile.load()
        return redirect(reverse("admin:company_companyprofile_change", args=[profile.pk]))

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
