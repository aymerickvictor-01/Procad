from django.db import models

from common.images import UploadTo, validate_image


class CompanyProfile(models.Model):
    """Profil de l'entreprise : une seule ligne en base (id = 1)."""

    SINGLETON_ID = 1

    name = models.CharField("nom", max_length=150)
    slogan = models.CharField(max_length=200, blank=True)
    description = models.TextField("présentation courte", blank=True)
    about_text = models.TextField("texte « À propos »", blank=True)
    logo = models.ImageField(upload_to=UploadTo("company"), blank=True, validators=[validate_image])
    hero_image = models.ImageField(
        "image de bannière", upload_to=UploadTo("company"), blank=True, validators=[validate_image]
    )
    email = models.EmailField("e-mail", blank=True)
    phone = models.CharField("téléphone", max_length=30, blank=True)
    whatsapp = models.CharField(max_length=30, blank=True)
    address = models.CharField("adresse", max_length=255, blank=True)
    city = models.CharField("ville", max_length=100, blank=True)
    country = models.CharField("pays", max_length=100, blank=True)
    opening_hours = models.TextField("horaires d'ouverture", blank=True)
    facebook_url = models.URLField("Facebook", blank=True)
    linkedin_url = models.URLField("LinkedIn", blank=True)
    instagram_url = models.URLField("Instagram", blank=True)
    updated_at = models.DateTimeField("modifié le", auto_now=True)

    class Meta:
        verbose_name = "profil de l'entreprise"
        verbose_name_plural = "profil de l'entreprise"
        constraints = [
            models.CheckConstraint(condition=models.Q(id=1), name="company_profile_singleton"),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        self.pk = self.SINGLETON_ID
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        """Renvoie le profil, en le créant avec le nom PROCAD s'il n'existe pas encore."""
        profile, _ = cls.objects.get_or_create(pk=cls.SINGLETON_ID, defaults={"name": "PROCAD"})
        return profile
