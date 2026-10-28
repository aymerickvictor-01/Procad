import shutil
import tempfile
from io import StringIO

from django.core.management import CommandError, call_command
from django.test import TestCase, override_settings

from contact.models import ContactMessage
from testimonials.models import Testimonial

from .models import Category, Service

TEMP_MEDIA = tempfile.mkdtemp()


@override_settings(MEDIA_ROOT=TEMP_MEDIA, DEBUG=True)
class SeedDemoCommandTests(TestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEMP_MEDIA, ignore_errors=True)

    def seed(self, *args):
        call_command("seed_demo", *args, stdout=StringIO())

    def test_creates_demo_data(self):
        self.seed()
        self.assertEqual(Category.objects.count(), 3)
        self.assertEqual(Service.objects.count(), 7)
        self.assertEqual(Service.objects.published().count(), 6)
        self.assertTrue(all(s.cover_image for s in Service.objects.all()))
        self.assertEqual(Testimonial.objects.count(), 4)
        self.assertEqual(ContactMessage.objects.count(), 3)

    def test_running_twice_does_not_duplicate(self):
        self.seed()
        self.seed()
        self.assertEqual(Service.objects.count(), 7)

    def test_reset_keeps_real_content(self):
        real_category = Category.objects.create(name="Vraie catégorie")
        real_service = Service.objects.create(
            category=real_category, title="Vrai service", short_description="r", description="d"
        )
        real_message = ContactMessage.objects.create(full_name="Client", email="client@gmail.com", subject="s",
                                                     message="m")
        self.seed()
        self.seed("--reset")
        self.assertEqual(list(Service.objects.all()), [real_service])
        self.assertEqual(list(Category.objects.all()), [real_category])
        self.assertEqual(list(ContactMessage.objects.all()), [real_message])
        self.assertEqual(Testimonial.objects.count(), 0)

    @override_settings(DEBUG=False)
    def test_refuses_to_run_in_production_without_force(self):
        with self.assertRaises(CommandError):
            self.seed()
        self.assertEqual(Service.objects.count(), 0)
