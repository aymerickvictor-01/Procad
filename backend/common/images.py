from pathlib import Path
from uuid import uuid4

from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.utils.deconstruct import deconstructible
from PIL import Image

ALLOWED_IMAGE_FORMATS = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp"}


@deconstructible
class UploadTo:
    """
    Chemin de téléversement avec un nom de fichier régénéré (UUID).

    Le nom d'origine choisi par l'utilisateur n'est jamais réutilisé : il peut
    contenir des caractères problématiques ou révéler des informations.
    """

    def __init__(self, path):
        self.path = path

    def __call__(self, instance, filename):
        ext = Path(filename).suffix.lower()
        return f"{timezone.now().strftime(self.path)}/{uuid4().hex}{ext}"

    def __eq__(self, other):
        return isinstance(other, UploadTo) and self.path == other.path


def validate_image(file):
    """Limite la taille et vérifie avec Pillow que le contenu est une image JPEG, PNG ou WebP."""
    # Fichier déjà enregistré (formulaire réenregistré sans nouvel upload) : rien à vérifier.
    if getattr(file, "_committed", False):
        return

    max_size = settings.MAX_IMAGE_UPLOAD_SIZE
    if file.size > max_size:
        raise ValidationError(
            f"L'image ne doit pas dépasser {max_size // (1024 * 1024)} Mo.",
            code="image_too_large",
        )

    try:
        file.seek(0)
        with Image.open(file) as img:
            image_format = img.format
            img.verify()
    except Exception:
        raise ValidationError("Le fichier n'est pas une image valide.", code="invalid_image")
    finally:
        file.seek(0)

    if image_format not in ALLOWED_IMAGE_FORMATS:
        raise ValidationError(
            "Formats acceptés : JPEG, PNG, WebP.", code="invalid_image_format"
        )
