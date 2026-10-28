import logging

from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import generics, mixins, serializers, status, viewsets
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from .models import ContactMessage
from .serializers import AdminContactMessageSerializer, ContactMessageSerializer

logger = logging.getLogger(__name__)

SUCCESS_MESSAGE = "Merci, votre message a bien été envoyé. Nous vous répondrons rapidement."


@extend_schema(
    tags=["Public"],
    summary="Envoyer un message de contact (5 par heure et par adresse IP)",
    responses={201: inline_serializer("ContactAccepted", {"detail": serializers.CharField()})},
)
class ContactCreateView(generics.CreateAPIView):
    serializer_class = ContactMessageSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "contact"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if serializer.validated_data.pop("website", ""):
            # Robot probable : même réponse qu'en cas de succès, pour ne pas l'aider à s'adapter.
            logger.info("Message de contact ignoré : champ piège rempli.")
        else:
            serializer.save()
        return Response({"detail": SUCCESS_MESSAGE}, status=status.HTTP_201_CREATED)


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
    filterset_fields = ["is_read"]
    search_fields = ["full_name", "email", "subject", "message"]
    queryset = ContactMessage.objects.select_related("service")
