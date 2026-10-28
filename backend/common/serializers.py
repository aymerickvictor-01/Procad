from django.db import models
from rest_framework import serializers


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
