import shutil
import tempfile
from io import StringIO

from django.core.management import call_command
from django.test import TestCase, override_settings

from .catalogue import CATEGORIES, IMAGES_DIR, SERVICES
from .models import Category, Service, ServiceImage

TEMP_MEDIA = tempfile.mkdtemp()


class CatalogueDataTests(TestCase):
    """Contrôles du contenu lui-même, avant tout chargement."""

    def test_fields_fit_model_limits(self):
        for data in SERVICES:
            with self.subTest(data["slug"]):
                self.assertLessEqual(len(data["title"]), Service._meta.get_field("title").max_length)
                self.assertLessEqual(len(data["short"]), Service._meta.get_field("short_description").max_length)
                self.assertIn(data["category"], {c["slug"] for c in CATEGORIES})
                self.assertTrue(data["features"])

    def test_every_image_file_exists(self):
        for data in SERVICES:
            for name, alt in data["images"]:
                with self.subTest(name):
                    self.assertTrue((IMAGES_DIR / name).is_file())
                    self.assertTrue(alt)


@override_settings(MEDIA_ROOT=TEMP_MEDIA)
class LoadCatalogueCommandTests(TestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEMP_MEDIA, ignore_errors=True)

    def load(self, *args):
        call_command("load_catalogue", *args, stdout=StringIO())

    def test_creates_published_catalogue_with_images(self):
        self.load()
        self.assertEqual(Category.objects.count(), len(CATEGORIES))
        self.assertEqual(Service.objects.published().count(), len(SERVICES))
        self.assertTrue(all(s.cover_image for s in Service.objects.all()))
        gallery = sum(len(d["images"]) - 1 for d in SERVICES)
        self.assertEqual(ServiceImage.objects.count(), gallery)
        self.assertEqual(Service.objects.filter(is_featured=True).count(), 6)

    def test_running_twice_does_not_duplicate(self):
        self.load()
        self.load()
        self.assertEqual(Service.objects.count(), len(SERVICES))
        self.assertEqual(ServiceImage.objects.count(), sum(len(d["images"]) - 1 for d in SERVICES))

    def test_keeps_admin_changes_unless_update(self):
        self.load()
        service = Service.objects.get(slug="etancheite")
        service.title = "Titre modifié par l'administrateur"
        service.is_published = False
        service.save()

        self.load()
        service.refresh_from_db()
        self.assertEqual(service.title, "Titre modifié par l'administrateur")

        self.load("--update")
        service.refresh_from_db()
        self.assertEqual(service.title, "Étanchéité à chaud et à froid")
        # La publication reste un choix de l'administrateur, même avec --update.
        self.assertFalse(service.is_published)
