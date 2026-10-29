import logging

from django.db import transaction
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, inline_serializer
from rest_framework import generics, mixins, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from .models import ContactMessage
from .notifications import notify_new_message
from .serializers import AdminContactMessageSerializer, ContactMessageSerializer

logger = logging.getLogger(__name__)

SUCCESS_MESSAGES = {
    ContactMessage.Kind.MESSAGE: "Merci, votre message a bien été envoyé. Nous vous répondrons rapidement.",
    ContactMessage.Kind.QUOTE: "Merci, votre demande de devis a bien été envoyée. Nous vous recontactons rapidement.",
}


@extend_schema(
    tags=["Public"],
    summary="Envoyer un message ou une demande de devis (5 par heure et par adresse IP)",
    description="JSON, ou multipart/form-data pour joindre des fichiers (champ « attachments », répété).",
    responses={
        201: inline_serializer(
            "ContactAccepted", {"detail": serializers.CharField(), "reference": serializers.CharField()}
        )
    },
)
class ContactCreateView(generics.CreateAPIView):
    serializer_class = ContactMessageSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "contact"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        kind = serializer.validated_data.get("kind", ContactMessage.Kind.MESSAGE)
        if serializer.validated_data.pop("website", ""):
            # Robot probable : même réponse qu'en cas de succès, pour ne pas l'aider à s'adapter.
            logger.info("Message de contact ignoré : champ piège rempli.")
            reference = ContactMessage.new_reference(kind)
        else:
            message = serializer.save()
            reference = message.reference
            # E-mails envoyés une fois la demande enregistrée (jamais pour une demande annulée).
            transaction.on_commit(lambda: notify_new_message(message))
        return Response({"detail": SUCCESS_MESSAGES[kind], "reference": reference}, status=status.HTTP_201_CREATED)


@extend_schema(tags=["Admin - Messages"])
class AdminContactMessageViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """Boîte de réception, du plus récent au plus ancien. PATCH {"is_read": true|false}."""

    permission_classes = [IsAdminUser]
    serializer_class = AdminContactMessageSerializer
    http_method_names = ["get", "patch", "delete", "head", "options"]
    filterset_fields = ["is_read", "kind"]
    search_fields = ["reference", "full_name", "email", "phone", "subject", "message", "city"]
    queryset = ContactMessage.objects.select_related("service").prefetch_related("attachments")

    @extend_schema(
        summary="Télécharger une pièce jointe",
        parameters=[
            OpenApiParameter("attachment_id", int, OpenApiParameter.PATH),
            OpenApiParameter("inline", bool, description="1 : afficher une image dans le navigateur"),
        ],
        responses={(200, "application/octet-stream"): OpenApiTypes.BINARY},
    )
    @action(detail=True, methods=["get"], url_path=r"attachments/(?P<attachment_id>\d+)", url_name="attachment")
    def attachment(self, request, pk=None, attachment_id=None):
        attachment = get_object_or_404(self.get_object().attachments, pk=attachment_id)
        inline = attachment.is_image and request.query_params.get("inline") == "1"
        return FileResponse(
            attachment.file.open("rb"),
            as_attachment=not inline,
            filename=attachment.original_name,
            content_type=attachment.content_type,
        )
