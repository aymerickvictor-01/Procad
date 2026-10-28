from django.db import models

from common.images import UploadTo, validate_image
from common.slugs import unique_slugify


class Category(models.Model):
    name = models.CharField("nom", max_length=100, unique=True)
    slug = models.SlugField(
        max_length=120, unique=True, blank=True, help_text="Généré automatiquement depuis le nom si vide."
    )
    description = models.TextField(blank=True)
    display_order = models.PositiveIntegerField("ordre d'affichage", default=0)
    created_at = models.DateTimeField("créée le", auto_now_add=True)

    class Meta:
        verbose_name = "catégorie"
        ordering = ["display_order", "name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slugify(self, self.name)
        super().save(*args, **kwargs)


class ServiceQuerySet(models.QuerySet):
    def published(self):
        return self.filter(is_published=True)


class Service(models.Model):
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="services", verbose_name="catégorie"
    )
    title = models.CharField("titre", max_length=150)
    slug = models.SlugField(
        max_length=170,
        unique=True,
        blank=True,
        help_text="Généré automatiquement depuis le titre si vide. Le modifier change l'URL publique.",
    )
    short_description = models.CharField("résumé", max_length=200)
    description = models.TextField("description complète")
    cover_image = models.ImageField(
        "image de couverture", upload_to=UploadTo("services/%Y/%m"), blank=True, validators=[validate_image]
    )
    price_label = models.CharField(
        "prix indicatif", max_length=100, blank=True, help_text="Ex. « À partir de 50 € », « Sur devis »."
    )
    is_published = models.BooleanField("publié", default=False)
    is_featured = models.BooleanField("mis en avant", default=False)
    display_order = models.PositiveIntegerField("ordre d'affichage", default=0)
    created_at = models.DateTimeField("créé le", auto_now_add=True)
    updated_at = models.DateTimeField("modifié le", auto_now=True)

    objects = ServiceQuerySet.as_manager()

    class Meta:
        verbose_name = "service"
        ordering = ["display_order", "title"]
        indexes = [
            models.Index(fields=["is_published", "display_order"], name="service_published_order_idx"),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Le slug n'est généré qu'une fois : renommer un service ne casse pas ses liens existants.
        if not self.slug:
            self.slug = unique_slugify(self, self.title)
        super().save(*args, **kwargs)


class ServiceImage(models.Model):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to=UploadTo("services/gallery/%Y/%m"), validators=[validate_image])
    alt_text = models.CharField(
        "texte alternatif", max_length=200, blank=True, help_text="Description de l'image (accessibilité, SEO)."
    )
    display_order = models.PositiveIntegerField("ordre", default=0)

    class Meta:
        verbose_name = "image de la galerie"
        verbose_name_plural = "images de la galerie"
        ordering = ["display_order", "id"]

    def __str__(self):
        return self.alt_text or f"Image {self.pk}"


class ServiceFeature(models.Model):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="features")
    label = models.CharField("point fort", max_length=200)
    display_order = models.PositiveIntegerField("ordre", default=0)

    class Meta:
        verbose_name = "point fort"
        verbose_name_plural = "points forts"
        ordering = ["display_order", "id"]

    def __str__(self):
        return self.label
