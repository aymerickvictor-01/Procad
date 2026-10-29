import io
import os
import shutil
import tempfile

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image
from rest_framework.test import APITestCase

from company.models import CompanyProfile
from services.models import Category, Service

from .models import ContactAttachment, ContactMessage
from .notifications import whatsapp_link

TEMP_PRIVATE = tempfile.mkdtemp()


def photo(name="chantier.jpg", size=(1200, 800)):
    """JPEG avec une position GPS dans ses métadonnées (comme une photo de téléphone)."""
    exif = Image.Exif()
    exif[0x8825] = {2: (3.0, 52.0, 0.0)}
    buffer = io.BytesIO()
    Image.new("RGB", size, "orange").save(buffer, "JPEG", exif=exif.tobytes())
    return SimpleUploadedFile(name, buffer.getvalue(), content_type="image/jpeg")


def pdf(name="plan.pdf"):
    return SimpleUploadedFile(name, b"%PDF-1.4\n%%EOF\n", content_type="application/pdf")


@override_settings(PRIVATE_MEDIA_ROOT=TEMP_PRIVATE, EMAIL_ASYNC=False, NOTIFY_EMAILS=["equipe@procad.test"])
class QuoteRequestTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        category = Category.objects.create(name="Construction")
        cls.service = Service.objects.create(
            category=category, title="Étanchéité", short_description="r", description="d", is_published=True
        )
        cls.staff = get_user_model().objects.create_user("staff", password="x", is_staff=True)
        profile = CompanyProfile.load()
        profile.whatsapp = "+237 695 61 54 04"
        profile.save()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEMP_PRIVATE, ignore_errors=True)

    def setUp(self):
        cache.clear()

    def quote(self, files=(), **overrides):
        data = {
            "kind": "quote",
            "full_name": "Paul Mbarga",
            "phone": "695 00 00 00",
            "service": "etancheite",
            "project_type": "renovation",
            "city": "Yaoundé, Bastos",
            "timeline": "1-3",
            "budget": "2 000 000 FCFA",
            "message": "Infiltrations sur une toiture-terrasse de 120 m², reprise complète à prévoir.",
        }
        data.update(overrides)
        if files:
            data["attachments"] = list(files)
            return self.client.post("/api/contact/", data, format="multipart")
        return self.client.post("/api/contact/", data, format="json")

    def send(self, **kwargs):
        with self.captureOnCommitCallbacks(execute=True):
            return self.quote(**kwargs)

    # --- Validation ---------------------------------------------------------------

    def test_quote_is_saved_with_reference_and_generated_subject(self):
        response = self.send()
        self.assertEqual(response.status_code, 201)
        message = ContactMessage.objects.get()
        self.assertEqual(response.data["reference"], message.reference)
        self.assertRegex(message.reference, r"^DV-[2-9A-Z]{6}$")
        self.assertEqual(message.kind, "quote")
        self.assertEqual(message.subject, "Demande de devis — Étanchéité")
        self.assertEqual(message.city, "Yaoundé, Bastos")
        self.assertEqual(message.email, "")  # facultatif pour un devis

    def test_quote_requires_phone_city_project_type_and_description(self):
        response = self.quote(phone="", city="", project_type="", message="Trop court")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(set(response.data), {"phone", "city", "project_type", "message"})
        self.assertFalse(ContactMessage.objects.exists())

    def test_invalid_phone_is_rejected(self):
        self.assertEqual(self.quote(phone="abc").status_code, 400)
        self.assertEqual(self.quote(phone="12 34").status_code, 400)

    def test_simple_message_still_requires_email_and_subject(self):
        response = self.client.post(
            "/api/contact/", {"full_name": "A", "message": "Bonjour", "email": "", "subject": ""}, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(set(response.data), {"email", "subject"})

    def test_honeypot_returns_a_reference_without_saving(self):
        response = self.send(website="http://spam.example")
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["reference"].startswith("DV-"))
        self.assertFalse(ContactMessage.objects.exists())
        self.assertEqual(len(mail.outbox), 0)

    # --- Pièces jointes -------------------------------------------------------------

    def test_photo_and_pdf_are_stored_privately_and_photo_is_cleaned(self):
        response = self.send(files=[photo(), pdf()])
        self.assertEqual(response.status_code, 201)
        image, document = ContactAttachment.objects.order_by("id")
        self.assertEqual((image.original_name, image.content_type), ("chantier.jpg", "image/jpeg"))
        self.assertEqual(document.content_type, "application/pdf")
        self.assertTrue(image.file.path.startswith(TEMP_PRIVATE))
        with Image.open(image.file.path) as stored:
            self.assertNotIn(0x8825, stored.getexif())  # position GPS retirée

    def test_fake_image_is_rejected(self):
        fake = SimpleUploadedFile("photo.jpg", b"pas une image", content_type="image/jpeg")
        response = self.quote(files=[fake])
        self.assertEqual(response.status_code, 400)
        self.assertIn("attachments", response.data)

    def test_too_many_files_are_rejected(self):
        response = self.quote(files=[pdf(f"p{i}.pdf") for i in range(6)])
        self.assertEqual(response.status_code, 400)

    @override_settings(CONTACT_ATTACHMENT_MAX_SIZE=10)
    def test_file_too_large_is_rejected(self):
        self.assertEqual(self.quote(files=[photo()]).status_code, 400)

    def test_attachments_are_refused_on_simple_messages(self):
        response = self.client.post(
            "/api/contact/",
            {"full_name": "A", "email": "a@example.com", "subject": "S", "message": "M", "attachments": [pdf()]},
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("attachments", response.data)

    def test_files_are_deleted_with_the_message(self):
        self.send(files=[pdf()])
        path = ContactAttachment.objects.get().file.path
        with self.captureOnCommitCallbacks(execute=True):
            ContactMessage.objects.get().delete()
        self.assertFalse(ContactAttachment.objects.exists())
        self.assertFalse(os.path.exists(path))

    # --- Téléchargement (administration) --------------------------------------------

    def test_only_admins_can_download_attachments(self):
        self.send(files=[photo(), pdf()])
        message = ContactMessage.objects.get()
        image, document = message.attachments.order_by("id")
        url = f"/api/admin/messages/{message.id}/attachments/{document.id}/"

        self.assertEqual(self.client.get(url).status_code, 401)
        self.client.force_login(self.staff)
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn('attachment; filename="plan.pdf"', response["Content-Disposition"])

        detail = self.client.get(f"/api/admin/messages/{message.id}/").data
        self.assertEqual([a["original_name"] for a in detail["attachments"]], ["chantier.jpg", "plan.pdf"])
        inline = self.client.get(f"/api/admin/messages/{message.id}/attachments/{image.id}/?inline=1")
        self.assertTrue(inline["Content-Disposition"].startswith("inline"))
        # Un PDF n'est jamais affiché dans la page, même avec ?inline=1.
        self.assertTrue(self.client.get(f"{url}?inline=1")["Content-Disposition"].startswith("attachment"))

    # --- E-mails ------------------------------------------------------------------------

    def test_team_alert_and_client_acknowledgement_are_sent(self):
        self.send(files=[pdf()], email="paul@example.com")
        message = ContactMessage.objects.get()
        team, client = mail.outbox
        self.assertEqual(team.to, ["equipe@procad.test"])
        self.assertEqual(team.reply_to, ["paul@example.com"])
        self.assertIn(message.reference, team.subject)
        self.assertIn("Yaoundé, Bastos", team.body)
        self.assertIn("https://wa.me/237695000000", team.body)
        self.assertEqual([a[0] for a in team.attachments], ["plan.pdf"])
        self.assertEqual(client.to, ["paul@example.com"])
        self.assertEqual(client.reply_to, ["equipe@procad.test"])
        self.assertIn(message.reference, client.subject)
        self.assertIn("wa.me/237695615404", client.alternatives[0][0])

    def test_no_acknowledgement_without_client_email(self):
        self.send()
        self.assertEqual(len(mail.outbox), 1)

    @override_settings(NOTIFY_EMAILS=[])
    def test_no_team_alert_when_no_address_is_configured(self):
        self.send(email="paul@example.com")
        self.assertEqual([m.to for m in mail.outbox], [["paul@example.com"]])

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend", EMAIL_HOST="127.0.0.1", EMAIL_PORT=1)
    def test_mail_server_failure_does_not_lose_the_request(self):
        with self.assertLogs("contact.notifications", "ERROR"):
            response = self.send(email="paul@example.com")
        self.assertEqual(response.status_code, 201)
        self.assertTrue(ContactMessage.objects.exists())

    def test_whatsapp_link_adds_cameroon_prefix(self):
        self.assertEqual(whatsapp_link("695 00 00 00"), "https://wa.me/237695000000")
        self.assertEqual(whatsapp_link("+237 695 00 00 00"), "https://wa.me/237695000000")
        self.assertEqual(whatsapp_link(""), "")
