from django.core.cache import cache
from rest_framework.test import APITestCase

from services.models import Category, Service

from .models import ContactMessage


class ContactApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        category = Category.objects.create(name="Informatique")
        cls.service = Service.objects.create(
            category=category, title="Maintenance informatique", short_description="r", description="d",
            is_published=True,
        )
        cls.draft = Service.objects.create(
            category=category, title="Brouillon", short_description="r", description="d"
        )

    def setUp(self):
        cache.clear()  # remet à zéro les compteurs de limitation de débit

    def payload(self, **overrides):
        data = {
            "full_name": "Marie Dupont",
            "email": "marie@example.com",
            "phone": "+237 6 00 00 00 00",
            "subject": "Demande de devis",
            "message": "Bonjour, je souhaite un devis.",
            "service": "maintenance-informatique",
        }
        data.update(overrides)
        return data

    def post(self, **overrides):
        return self.client.post("/api/contact/", self.payload(**overrides), format="json")

    def test_valid_message_is_saved(self):
        response = self.post()
        self.assertEqual(response.status_code, 201)
        self.assertIn("detail", response.data)
        message = ContactMessage.objects.get()
        self.assertEqual(message.service, self.service)
        self.assertFalse(message.is_read)

    def test_service_is_optional(self):
        data = self.payload()
        del data["service"]
        response = self.client.post("/api/contact/", data, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertIsNone(ContactMessage.objects.get().service)

    def test_errors_are_reported_per_field(self):
        response = self.client.post("/api/contact/", {"email": "pas-un-email"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertTrue({"full_name", "email", "subject", "message"} <= set(response.data))

    def test_message_longer_than_3000_chars_is_rejected(self):
        response = self.post(message="x" * 3001)
        self.assertEqual(response.status_code, 400)
        self.assertIn("message", response.data)

    def test_unknown_or_draft_service_is_rejected(self):
        self.assertEqual(self.post(service="inconnu").status_code, 400)
        self.assertEqual(self.post(service=self.draft.slug).status_code, 400)
        self.assertEqual(ContactMessage.objects.count(), 0)

    def test_honeypot_filled_is_silently_ignored(self):
        response = self.post(website="http://spam.example")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ContactMessage.objects.count(), 0)

    def test_rate_limited_to_5_per_hour(self):
        for _ in range(5):
            self.assertEqual(self.post().status_code, 201)
        self.assertEqual(self.post().status_code, 429)
        self.assertEqual(ContactMessage.objects.count(), 5)
