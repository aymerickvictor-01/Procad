import logging
from io import BytesIO
from pathlib import Path
from uuid import uuid4

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.db.models.signals import post_save, pre_save
from django.utils import timezone
from django.utils.deconstruct import deconstructible
from PIL import Image, ImageOps

logger = logging.getLogger(__name__)

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


def optimize_image(file, max_side=None):
    """
    Prépare une image téléversée pour le web : orientation corrigée (photos de téléphone),
    côté le plus long ramené à `max_side`, recompression, et suppression des métadonnées
    (EXIF, dont la position GPS). Renvoie un ContentFile du même format.
    """
    max_side = max_side or settings.IMAGE_MAX_SIDE
    file.seek(0)
    with Image.open(file) as source:
        image_format = source.format
        image = ImageOps.exif_transpose(source)
        image.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)

        buffer = BytesIO()
        if image_format == "JPEG":
            image.convert("RGB").save(buffer, "JPEG", quality=85, optimize=True, progressive=True)
        elif image_format == "WEBP":
            image.save(buffer, "WEBP", quality=85, method=6)
        else:
            image.save(buffer, "PNG", optimize=True)
    file.seek(0)
    return ContentFile(buffer.getvalue(), name=Path(file.name).name)


# --- Versions allégées (WebP) pour les écrans plus petits ------------------------------
#
# Pour chaque image, des copies WebP de largeur réduite sont enregistrées à côté de l'original :
# « services/2026/10/abc.jpg » -> « services/2026/10/abc.w480.webp », « abc.w960.webp »…
# Le navigateur choisit la plus adaptée à l'écran (attribut srcset) : un téléphone télécharge
# quelques dizaines de Ko au lieu de l'image complète.

VARIANT_WIDTHS = (480, 960, 1600)


def variant_name(name, width):
    return f"{Path(name).with_suffix('').as_posix()}.w{width}.webp"


def variant_names(name):
    return [variant_name(name, width) for width in VARIANT_WIDTHS]


def generate_variants(fieldfile):
    """Crée les versions WebP plus étroites que l'original (une image de 800 px n'a que la 480)."""
    storage, name = fieldfile.storage, fieldfile.name
    with storage.open(name, "rb") as file, Image.open(file) as source:
        image = source.convert("RGBA" if source.mode in ("RGBA", "LA", "P") else "RGB")
    created = 0
    for width in VARIANT_WIDTHS:
        if width >= image.width:
            break
        copy = image.copy()
        copy.thumbnail((width, image.height), Image.Resampling.LANCZOS)
        buffer = BytesIO()
        copy.save(buffer, "WEBP", quality=80, method=6)
        target = variant_name(name, width)
        storage.delete(target)  # sinon le stockage ajouterait un suffixe au nom
        storage.save(target, ContentFile(buffer.getvalue()))
        created += 1
    return created


def existing_variants(fieldfile):
    """{largeur: url} des versions présentes sur le disque."""
    if not fieldfile:
        return {}
    storage = fieldfile.storage
    variants = {}
    for width in VARIANT_WIDTHS:
        name = variant_name(fieldfile.name, width)
        if not storage.exists(name):
            break
        variants[str(width)] = storage.url(name)
    return variants


def image_variants(model, *field_names):
    """Génère les versions allégées après l'enregistrement d'une image (si elles manquent)."""

    def on_save(sender, instance, **kwargs):
        for name in field_names:
            file = getattr(instance, name)
            if not file or file.storage.exists(variant_name(file.name, VARIANT_WIDTHS[0])):
                continue
            try:
                generate_variants(file)
            except Exception:  # une image illisible ne doit pas bloquer l'enregistrement
                logger.exception("Versions allégées non générées pour %s", file.name)

    post_save.connect(on_save, sender=model, weak=False, dispatch_uid=f"image_variants_{model._meta.label_lower}")


def optimize_images(model, *field_names):
    """Optimise automatiquement les nouvelles images des champs indiqués, avant l'enregistrement."""

    def on_save(sender, instance, **kwargs):
        for name in field_names:
            file = getattr(instance, name)
            # Seulement les fichiers nouvellement téléversés (pas encore enregistrés sur le disque).
            if file and not getattr(file, "_committed", True):
                setattr(instance, name, optimize_image(file))

    pre_save.connect(on_save, sender=model, weak=False, dispatch_uid=f"optimize_images_{model._meta.label_lower}")
