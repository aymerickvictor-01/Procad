from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from common.images import UploadTo, validate_image


class Testimonial(models.Model):
    author_name = models.CharField("nom du client", max_length=120)
    author_role = models.CharField(
        "fonction ou entreprise", max_length=120, blank=True
    )
    content = models.TextField("témoignage")
    rating = models.PositiveSmallIntegerField(
        "note", null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    photo = models.ImageField(upload_to=UploadTo("testimonials/%Y/%m"), blank=True, validators=[validate_image])
    service = models.ForeignKey(
        "services.Service",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="testimonials",
        verbose_name="service concerné",
    )
    is_published = models.BooleanField("publié", default=False)
    created_at = models.DateTimeField("saisi le", auto_now_add=True)

    class Meta:
        verbose_name = "témoignage"
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(rating__isnull=True) | models.Q(rating__gte=1, rating__lte=5),
                name="testimonial_rating_1_to_5",
            ),
        ]

    def __str__(self):
        return f"{self.author_name} — {self.content[:40]}"
