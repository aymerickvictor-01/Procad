import logging

from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.middleware.csrf import get_token
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from common.authentication import SessionAuthentication401

from .serializers import ChangePasswordSerializer, LoginSerializer, UserSerializer

logger = logging.getLogger(__name__)

DetailSerializer = inline_serializer("Detail", {"detail": serializers.CharField()})


@extend_schema(
    tags=["Authentification"],
    summary="Pose le cookie csrftoken (à appeler au démarrage du front)",
    responses=inline_serializer("CsrfToken", {"csrfToken": serializers.CharField()}),
)
class CsrfView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # get_token() demande au middleware CSRF de déposer le cookie dans la réponse.
        return Response({"csrfToken": get_token(request)})


@extend_schema(
    tags=["Authentification"],
    summary="Connexion (10 tentatives par minute et par adresse IP)",
    request=LoginSerializer,
    responses={200: UserSerializer, 400: DetailSerializer},
)
class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        # DRF ne vérifie le CSRF que pour un utilisateur déjà connecté : on l'impose
        # aussi ici, pour empêcher un site tiers de connecter le navigateur à un autre compte.
        SessionAuthentication401().enforce_csrf(request)

        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(request, **serializer.validated_data)

        # Même message dans tous les cas d'échec : on ne révèle pas si l'identifiant existe.
        if user is None or not user.is_staff:
            logger.warning(
                "Échec de connexion pour « %s » depuis %s",
                serializer.validated_data["username"],
                self.get_throttles()[0].get_ident(request),  # IP réelle, même derrière Nginx
            )
            return Response({"detail": "Identifiants incorrects."}, status=status.HTTP_400_BAD_REQUEST)

        login(request, user)  # nouvelle session + nouveau jeton CSRF
        return Response(UserSerializer(user).data)


@extend_schema(tags=["Authentification"], summary="Déconnexion", request=None, responses={204: None})
class LogoutView(APIView):
    permission_classes = [AllowAny]  # sans effet si déjà déconnecté

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(
    tags=["Authentification"],
    summary="Utilisateur connecté (401 si non connecté)",
    responses=UserSerializer,
)
class MeView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


@extend_schema(
    tags=["Authentification"],
    summary="Changer son mot de passe",
    request=ChangePasswordSerializer,
    responses={200: DetailSerializer},
)
class ChangePasswordView(APIView):
    permission_classes = [IsAdminUser]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password"

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        # Les autres sessions de ce compte sont fermées ; celle-ci reste ouverte.
        update_session_auth_hash(request, user)
        return Response({"detail": "Mot de passe modifié."})
