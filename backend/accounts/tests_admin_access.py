from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from contact.models import ContactMessage
from services.models import Category, Service, ServiceImage
from testimonials.models import Testimonial

User = get_user_model()


class AdminAccessMatrixTests(APITestCase):
    """Chaque route /api/admin/ : 401 pour un visiteur, 403 pour un compte non staff, accès pour le staff."""

    @classmethod
    def setUpTestData(cls):
        cls.staff = User.objects.create_user("staff", password="x", is_staff=True)
        cls.visitor = User.objects.create_user("visiteur", password="x")
        category = Category.objects.create(name="Cat")
        service = Service.objects.create(category=category, title="S", short_description="r", description="d")
        image = ServiceImage.objects.create(service=service, image="services/gallery/x.png")
        testimonial = Testimonial.objects.create(author_name="A", content="c")
        message = ContactMessage.objects.create(full_name="M", email="m@example.com", subject="s", message="m")
        cls.requests = [
            ("get", "/api/admin/stats/"),
            ("get", "/api/admin/company/"),
            ("patch", "/api/admin/company/"),
            ("get", "/api/admin/services/"),
            ("post", "/api/admin/services/"),
            ("get", f"/api/admin/services/{service.pk}/"),
            ("patch", f"/api/admin/services/{service.pk}/"),
            ("delete", f"/api/admin/services/{service.pk}/"),
            ("post", f"/api/admin/services/{service.pk}/images/"),
            ("patch", f"/api/admin/services/{service.pk}/images/{image.pk}/"),
            ("delete", f"/api/admin/services/{service.pk}/images/{image.pk}/"),
            ("get", "/api/admin/categories/"),
            ("post", "/api/admin/categories/"),
            ("delete", f"/api/admin/categories/{category.pk}/"),
            ("get", "/api/admin/testimonials/"),
            ("post", "/api/admin/testimonials/"),
            ("delete", f"/api/admin/testimonials/{testimonial.pk}/"),
            ("get", "/api/admin/messages/"),
            ("get", f"/api/admin/messages/{message.pk}/"),
            ("patch", f"/api/admin/messages/{message.pk}/"),
            ("delete", f"/api/admin/messages/{message.pk}/"),
        ]

    def call(self, method, url):
        return getattr(self.client, method)(url, {}, format="json")

    def test_anonymous_gets_401(self):
        for method, url in self.requests:
            with self.subTest(method=method, url=url):
                self.assertEqual(self.call(method, url).status_code, 401)

    def test_non_staff_gets_403(self):
        self.client.force_login(self.visitor)
        for method, url in self.requests:
            with self.subTest(method=method, url=url):
                self.assertEqual(self.call(method, url).status_code, 403)

    def test_staff_can_read(self):
        self.client.force_login(self.staff)
        for method, url in self.requests:
            if method == "get":
                with self.subTest(url=url):
                    self.assertEqual(self.client.get(url).status_code, 200)
