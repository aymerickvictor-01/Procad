"""
Jeu de données de démonstration, pour développer et tester le front-end.

    python manage.py seed_demo          (re)crée les données de démo
    python manage.py seed_demo --reset  supprime uniquement les données de démo

Tout ce qui est créé est marqué « démo » (slugs « demo-… », noms « (démo) »,
e-mails @demo.example.com) : le vrai contenu saisi par l'administrateur n'est
jamais modifié ni supprimé. Le profil de l'entreprise n'est pas touché.
"""
import unicodedata
from io import BytesIO

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from PIL import Image, ImageDraw, ImageFont

from contact.models import ContactMessage
from services.models import Category, Service, ServiceFeature, ServiceImage
from testimonials.models import Testimonial

DEMO_SLUG_PREFIX = "demo-"
DEMO_SUFFIX = " (démo)"
DEMO_EMAIL_DOMAIN = "@demo.example.com"

CATEGORIES = [
    ("informatique", "Informatique", "Matériel, logiciels et réseaux.", "#1530e0"),
    ("electricite", "Électricité", "Installations et mises aux normes.", "#0a1240"),
    ("formation", "Formation", "Sessions pour vos équipes.", "#18236a"),
]

SERVICES = [
    {
        "category": "informatique", "slug": "maintenance-informatique", "title": "Maintenance informatique",
        "short": "Dépannage et maintenance préventive de votre parc informatique.",
        "price": "Sur devis", "featured": True,
        "features": ["Intervention sous 24 h", "Garantie 3 mois", "Rapport d'intervention"],
        "gallery": 3,
    },
    {
        "category": "informatique", "slug": "installation-reseau", "title": "Installation réseau",
        "short": "Câblage, Wi-Fi et configuration de votre réseau d'entreprise.",
        "price": "À partir de 150 000 FCFA", "featured": True,
        "features": ["Audit préalable", "Matériel professionnel", "Documentation fournie"],
        "gallery": 2,
    },
    {
        "category": "informatique", "slug": "sauvegarde-donnees", "title": "Sauvegarde des données",
        "short": "Mise en place de sauvegardes automatiques et sécurisées.",
        "price": "Sur devis", "featured": False,
        "features": ["Sauvegarde quotidienne", "Copie hors site"],
        "gallery": 0,
    },
    {
        "category": "electricite", "slug": "installation-electrique", "title": "Installation électrique",
        "short": "Installation complète pour bureaux et locaux professionnels.",
        "price": "Sur devis", "featured": True,
        "features": ["Conforme aux normes", "Équipe certifiée", "Garantie 1 an"],
        "gallery": 2,
    },
    {
        "category": "electricite", "slug": "mise-aux-normes", "title": "Mise aux normes",
        "short": "Diagnostic et remise en conformité de vos installations.",
        "price": "À partir de 75 000 FCFA", "featured": False,
        "features": ["Diagnostic complet", "Certificat de conformité"],
        "gallery": 0,
    },
    {
        "category": "formation", "slug": "formation-bureautique", "title": "Formation bureautique",
        "short": "Word, Excel et outils collaboratifs pour vos collaborateurs.",
        "price": "50 000 FCFA / jour", "featured": False,
        "features": ["Groupes de 8 personnes maximum", "Support de cours remis", "Attestation de fin de formation"],
        "gallery": 1,
    },
    {
        "category": "formation", "slug": "formation-cybersecurite", "title": "Sensibilisation cybersécurité",
        "short": "Brouillon de démonstration : non visible sur le site public.",
        "price": "", "featured": False, "published": False,
        "features": ["Hameçonnage", "Mots de passe"],
        "gallery": 0,
    },
]

TESTIMONIALS = [
    ("Jean Mbarga", "Directeur, Société Alpha", "Intervention rapide et équipe très professionnelle.", 5,
     "maintenance-informatique", True),
    ("Aïcha Ngono", "Gérante, Boutique Beta", "Notre réseau fonctionne enfin sans coupure. Merci !", 5,
     "installation-reseau", True),
    ("Paul Essomba", "Responsable RH, Groupe Gamma", "Formation claire et adaptée à notre niveau.", 4,
     "formation-bureautique", True),
    ("Témoignage masqué", "", "Exemple de témoignage non publié.", 3, None, False),
]

MESSAGES = [
    ("Marie Dupont", "Demande de devis", "Bonjour, je souhaite un devis pour la maintenance de 15 postes.",
     "maintenance-informatique", False),
    ("Samuel Kamga", "Disponibilité", "Êtes-vous disponibles la semaine prochaine pour une visite ?",
     "installation-electrique", False),
    ("Claire Fotso", "Question générale", "Quels sont vos horaires d'ouverture le samedi ?", None, True),
]


