from django.apps import AppConfig


class CompanyConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "company"
    verbose_name = "Entreprise"

    def ready(self):
        from common.files import cleanup_files

        from .models import CompanyProfile

        cleanup_files(CompanyProfile, "logo", "hero_image")
