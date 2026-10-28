from django.urls import path

from .views import AdminCompanyProfileView

urlpatterns = [
    path("company/", AdminCompanyProfileView.as_view(), name="admin-company"),
]
