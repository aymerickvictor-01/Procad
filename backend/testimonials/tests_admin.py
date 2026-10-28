from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from services.models import Category, Service

from .models import Testimonial


class AdminTestimonialApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.staff = get_user_model().objects.create_user("staff", password="x", is_staff=True)
        category = Category.objects.create(name="Informatique")
        cls.service = Service.objects.create(category=category, title="Maintenance", short_description="r",
                                             description="d")

    def setUp(self):
        self.client.force_login(self.staff)

    def test_create_hidden_by_default_then_publish(self):
        response = self.client.post(
            "/api/admin/testimonials/",
            {"author_name": "Alice", "content": "Excellent travail", "rating": 5, "service": self.service.pk},
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertFalse(response.data["is_published"])
        self.assertEqual(response.data["service_title"], "Maintenance")
        self.assertEqual(self.client.get("/api/testimonials/").data["count"], 0)

        self.client.patch(f"/api/admin/testimonials/{response.data['id']}/", {"is_published": True}, format="json")
        self.assertEqual(self.client.get("/api/testimonials/").data["count"], 1)

    def test_rating_must_be_1_to_5(self):
        for rating in [0, 6]:
            with self.subTest(rating=rating):
                response = self.client.post(
                    "/api/admin/testimonials/", {"author_name": "A", "content": "c", "rating": rating}, format="json"
                )
                self.assertEqual(response.status_code, 400)
                self.assertIn("rating", response.data)

    def test_without_service(self):
        response = self.client.post("/api/admin/testimonials/", {"author_name": "A", "content": "c"}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertIsNone(response.data["service_title"])

    def test_service_deleted_keeps_testimonial(self):
        testimonial = Testimonial.objects.create(author_name="A", content="c", service=self.service)
        self.client.delete(f"/api/admin/services/{self.service.pk}/")
        testimonial.refresh_from_db()
        self.assertIsNone(testimonial.service)
