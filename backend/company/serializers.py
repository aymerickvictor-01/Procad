from common.serializers import BaseModelSerializer

from .models import CompanyProfile


class CompanyProfileSerializer(BaseModelSerializer):
    class Meta:
        model = CompanyProfile
        exclude = ["id"]
