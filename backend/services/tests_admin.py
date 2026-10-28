import shutil
import tempfile
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase

from .models import Category, Service, ServiceFeature, ServiceImage
from .tests import make_service, png_file

TEMP_MEDIA = tempfile.mkdtemp()


@override_settings(MEDIA_ROOT=TEMP_MEDIA)
class AdminServiceApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.staff = get_user_model().objects.create_user("staff", password="x", is_staff=True)
        cls.it = Category.objects.create(name="Informatique")
        cls.elec = Category.objects.create(name="Électricité")

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEMP_MEDIA, ignore_errors=True)

    def setUp(self):
        self.client.force_login(self.staff)

    def create(self, **overrides):
        data = {
            "title": "Maintenance informatique",
            "category": self.it.pk,
            "short_description": "Dépannage et maintenance.",
            "description": "Texte complet.",
            "features": ["Intervention sous 24 h", "Garantie 3 mois"],
        }
        data.update(overrides)
        return self.client.post("/api/admin/services/", data, format="json")

    # --- Création / modification ----------------------------------------------

    def test_create_with_features(self):
        response = self.create()
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["slug"], "maintenance-informatique")
        self.assertEqual(response.data["features"], ["Intervention sous 24 h", "Garantie 3 mois"])
        self.assertEqual(response.data["category_name"], "Informatique")
        self.assertFalse(response.data["is_published"])  # brouillon par défaut

    def test_required_fields_reported_per_field(self):
        response = self.client.post("/api/admin/services/", {}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertTrue({"title", "category", "short_description", "description"} <= set(response.data))

    def test_short_description_limited_to_200(self):
        self.assertIn("short_description", self.create(short_description="x" * 201).data)

    def test_features_are_replaced_in_order(self):
        service_id = self.create().data["id"]
        url = f"/api/admin/services/{service_id}/"
        response = self.client.patch(url, {"features": ["C", "A", "B"]}, format="json")
        self.assertEqual(response.data["features"], ["C", "A", "B"])
        self.assertEqual(ServiceFeature.objects.filter(service_id=service_id).count(), 3)

    def test_patch_without_features_keeps_them(self):
        service_id = self.create().data["id"]
        response = self.client.patch(f"/api/admin/services/{service_id}/", {"title": "Nouveau titre"}, format="json")
        self.assertEqual(response.data["features"], ["Intervention sous 24 h", "Garantie 3 mois"])
        self.assertEqual(response.data["slug"], "maintenance-informatique")  # slug stable

    def test_empty_features_list_clears_them(self):
        service_id = self.create().data["id"]
        response = self.client.patch(f"/api/admin/services/{service_id}/", {"features": []}, format="json")
        self.assertEqual(response.data["features"], [])

    def test_publish_toggle_controls_public_visibility(self):
        service = self.create().data
        self.assertEqual(self.client.get(f"/api/services/{service['slug']}/").status_code, 404)
        self.client.patch(f"/api/admin/services/{service['id']}/", {"is_published": True}, format="json")
        self.assertEqual(self.client.get(f"/api/services/{service['slug']}/").status_code, 200)

    def test_admin_list_includes_drafts_and_filters(self):
        make_service(self.it, "Publié", is_published=True)
        make_service(self.elec, "Brouillon")
        response = self.client.get("/api/admin/services/")
        self.assertEqual(response.data["count"], 2)
        response = self.client.get("/api/admin/services/", {"is_published": "false"})
        self.assertEqual([s["title"] for s in response.data["results"]], ["Brouillon"])
        response = self.client.get("/api/admin/services/", {"category": self.elec.pk})
        self.assertEqual([s["title"] for s in response.data["results"]], ["Brouillon"])

    # --- Image de couverture ------------------------------------------------

    def test_cover_upload_then_removal_deletes_file(self):
        service_id = self.create().data["id"]
        url = f"/api/admin/services/{service_id}/"
        response = self.client.patch(url, {"cover_image": png_file()}, format="multipart")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(response.data["cover_image"].startswith("/media/services/"))
        stored = Path(TEMP_MEDIA) / Service.objects.get(pk=service_id).cover_image.name
        self.assertTrue(stored.exists())

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.patch(url, {"cover_image": None}, format="json")
        self.assertIsNone(response.data["cover_image"])
        self.assertFalse(stored.exists())

    def test_fake_image_is_rejected(self):
        service_id = self.create().data["id"]
        fake = SimpleUploadedFile("photo.jpg", b"ceci n'est pas une image", content_type="image/jpeg")
        response = self.client.patch(f"/api/admin/services/{service_id}/", {"cover_image": fake}, format="multipart")
        self.assertEqual(response.status_code, 400)
        self.assertIn("cover_image", response.data)

    @override_settings(MAX_IMAGE_UPLOAD_SIZE=50)
    def test_too_large_image_is_rejected(self):
        service_id = self.create().data["id"]
        response = self.client.patch(
            f"/api/admin/services/{service_id}/", {"cover_image": png_file()}, format="multipart"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Mo", str(response.data["cover_image"]))

    # --- Galerie --------------------------------------------------------------

    def test_gallery_add_edit_delete(self):
        service_id = self.create().data["id"]
        base = f"/api/admin/services/{service_id}/images/"
        response = self.client.post(base, {"image": png_file(), "alt_text": "Technicien"}, format="multipart")
        self.assertEqual(response.status_code, 201, response.data)
        image_id = response.data["id"]
        stored = Path(TEMP_MEDIA) / ServiceImage.objects.get(pk=image_id).image.name

        response = self.client.patch(f"{base}{image_id}/", {"alt_text": "Technicien au travail"}, format="json")
        self.assertEqual(response.data["alt_text"], "Technicien au travail")

        detail = self.client.get(f"/api/admin/services/{service_id}/").data
        self.assertEqual([i["id"] for i in detail["images"]], [image_id])

        with self.captureOnCommitCallbacks(execute=True):
            self.assertEqual(self.client.delete(f"{base}{image_id}/").status_code, 204)
        self.assertFalse(stored.exists())

    def test_gallery_image_belongs_to_its_service(self):
        first = self.create().data["id"]
        other = self.create(title="Autre").data["id"]
        image = ServiceImage.objects.create(service_id=first, image="services/gallery/x.png")
        response = self.client.delete(f"/api/admin/services/{other}/images/{image.pk}/")
        self.assertEqual(response.status_code, 404)

    def test_gallery_on_unknown_service_is_404(self):
        response = self.client.post("/api/admin/services/9999/images/", {"image": png_file()}, format="multipart")
        self.assertEqual(response.status_code, 404)

    # --- Catégories -----------------------------------------------------------

    def test_category_create_and_count(self):
        response = self.client.post("/api/admin/categories/", {"name": "Réseaux"}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual((response.data["slug"], response.data["service_count"]), ("reseaux", 0))

        make_service(self.it, "Brouillon")  # compté côté admin, même non publié
        counts = {c["name"]: c["service_count"] for c in self.client.get("/api/admin/categories/").data}
        self.assertEqual(counts["Informatique"], 1)

    def test_category_name_must_be_unique(self):
        response = self.client.post("/api/admin/categories/", {"name": "Informatique"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("name", response.data)

    def test_category_with_services_cannot_be_deleted(self):
        make_service(self.it, "Service")
        response = self.client.delete(f"/api/admin/categories/{self.it.pk}/")
        self.assertEqual(response.status_code, 400)
        self.assertIn("Déplacez d'abord", response.data["detail"])
        self.assertTrue(Category.objects.filter(pk=self.it.pk).exists())

    def test_empty_category_can_be_deleted(self):
        self.assertEqual(self.client.delete(f"/api/admin/categories/{self.elec.pk}/").status_code, 204)
