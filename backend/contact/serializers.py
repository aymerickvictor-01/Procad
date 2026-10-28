from rest_framework import serializers

from services.models import Service
from services.serializers import ServiceRefSerializer

from .models import ContactMessage


class ContactMessageSerializer(serializers.ModelSerializer):
    service = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=Service.objects.published(),
        required=False,
        allow_null=True,
        help_text="Slug du service concerné (optionnel).",
    )
    website = serializers.CharField(
        required=False,
        allow_blank=True,
        write_only=True,
        help_text="Champ piège anti-spam, invisible dans le formulaire : doit rester vide.",
    )

    class Meta:
        model = ContactMessage
        fields = ["full_name", "email", "phone", "subject", "message", "service", "website"]


class AdminContactMessageSerializer(serializers.ModelSerializer):
    """Seul `is_read` est modifiable : le contenu d'un message vient du visiteur."""

    service = ServiceRefSerializer(read_only=True)

    class Meta:
        model = ContactMessage
        fields = ["id", "full_name", "email", "phone", "subject", "message", "service", "is_read", "created_at"]
        read_only_fields = [f for f in fields if f != "is_read"]
