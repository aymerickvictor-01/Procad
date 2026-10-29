from django.db import connection
from django.db.models import Count, Q
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from contact.models import ContactMessage
from services.models import Category, Service
from testimonials.models import Testimonial


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


class LatestMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["id", "kind", "reference", "full_name", "subject", "is_read", "created_at"]


@extend_schema(
    tags=["Admin - Tableau de bord"],
    summary="Compteurs du tableau de bord et 5 derniers messages",
    responses=inline_serializer(
        "AdminStats",
        {
            "services_published": serializers.IntegerField(),
            "services_draft": serializers.IntegerField(),
            "categories": serializers.IntegerField(),
            "messages_unread": serializers.IntegerField(),
            "messages_total": serializers.IntegerField(),
            "quotes_unread": serializers.IntegerField(),
            "testimonials_published": serializers.IntegerField(),
            "testimonials_total": serializers.IntegerField(),
            "latest_messages": LatestMessageSerializer(many=True),
        },
    ),
)
@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_stats(request):
    services = Service.objects.aggregate(
        published=Count("id", filter=Q(is_published=True)), draft=Count("id", filter=Q(is_published=False))
    )
    messages = ContactMessage.objects.aggregate(
        unread=Count("id", filter=Q(is_read=False)),
        total=Count("id"),
        quotes_unread=Count("id", filter=Q(is_read=False, kind=ContactMessage.Kind.QUOTE)),
    )
    testimonials = Testimonial.objects.aggregate(
        published=Count("id", filter=Q(is_published=True)), total=Count("id")
    )
    return Response(
        {
            "services_published": services["published"],
            "services_draft": services["draft"],
            "categories": Category.objects.count(),
            "messages_unread": messages["unread"],
            "messages_total": messages["total"],
            "quotes_unread": messages["quotes_unread"],
            "testimonials_published": testimonials["published"],
            "testimonials_total": testimonials["total"],
            "latest_messages": LatestMessageSerializer(ContactMessage.objects.all()[:5], many=True).data,
        }
    )
