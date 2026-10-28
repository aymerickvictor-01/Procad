from rest_framework.routers import SimpleRouter

from .views import AdminTestimonialViewSet

router = SimpleRouter()
router.register("testimonials", AdminTestimonialViewSet, basename="admin-testimonial")

urlpatterns = router.urls
