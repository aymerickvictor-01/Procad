from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
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
    path("api/", include("accounts.urls")),
    # API publique
    path("api/", include("company.urls")),
    path("api/", include("services.urls")),
    path("api/", include("testimonials.urls")),
    path("api/", include("contact.urls")),
    # API d'administration (comptes staff uniquement)
    path("api/admin/stats/", views.admin_stats, name="admin-stats"),
    path("api/admin/", include("company.urls_admin")),
    path("api/admin/", include("services.urls_admin")),
    path("api/admin/", include("testimonials.urls_admin")),
    path("api/admin/", include("contact.urls_admin")),
]

if settings.DEBUG:
    # En production, Nginx sert /media/ directement.
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
