from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from PIL import Image
from rest_framework import serializers

from common.images import optimize_image

IMAGE_TYPES = {"JPEG": ("image/jpeg", ".jpg"), "PNG": ("image/png", ".png"), "WEBP": ("image/webp", ".webp")}
ACCEPTED = "Formats acceptés : photos JPEG, PNG ou WebP, et documents PDF."


def _megabytes(size):
    return f"{size // (1024 * 1024)} Mo"


def prepare_attachment(file):
    """
    Vérifie une pièce jointe d'après son contenu réel (pas son extension) et la prépare.
    Les photos sont réduites et débarrassées de leurs métadonnées (position GPS des téléphones).
    Renvoie {file, original_name, content_type, size} ; lève ValidationError sinon.
    """
    name = Path(file.name).name[:200]
    if file.size > settings.CONTACT_ATTACHMENT_MAX_SIZE:
        raise serializers.ValidationError(
            f"« {name} » dépasse {_megabytes(settings.CONTACT_ATTACHMENT_MAX_SIZE)}."
        )

    file.seek(0)
    head = file.read(5)
    file.seek(0)
    if head == b"%PDF-":
        content = ContentFile(file.read(), name=f"{Path(name).stem}.pdf")
        return {"file": content, "original_name": name, "content_type": "application/pdf", "size": content.size}

    try:
        with Image.open(file) as image:
            image_format = image.format
            image.verify()
    except Exception:
        raise serializers.ValidationError(f"« {name} » n'est pas accepté. {ACCEPTED}")
    if image_format not in IMAGE_TYPES:
        raise serializers.ValidationError(f"« {name} » n'est pas accepté. {ACCEPTED}")

    content_type, extension = IMAGE_TYPES[image_format]
    optimized = optimize_image(file)
    optimized.name = f"{Path(name).stem}{extension}"
    return {"file": optimized, "original_name": name, "content_type": content_type, "size": optimized.size}


def prepare_attachments(files):
    if len(files) > settings.CONTACT_ATTACHMENTS_MAX_FILES:
        raise serializers.ValidationError(f"{settings.CONTACT_ATTACHMENTS_MAX_FILES} fichiers maximum.")
    total = sum(file.size for file in files)
    if total > settings.CONTACT_ATTACHMENTS_MAX_TOTAL:
        raise serializers.ValidationError(
            f"Les fichiers ne doivent pas dépasser {_megabytes(settings.CONTACT_ATTACHMENTS_MAX_TOTAL)} au total."
        )
    return [prepare_attachment(file) for file in files]
