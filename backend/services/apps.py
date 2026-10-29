from django.apps import AppConfig


class ServicesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "services"
    verbose_name = "Services"

    def ready(self):
        from common.files import cleanup_files
        from common.images import image_variants, optimize_images

        from .models import Service, ServiceImage

        cleanup_files(Service, "cover_image")
        cleanup_files(ServiceImage, "image")
        optimize_images(Service, "cover_image")
        image_variants(Service, "cover_image")
        optimize_images(ServiceImage, "image")
        image_variants(ServiceImage, "image")
