from django.db import models
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .images import existing_variants


class RelativeImageField(serializers.ImageField):
    """
    Renvoie l'URL relative de l'image (« /media/... ») plutôt qu'une URL absolue :
    le site et l'API partagent le même domaine, en développement comme en production.
    """

    def to_representation(self, value):
        return value.url if value else None


class BaseModelSerializer(serializers.ModelSerializer):
    serializer_field_mapping = {
        **serializers.ModelSerializer.serializer_field_mapping,
        models.ImageField: RelativeImageField,
    }


@extend_schema_field({"type": "object", "additionalProperties": {"type": "string"}, "nullable": True})
class ImageVariantsField(serializers.Field):
    """
    Versions WebP allégées d'une image : {"480": "/media/…w480.webp", "960": …}.
    Sert à construire l'attribut srcset côté site ; vide si l'image n'a pas de version réduite.
    """

    def __init__(self, **kwargs):
        kwargs["read_only"] = True
        super().__init__(**kwargs)

    def to_representation(self, value):
        return existing_variants(value)
