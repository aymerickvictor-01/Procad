from django.apps import AppConfig


class TestimonialsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "testimonials"
    verbose_name = "Témoignages"

    def ready(self):
        from common.files import cleanup_files

        from .models import Testimonial

        cleanup_files(Testimonial, "photo")