def without_accents(text):
    # La police intégrée à Pillow n'a pas de glyphes accentués.
    return unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()


def placeholder_image(label, color, size=(1200, 800)):
    """Image JPEG unie avec le libellé et la mention DEMO au centre."""
    img = Image.new("RGB", size, color)
    draw = ImageDraw.Draw(img)
    draw.rectangle([40, 40, size[0] - 40, size[1] - 40], outline="white", width=4)
    font = ImageFont.load_default(size=min(size) // 12)
    text = without_accents(f"{label}\nDEMO")
    left, top, right, bottom = draw.multiline_textbbox((0, 0), text, font=font, align="center", spacing=20)
    position = ((size[0] - (right - left)) / 2, (size[1] - (bottom - top)) / 2)
    draw.multiline_text(position, text, fill="white", font=font, align="center", spacing=20)
    buffer = BytesIO()
    img.save(buffer, "JPEG", quality=80)
    return ContentFile(buffer.getvalue(), name="demo.jpg")


class Command(BaseCommand):
    help = "Crée (ou supprime avec --reset) un jeu de données de démonstration marqué « démo »."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Supprime les données de démo sans en recréer.")
        parser.add_argument("--force", action="store_true", help="Autorise l'exécution avec DEBUG=0.")

    def handle(self, *args, reset=False, force=False, **options):
        if not settings.DEBUG and not force:
            raise CommandError("DEBUG=0 : environnement de production probable. Ajoutez --force si c'est voulu.")

        with transaction.atomic():
            deleted = self.delete_demo()
        self.stdout.write(f"Données de démo supprimées : {deleted}")
        if reset:
            return

        with transaction.atomic():
            self.create_demo()
        self.stdout.write(self.style.SUCCESS(
            f"Démo créée : {len(CATEGORIES)} catégories, {len(SERVICES)} services "
            f"(dont 1 brouillon), {len(TESTIMONIALS)} témoignages, {len(MESSAGES)} messages."
        ))

    def delete_demo(self):
        def delete(queryset):
            # delete() compte aussi les objets supprimés en cascade : on ne garde que le modèle visé.
            return queryset.delete()[1].get(queryset.model._meta.label, 0)

        counts = {
            "messages": delete(ContactMessage.objects.filter(email__endswith=DEMO_EMAIL_DOMAIN)),
            "témoignages": delete(Testimonial.objects.filter(author_name__endswith=DEMO_SUFFIX)),
            # Supprime aussi images et points forts (CASCADE) ; les fichiers sont effacés après le commit.
            "services": delete(Service.objects.filter(slug__startswith=DEMO_SLUG_PREFIX)),
            "catégories": delete(Category.objects.filter(slug__startswith=DEMO_SLUG_PREFIX)),
        }
        return ", ".join(f"{n} {label}" for label, n in counts.items())

    def create_demo(self):
        categories = {}
        for order, (key, name, description, color) in enumerate(CATEGORIES):
            categories[key] = Category.objects.create(
                name=name + DEMO_SUFFIX, slug=DEMO_SLUG_PREFIX + key, description=description, display_order=order
            )
            categories[key].color = color

        services = {}
        for order, data in enumerate(SERVICES):
            category = categories[data["category"]]
            service = Service(
                category=category,
                title=data["title"] + DEMO_SUFFIX,
                slug=DEMO_SLUG_PREFIX + data["slug"],
                short_description=data["short"],
                description=(
                    f"{data['short']}\n\nCeci est un texte de démonstration. L'administrateur le remplacera "
                    "par la description réelle du service depuis l'espace d'administration."
                ),
                price_label=data["price"],
                is_published=data.get("published", True),
                is_featured=data["featured"],
                display_order=order,
            )
            service.cover_image = placeholder_image(data["title"], category.color)
            service.save()
            ServiceFeature.objects.bulk_create(
                ServiceFeature(service=service, label=label, display_order=i) for i, label in enumerate(data["features"])
            )
            for i in range(data["gallery"]):
                ServiceImage.objects.create(
                    service=service,
                    image=placeholder_image(f"{data['title']} - photo {i + 1}", category.color),
                    alt_text=f"{data['title']}, photo {i + 1}",
                    display_order=i,
                )
            services[data["slug"]] = service

        for name, role, content, rating, service_key, published in TESTIMONIALS:
            Testimonial.objects.create(
                author_name=name + DEMO_SUFFIX, author_role=role, content=content, rating=rating,
                service=services.get(service_key), is_published=published,
            )

        for name, subject, message, service_key, is_read in MESSAGES:
            email = name.lower().split()[0].replace("ï", "i") + DEMO_EMAIL_DOMAIN
            ContactMessage.objects.create(
                full_name=name, email=email, phone="+237 6 00 00 00 00", subject=subject, message=message,
                service=services.get(service_key), is_read=is_read,
            )
