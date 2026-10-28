import io
import shutil
import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from PIL import Image

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
