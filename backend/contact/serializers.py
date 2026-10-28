from rest_framework import serializers

from services.models import Service

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
