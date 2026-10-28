from django.core.validators import MaxLengthValidator
from django.db import models

MESSAGE_MAX_LENGTH = 3000


class ContactMessage(models.Model):
    full_name = models.CharField("nom complet", max_length=120)
    email = models.EmailField("e-mail")
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
    is_read = models.BooleanField("lu", default=False)
    created_at = models.DateTimeField("reçu le", auto_now_add=True)

    class Meta:
        verbose_name = "message de contact"
        verbose_name_plural = "messages de contact"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["is_read", "-created_at"], name="contact_unread_recent_idx")]

    def __str__(self):
        return f"{self.full_name} — {self.subject}"
