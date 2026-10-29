from django.apps import AppConfig


class CompanyConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "company"
    verbose_name = "Entreprise"

    def ready(self):
        from common.files import cleanup_files
        from common.images import image_variants, optimize_images

        from .models import CompanyProfile

        cleanup_files(CompanyProfile, "logo", "hero_image")
        optimize_images(CompanyProfile, "logo", "hero_image")
        image_variants(CompanyProfile, "logo", "hero_image")
