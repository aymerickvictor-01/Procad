from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from . import views

admin.site.site_header = "Administration PROCAD"
admin.site.site_title = "PROCAD"
admin.site.index_title = "Accès de secours"

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/health/", views.health, name="health"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]

if settings.DEBUG:
    # En production, Nginx sert /media/ directement.
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
