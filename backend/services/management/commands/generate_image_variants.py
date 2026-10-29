"""
Génère les versions WebP allégées de toutes les images existantes.

    python manage.py generate_image_variants          crée les versions manquantes
    python manage.py generate_image_variants --force  les recrée toutes

Les nouvelles images téléversées sont traitées automatiquement : cette commande ne sert que
pour les images enregistrées avant l'ajout de cette fonctionnalité (ou après une restauration).
"""
from django.core.management.base import BaseCommand

from common.images import VARIANT_WIDTHS, generate_variants, variant_name
from company.models import CompanyProfile
from services.models import Service, ServiceImage
from testimonials.models import Testimonial

FIELDS = [
    (CompanyProfile, "logo"),
    (CompanyProfile, "hero_image"),
    (Service, "cover_image"),
    (ServiceImage, "image"),
    (Testimonial, "photo"),
]


class Command(BaseCommand):
    help = "Génère les versions WebP allégées des images existantes."

    def add_arguments(self, parser):
        parser.add_argument("--force", action="store_true", help="Recrée aussi les versions existantes.")

    def handle(self, *args, force=False, **options):
        processed = skipped = failed = 0
        for model, field in FIELDS:
            for instance in model.objects.exclude(**{field: ""}).only("pk", field):
                file = getattr(instance, field)
                if not force and file.storage.exists(variant_name(file.name, VARIANT_WIDTHS[0])):
                    skipped += 1
                    continue
                try:
                    generate_variants(file)
                    processed += 1
                except Exception as exc:  # fichier manquant ou illisible : on continue
                    failed += 1
                    self.stderr.write(f"{file.name} : {exc}")
        self.stdout.write(self.style.SUCCESS(
            f"Images traitées : {processed}, déjà à jour : {skipped}, en échec : {failed}."
        ))
