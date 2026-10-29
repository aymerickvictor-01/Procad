import re

from django.db import transaction
from django.urls import reverse
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from services.models import Service
from services.serializers import ServiceRefSerializer

from .attachments import prepare_attachments
from .models import ContactAttachment, ContactMessage

PHONE_PATTERN = re.compile(r"^\+?[\d\s().-]+$")
QUOTE_DESCRIPTION_MIN = 20


class ContactMessageSerializer(serializers.ModelSerializer):
    """
    Message simple (kind = « message ») ou demande de devis (kind = « quote »).
    - message : e-mail et objet obligatoires ;
    - devis : téléphone, ville et type de projet obligatoires, e-mail facultatif, objet
      généré automatiquement ; jusqu'à 5 pièces jointes (multipart, champ « attachments »).
    """

    service = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=Service.objects.published(),
        required=False,
        allow_null=True,
        help_text="Slug du service concerné (optionnel).",
    )
    subject = serializers.CharField(max_length=150, required=False, allow_blank=True)
    attachments = serializers.ListField(
        child=serializers.FileField(allow_empty_file=False),
        required=False,
        write_only=True,
        help_text="Devis uniquement : photos (JPEG, PNG, WebP) ou PDF, 5 fichiers et 20 Mo au total.",
    )
    website = serializers.CharField(
        required=False,
        allow_blank=True,
        write_only=True,
        help_text="Champ piège anti-spam, invisible dans le formulaire : doit rester vide.",
    )

    class Meta:
        model = ContactMessage
        fields = [
            "kind", "full_name", "email", "phone", "subject", "message", "service",
            "project_type", "city", "timeline", "budget", "attachments", "website",
        ]

    def validate_phone(self, value):
        value = value.strip()
        if value and (not PHONE_PATTERN.match(value) or len(re.sub(r"\D", "", value)) < 8):
            raise serializers.ValidationError("Ce numéro de téléphone n'est pas valide.")
        return value

    def validate_attachments(self, files):
        return prepare_attachments(files)

    @staticmethod
    def _missing(values):
        """Champs obligatoires selon le type de demande (sur les données brutes ou validées)."""
        errors = {}
        text = lambda name: str(values.get(name) or "").strip()  # noqa: E731
        if values.get("kind") == ContactMessage.Kind.QUOTE:
            if not text("phone"):
                errors["phone"] = "Indiquez un numéro pour que nous puissions vous rappeler."
            if not text("city"):
                errors["city"] = "Indiquez la ville ou le quartier du projet."
            if not text("project_type"):
                errors["project_type"] = "Choisissez le type de projet."
            if len(text("message")) < QUOTE_DESCRIPTION_MIN:
                errors["message"] = f"Décrivez votre projet en quelques phrases ({QUOTE_DESCRIPTION_MIN} caractères minimum)."
        else:
            if not text("email"):
                errors["email"] = "Indiquez votre adresse e-mail pour recevoir notre réponse."
            if not text("subject"):
                errors["subject"] = "Indiquez l'objet de votre message."
            if values.get("attachments"):
                errors["attachments"] = "Les pièces jointes sont réservées aux demandes de devis."
        return errors

    def to_internal_value(self, data):
        # Toutes les erreurs en une seule réponse : celles des champs et celles liées au type de demande.
        try:
            return super().to_internal_value(data)
        except serializers.ValidationError as exc:
            raise serializers.ValidationError({**self._missing(data), **exc.detail})

    def validate(self, attrs):
        errors = self._missing(attrs)
        if errors:
            raise serializers.ValidationError(errors)
        if attrs.get("kind") == ContactMessage.Kind.QUOTE:
            service = attrs.get("service")
            label = service.title if service else ContactMessage.ProjectType(attrs["project_type"]).label
            attrs["subject"] = f"Demande de devis — {label}"[:150]
        else:
            for field in ("project_type", "city", "timeline", "budget"):
                attrs.pop(field, None)
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        attachments = validated_data.pop("attachments", [])
        message = super().create(validated_data)
        for attachment in attachments:
            ContactAttachment.objects.create(message=message, **attachment)
        return message


class AttachmentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField(help_text="Téléchargement (administrateurs). Ajouter ?inline=1 pour afficher une image.")
    is_image = serializers.BooleanField(read_only=True)

    class Meta:
        model = ContactAttachment
        fields = ["id", "original_name", "content_type", "size", "is_image", "url"]

    @extend_schema_field(serializers.CharField())
    def get_url(self, attachment):
        return reverse("admin-message-attachment", args=[attachment.message_id, attachment.id])


class AdminContactMessageSerializer(serializers.ModelSerializer):
    """Seul `is_read` est modifiable : le contenu d'un message vient du visiteur."""

    service = ServiceRefSerializer(read_only=True)
    project_type_label = serializers.CharField(source="get_project_type_display", read_only=True)
    timeline_label = serializers.CharField(source="get_timeline_display", read_only=True)
    attachments = AttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = ContactMessage
        fields = [
            "id", "kind", "reference", "full_name", "email", "phone", "subject", "message", "service",
            "project_type", "project_type_label", "city", "timeline", "timeline_label", "budget",
            "attachments", "is_read", "created_at",
        ]
        read_only_fields = [f for f in fields if f != "is_read"]
