from django.apps import AppConfig


class ContactConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "contact"
    verbose_name = "Contact"

    def ready(self):
        from common.files import cleanup_files

        from .models import ContactAttachment

        # Pièces jointes supprimées du disque avec leur message.
        cleanup_files(ContactAttachment, "file")
