from django.db import connection
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response


@extend_schema(
    tags=["Système"],
    summary="État de l'API et de la base de données",
    responses=inline_serializer("Health", {"status": serializers.CharField(), "database": serializers.CharField()}),
)
@api_view(["GET"])
def health(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
    return Response({"status": "ok", "database": "ok"})
