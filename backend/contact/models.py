import secrets

from django.core.validators import MaxLengthValidator
from django.db import models

from common.images import UploadTo
from common.storage import private_storage

MESSAGE_MAX_LENGTH = 3000
# Sans caractères ambigus (0/O, 1/I/L) : la référence se dicte au téléphone.
REFERENCE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"


class ContactMessage(models.Model):
    class Kind(models.TextChoices):
        MESSAGE = "message", "Message"
        QUOTE = "quote", "Demande de devis"

    class ProjectType(models.TextChoices):
        NEW = "new", "Nouveau projet"
        RENOVATION = "renovation", "Rénovation ou modification"
        MAINTENANCE = "maintenance", "Entretien ou dépannage"
        STUDY = "study", "Étude ou conseil"
        OTHER = "other", "Autre"

    class Timeline(models.TextChoices):
        URGENT = "urgent", "Urgent (moins d'un mois)"
        SOON = "1-3", "Dans 1 à 3 mois"
        LATER = "3+", "Dans plus de 3 mois"
        UNDEFINED = "undefined", "Pas encore défini"

    kind = models.CharField("type", max_length=10, choices=Kind.choices, default=Kind.MESSAGE)
    reference = models.CharField("référence", max_length=12, unique=True, editable=False)
    full_name = models.CharField("nom complet", max_length=120)
    email = models.EmailField("e-mail", blank=True)
    phone = models.CharField("téléphone", max_length=30, blank=True)
    subject = models.CharField("objet", max_length=150)
    message = models.TextField(max_length=MESSAGE_MAX_LENGTH, validators=[MaxLengthValidator(MESSAGE_MAX_LENGTH)])
    service = models.ForeignKey(
        "services.Service",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="contact_messages",
        verbose_name="service concerné",
    )
    # Demande de devis
    project_type = models.CharField("type de projet", max_length=20, choices=ProjectType.choices, blank=True)
    city = models.CharField("ville ou quartier", max_length=120, blank=True)
    timeline = models.CharField("délai souhaité", max_length=20, choices=Timeline.choices, blank=True)
    budget = models.CharField("budget indicatif", max_length=100, blank=True)

    is_read = models.BooleanField("lu", default=False)
    created_at = models.DateTimeField("reçu le", auto_now_add=True)

    class Meta:
        verbose_name = "message de contact"
        verbose_name_plural = "messages de contact"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["is_read", "-created_at"], name="contact_unread_recent_idx")]

    def __str__(self):
        return f"{self.reference} — {self.full_name} — {self.subject}"

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = self.new_reference(self.kind)
        super().save(*args, **kwargs)

    @classmethod
    def new_reference(cls, kind):
        """« DV-7KQ2M9 » pour un devis, « MS-… » pour un message ; unique."""
        prefix = "DV" if kind == cls.Kind.QUOTE else "MS"
        while True:
            reference = f"{prefix}-{''.join(secrets.choice(REFERENCE_ALPHABET) for _ in range(6))}"
            if not cls.objects.filter(reference=reference).exists():
                return reference


class ContactAttachment(models.Model):
    """Photo ou plan joint à une demande. Stocké hors du dossier public (common.storage)."""

    message = models.ForeignKey(ContactMessage, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField("fichier", upload_to=UploadTo("contact/%Y/%m"), storage=private_storage)
    original_name = models.CharField("nom d'origine", max_length=200)
    content_type = models.CharField("type", max_length=60)
    size = models.PositiveIntegerField("taille (octets)")

    class Meta:
        verbose_name = "pièce jointe"
        verbose_name_plural = "pièces jointes"
        ordering = ["id"]

    def __str__(self):
        return self.original_name

    @property
    def is_image(self):
        return self.content_type.startswith("image/")
