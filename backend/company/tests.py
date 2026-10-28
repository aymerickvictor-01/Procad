from rest_framework.test import APITestCase

from .models import CompanyProfile


class PublicCompanyApiTests(APITestCase):
    def test_profile_created_with_default_name(self):
        response = self.client.get("/api/company/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["name"], "PROCAD")
        self.assertIsNone(response.data["logo"])
        self.assertNotIn("id", response.data)

    def test_returns_saved_profile(self):
        CompanyProfile(name="PROCAD", slogan="Votre partenaire", city="Yaoundé").save()
        response = self.client.get("/api/company/")
        self.assertEqual(response.data["slogan"], "Votre partenaire")
        self.assertEqual(response.data["city"], "Yaoundé")

    def test_public_api_is_read_only(self):
        self.assertEqual(self.client.put("/api/company/", {"name": "Pirate"}).status_code, 405)
