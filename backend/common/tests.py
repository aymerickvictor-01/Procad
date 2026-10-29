import io
import shutil
import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from PIL import Image

from common.images import existing_variants, variant_name
from services.models import Category, Service

TEMP_MEDIA = tempfile.mkdtemp()


def jpeg_with_exif(width, height, orientation=None):
    """JPEG avec métadonnées EXIF (position GPS fictive, orientation éventuelle)."""
    image = Image.new("RGB", (width, height), "navy")
    exif = Image.Exif()
    exif[0x8825] = {2: (3.0, 52.0, 0.0)}  # bloc GPS
    if orientation:
        exif[0x0112] = orientation
    buffer = io.BytesIO()
    image.save(buffer, "JPEG", exif=exif.tobytes())
    return SimpleUploadedFile("photo.jpg", buffer.getvalue(), content_type="image/jpeg")


@override_settings(MEDIA_ROOT=TEMP_MEDIA, IMAGE_MAX_SIDE=1920)
class ImageOptimizationTests(TestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEMP_MEDIA, ignore_errors=True)

    def save_cover(self, upload):
        category = Category.objects.create(name=f"Cat {Category.objects.count()}")
        service = Service.objects.create(
            category=category, title="S", short_description="r", description="d", cover_image=upload
        )
        return Image.open(service.cover_image.path)

    def test_large_image_is_resized(self):
        stored = self.save_cover(jpeg_with_exif(4000, 3000))
        self.assertEqual(stored.size, (1920, 1440))

    def test_small_image_keeps_its_size(self):
        self.assertEqual(self.save_cover(jpeg_with_exif(800, 600)).size, (800, 600))

    def test_metadata_is_removed(self):
        stored = self.save_cover(jpeg_with_exif(800, 600))
        self.assertEqual(len(stored.getexif()), 0)

    def test_phone_orientation_is_applied(self):
        # Orientation 6 = photo prise téléphone tourné : 800×600 stockée, 600×800 affichée.
        self.assertEqual(self.save_cover(jpeg_with_exif(800, 600, orientation=6)).size, (600, 800))

    def test_png_transparency_is_kept(self):
        image = Image.new("RGBA", (300, 200), (0, 0, 255, 0))
        buffer = io.BytesIO()
        image.save(buffer, "PNG")
        stored = self.save_cover(SimpleUploadedFile("logo.png", buffer.getvalue(), content_type="image/png"))
        self.assertEqual(stored.format, "PNG")
        self.assertEqual(stored.mode, "RGBA")


@override_settings(MEDIA_ROOT=TEMP_MEDIA, IMAGE_MAX_SIDE=1920)
class ImageVariantTests(TestCase):
    """Versions WebP allégées générées à l'enregistrement, supprimées avec l'image."""

    @classmethod
    def setUpTestData(cls):
        cls.category = Category.objects.create(name="Bâtiment")

    def create(self, width, height):
        return Service.objects.create(
            category=self.category, title="S", short_description="r", description="d",
            is_published=True, cover_image=jpeg_with_exif(width, height),
        )

    def test_variants_narrower_than_the_original_are_created(self):
        service = self.create(1200, 800)
        storage, name = service.cover_image.storage, service.cover_image.name
        self.assertTrue(storage.exists(variant_name(name, 480)))
        self.assertTrue(storage.exists(variant_name(name, 960)))
        self.assertFalse(storage.exists(variant_name(name, 1600)))  # plus large que l'original
        with Image.open(storage.path(variant_name(name, 480))) as variant:
            self.assertEqual((variant.format, variant.width), ("WEBP", 480))

    def test_api_lists_the_variants(self):
        self.create(1200, 800)
        cover = self.client.get("/api/services/").json()["results"][0]["cover_image_variants"]
        self.assertEqual(sorted(cover), ["480", "960"])
        self.assertTrue(cover["480"].startswith("/media/") and cover["480"].endswith(".w480.webp"))

    def test_small_image_has_no_variant(self):
        service = self.create(300, 200)
        self.assertEqual(existing_variants(service.cover_image), {})

    def test_variants_are_deleted_with_the_image(self):
        service = self.create(1200, 800)
        storage, name = service.cover_image.storage, service.cover_image.name
        with self.captureOnCommitCallbacks(execute=True):
            service.delete()
        self.assertFalse(storage.exists(name))
        self.assertFalse(storage.exists(variant_name(name, 480)))
