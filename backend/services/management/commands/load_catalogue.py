"""
Charge le catalogue réel des services PROCAD (services/catalogue/).

    python manage.py load_catalogue           crée les catégories et services manquants
    python manage.py load_catalogue --update  remet aussi les textes et points forts du catalogue
                                              sur les services existants

Sans --update, un service ou une catégorie déjà présent (même slug) n'est jamais modifié :
les corrections faites par l'administrateur sont conservées. Les images ne sont ajoutées qu'à
un service qui n'a pas encore d'image de couverture.
"""
from django.core.files import File
from django.core.management.base import BaseCommand
from django.db import transaction

from services.catalogue import CATEGORIES, IMAGES_DIR, SERVICES
from services.models import Category, Service, ServiceFeature, ServiceImage


class Command(BaseCommand):
    help = "Charge le catalogue réel des services PROCAD (catégories, services, images)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--update", action="store_true",
            help="Remet les textes et points forts du catalogue sur les services existants.",
        )

    @transaction.atomic
    def handle(self, *args, update=False, **options):
        counts = {"categories": 0, "services": 0, "updated": 0, "images": 0}

        categories = {}
        for order, data in enumerate(CATEGORIES, start=1):
            category = (
                Category.objects.filter(slug=data["slug"]).first()
                or Category.objects.filter(name=data["name"]).first()
            )
            if category is None:
                category = Category(slug=data["slug"])
                counts["categories"] += 1
            elif not update:
                categories[data["slug"]] = category
                continue
            category.name = data["name"]
            category.description = data["description"]
            category.display_order = order
            category.save()
            categories[data["slug"]] = category

        for order, data in enumerate(SERVICES, start=1):
            service = Service.objects.filter(slug=data["slug"]).first()
            created = service is None
            if created:
                service = Service(slug=data["slug"], is_published=True)
                counts["services"] += 1
            elif update:
                counts["updated"] += 1

            if created or update:
                service.category = categories[data["category"]]
                service.title = data["title"]
                service.short_description = data["short"]
                service.description = data["description"]
                service.price_label = data.get("price", "Sur devis")
                service.is_featured = data["featured"]
                service.display_order = order
                service.save()
                service.features.all().delete()
                ServiceFeature.objects.bulk_create(
                    ServiceFeature(service=service, label=label, display_order=i)
                    for i, label in enumerate(data["features"])
                )

            if not service.cover_image:
                counts["images"] += self._attach_images(service, data["images"])

        self.stdout.write(self.style.SUCCESS(
            f"Catalogue : {counts['categories']} catégories et {counts['services']} services créés, "
            f"{counts['updated']} services mis à jour, {counts['images']} images ajoutées."
        ))

    def _attach_images(self, service, images):
        """Première image = couverture, les suivantes = galerie."""
        (cover_name, _), *gallery = images
        with open(IMAGES_DIR / cover_name, "rb") as f:
            service.cover_image.save(cover_name, File(f), save=True)
        # Une galerie déjà remplie par l'administrateur n'est pas complétée.
        if service.images.exists():
            return 1
        for i, (name, alt) in enumerate(gallery):
            image = ServiceImage(service=service, alt_text=alt, display_order=i)
            with open(IMAGES_DIR / name, "rb") as f:
                image.image.save(name, File(f), save=True)
        return 1 + len(gallery)
