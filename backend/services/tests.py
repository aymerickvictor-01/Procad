import io
import shutil
import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image
from rest_framework.test import APITestCase

from .models import Category, Service, ServiceFeature, ServiceImage

TEMP_MEDIA = tempfile.mkdtemp()


def png_file(name="image.png"):
    buf = io.BytesIO()
    Image.new("RGB", (10, 10), "blue").save(buf, "PNG")
    return SimpleUploadedFile(name, buf.getvalue(), content_type="image/png")


def make_service(category, title, **kwargs):
    return Service.objects.create(
        category=category, title=title, short_description="Résumé", description="Description", **kwargs
    )


@override_settings(MEDIA_ROOT=TEMP_MEDIA)
class PublicServiceApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.it = Category.objects.create(name="Informatique", display_order=1)
        cls.elec = Category.objects.create(name="Électricité", display_order=2)
        cls.maintenance = make_service(
            cls.it, "Maintenance informatique", is_published=True, is_featured=True, cover_image=png_file()
        )
        cls.reseau = make_service(cls.it, "Installation réseau", is_published=True)
        cls.cablage = make_service(cls.elec, "Câblage électrique", is_published=True)
        cls.draft = make_service(cls.it, "Service en préparation", is_published=False)
        ServiceFeature.objects.create(service=cls.maintenance, label="Garantie 3 mois", display_order=2)
        ServiceFeature.objects.create(service=cls.maintenance, label="Intervention sous 24 h", display_order=1)
        ServiceImage.objects.create(service=cls.maintenance, image=png_file(), alt_text="Technicien")

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEMP_MEDIA, ignore_errors=True)

    def slugs(self, response):
        return [item["slug"] for item in response.data["results"]]

    def test_list_is_paginated_and_hides_drafts(self):
        response = self.client.get("/api/services/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(set(response.data), {"count", "next", "previous", "results"})
        self.assertEqual(response.data["count"], 3)
        self.assertNotIn(self.draft.slug, self.slugs(response))

    def test_filter_by_category_slug(self):
        response = self.client.get("/api/services/", {"category": "electricite"})
        self.assertEqual(self.slugs(response), ["cablage-electrique"])

    def test_filter_featured(self):
        response = self.client.get("/api/services/", {"featured": "true"})
        self.assertEqual(self.slugs(response), ["maintenance-informatique"])

    def test_search(self):
        response = self.client.get("/api/services/", {"search": "réseau"})
        self.assertEqual(self.slugs(response), ["installation-reseau"])

    def test_search_never_returns_drafts(self):
        response = self.client.get("/api/services/", {"search": "préparation"})
        self.assertEqual(response.data["count"], 0)

    def test_page_size_param(self):
        response = self.client.get("/api/services/", {"page_size": 2})
        self.assertEqual(len(response.data["results"]), 2)
        self.assertIsNotNone(response.data["next"])

    def test_detail_returns_images_and_ordered_features(self):
        response = self.client.get("/api/services/maintenance-informatique/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["category"]["slug"], "informatique")
        self.assertEqual(response.data["features"], ["Intervention sous 24 h", "Garantie 3 mois"])
        self.assertEqual(response.data["images"][0]["alt_text"], "Technicien")

    def test_image_urls_are_relative(self):
        response = self.client.get("/api/services/maintenance-informatique/")
        self.assertTrue(response.data["cover_image"].startswith("/media/services/"))
        self.assertTrue(response.data["images"][0]["image"].startswith("/media/services/gallery/"))

    def test_draft_detail_is_404(self):
        response = self.client.get(f"/api/services/{self.draft.slug}/")
        self.assertEqual(response.status_code, 404)

    def test_unknown_slug_is_404(self):
        self.assertEqual(self.client.get("/api/services/inconnu/").status_code, 404)

    def test_categories_count_only_published_and_are_not_paginated(self):
        response = self.client.get("/api/categories/")
        self.assertEqual(response.status_code, 200)
        counts = {c["slug"]: c["service_count"] for c in response.data}
        self.assertEqual(counts, {"informatique": 2, "electricite": 1})
        self.assertEqual([c["slug"] for c in response.data], ["informatique", "electricite"])

    def test_public_api_is_read_only(self):
        response = self.client.post("/api/services/", {"title": "Pirate"})
        self.assertEqual(response.status_code, 405)
