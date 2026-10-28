from drf_spectacular.utils import extend_schema
from rest_framework import generics

from .models import CompanyProfile
from .serializers import CompanyProfileSerializer


@extend_schema(tags=["Public"], summary="Profil de l'entreprise")
class CompanyProfileView(generics.RetrieveAPIView):
    serializer_class = CompanyProfileSerializer

    def get_object(self):
        return CompanyProfile.load()
