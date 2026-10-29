from common.serializers import BaseModelSerializer, ImageVariantsField

from .models import CompanyProfile


class CompanyProfileSerializer(BaseModelSerializer):
    hero_image_variants = ImageVariantsField(source="hero_image")

    class Meta:
        model = CompanyProfile
        exclude = ["id"]


class AdminCompanyProfileSerializer(CompanyProfileSerializer):
    class Meta(CompanyProfileSerializer.Meta):
        read_only_fields = ["updated_at"]
        # null = retirer le logo ou l'image de bannière
        extra_kwargs = {"logo": {"allow_null": True}, "hero_image": {"allow_null": True}}
