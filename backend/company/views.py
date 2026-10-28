from drf_spectacular.utils import extend_schema
from rest_framework import generics
from rest_framework.permissions import IsAdminUser

from .models import CompanyProfile
from .serializers import AdminCompanyProfileSerializer, CompanyProfileSerializer


@extend_schema(tags=["Public"], summary="Profil de l'entreprise")
class CompanyProfileView(generics.RetrieveAPIView):
    serializer_class = CompanyProfileSerializer

    def get_object(self):
        return CompanyProfile.load()


@extend_schema(tags=["Admin - Entreprise"], summary="Lire / modifier le profil (multipart pour les images)")
class AdminCompanyProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminCompanyProfileSerializer

    def get_object(self):
        return CompanyProfile.load()
