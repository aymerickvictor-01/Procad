from rest_framework.test import APITestCase

from services.models import Category, Service

from .models import Testimonial


class PublicTestimonialApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        category = Category.objects.create(name="Informatique")
        cls.published = Service.objects.create(
            category=category, title="Maintenance", short_description="r", description="d", is_published=True
        )
        cls.draft = Service.objects.create(
            category=category, title="Projet secret", short_description="r", description="d"
        )
        Testimonial.objects.create(author_name="Alice", content="Très bien", rating=5, is_published=True,
                                   service=cls.published)
        Testimonial.objects.create(author_name="Bruno", content="Parfait", is_published=True, service=cls.draft)
        Testimonial.objects.create(author_name="Chloé", content="Masqué", is_published=False)

    def authors(self, response):
        return sorted(t["author_name"] for t in response.data["results"])

    def test_only_published_testimonials(self):
        response = self.client.get("/api/testimonials/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.authors(response), ["Alice", "Bruno"])

    def test_filter_by_service_slug(self):
        response = self.client.get("/api/testimonials/", {"service": "maintenance"})
        self.assertEqual(self.authors(response), ["Alice"])

    def test_draft_service_is_not_revealed(self):
        response = self.client.get("/api/testimonials/")
        by_author = {t["author_name"]: t for t in response.data["results"]}
        self.assertEqual(by_author["Alice"]["service"], {"title": "Maintenance", "slug": "maintenance"})
        self.assertIsNone(by_author["Bruno"]["service"])
