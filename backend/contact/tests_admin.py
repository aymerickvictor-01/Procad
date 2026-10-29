from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from company.models import CompanyProfile
from testimonials.models import Testimonial
from services.models import Category, Service

from .models import ContactMessage


class AdminMessagesCompanyStatsTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.staff = get_user_model().objects.create_user("staff", password="x", is_staff=True)
        category = Category.objects.create(name="Informatique")
        cls.service = Service.objects.create(
            category=category, title="Maintenance", short_description="r", description="d", is_published=True
        )
        Service.objects.create(category=category, title="Brouillon", short_description="r", description="d")
        cls.old = ContactMessage.objects.create(
            full_name="Ancien", email="a@example.com", subject="Vieux", message="m", is_read=True
        )
        cls.new = ContactMessage.objects.create(
            full_name="Récent", email="r@example.com", subject="Devis", message="m", service=cls.service
        )
        Testimonial.objects.create(author_name="A", content="c", is_published=True)
        Testimonial.objects.create(author_name="B", content="c")

    def setUp(self):
        self.client.force_login(self.staff)

    # --- Messages -------------------------------------------------------------

    def test_messages_newest_first_with_service(self):
        results = self.client.get("/api/admin/messages/").data["results"]
        self.assertEqual([m["full_name"] for m in results], ["Récent", "Ancien"])
        self.assertEqual(results[0]["service"], {"title": "Maintenance", "slug": "maintenance"})

    def test_filter_unread(self):
        results = self.client.get("/api/admin/messages/", {"is_read": "false"}).data["results"]
        self.assertEqual([m["full_name"] for m in results], ["Récent"])

    def test_mark_read_but_content_is_read_only(self):
        url = f"/api/admin/messages/{self.new.pk}/"
        response = self.client.patch(url, {"is_read": True, "message": "falsifié"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.new.refresh_from_db()
        self.assertTrue(self.new.is_read)
        self.assertEqual(self.new.message, "m")

    def test_put_and_post_not_allowed(self):
        self.assertEqual(self.client.post("/api/admin/messages/", {}, format="json").status_code, 405)
        self.assertEqual(self.client.put(f"/api/admin/messages/{self.new.pk}/", {}, format="json").status_code, 405)

    def test_delete_message(self):
        self.assertEqual(self.client.delete(f"/api/admin/messages/{self.old.pk}/").status_code, 204)
        self.assertFalse(ContactMessage.objects.filter(pk=self.old.pk).exists())

    # --- Profil de l'entreprise -----------------------------------------------

    def test_update_company_profile(self):
        response = self.client.patch(
            "/api/admin/company/", {"slogan": "Votre partenaire", "city": "Yaoundé"}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(CompanyProfile.load().city, "Yaoundé")
        self.assertEqual(CompanyProfile.objects.count(), 1)
        self.assertEqual(self.client.get("/api/company/").data["slogan"], "Votre partenaire")

    def test_company_invalid_url_rejected(self):
        response = self.client.patch("/api/admin/company/", {"facebook_url": "pas une url"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("facebook_url", response.data)

    # --- Tableau de bord ------------------------------------------------------

    def test_stats(self):
        data = self.client.get("/api/admin/stats/").data
        self.assertEqual(
            {k: v for k, v in data.items() if k != "latest_messages"},
            {
                "services_published": 1,
                "services_draft": 1,
                "categories": 1,
                "messages_unread": 1,
                "messages_total": 2,
                "quotes_unread": 0,
                "testimonials_published": 1,
                "testimonials_total": 2,
            },
        )
        self.assertEqual([m["full_name"] for m in data["latest_messages"]], ["Récent", "Ancien"])
