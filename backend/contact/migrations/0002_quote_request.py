import secrets

import django.db.models.deletion
from django.db import migrations, models

import common.images
import common.storage

ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"


def fill_references(apps, schema_editor):
    """Les messages déjà reçus obtiennent une référence « MS-… » unique."""
    ContactMessage = apps.get_model("contact", "ContactMessage")
    used = set()
    for message in ContactMessage.objects.filter(reference__isnull=True):
        while True:
            reference = f"MS-{''.join(secrets.choice(ALPHABET) for _ in range(6))}"
            if reference not in used:
                break
        used.add(reference)
        message.reference = reference
        message.save(update_fields=["reference"])


class Migration(migrations.Migration):

    dependencies = [
        ("contact", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="contactmessage",
            name="kind",
            field=models.CharField(
                choices=[("message", "Message"), ("quote", "Demande de devis")],
                default="message",
                max_length=10,
                verbose_name="type",
            ),
        ),
        migrations.AddField(
            model_name="contactmessage",
            name="reference",
            field=models.CharField(editable=False, max_length=12, null=True, verbose_name="référence"),
        ),
        migrations.RunPython(fill_references, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="contactmessage",
            name="reference",
            field=models.CharField(editable=False, max_length=12, unique=True, verbose_name="référence"),
        ),
        migrations.AlterField(
            model_name="contactmessage",
            name="email",
            field=models.EmailField(blank=True, max_length=254, verbose_name="e-mail"),
        ),
        migrations.AddField(
            model_name="contactmessage",
            name="project_type",
            field=models.CharField(
                blank=True,
                choices=[
                    ("new", "Nouveau projet"),
                    ("renovation", "Rénovation ou modification"),
                    ("maintenance", "Entretien ou dépannage"),
                    ("study", "Étude ou conseil"),
                    ("other", "Autre"),
                ],
                max_length=20,
                verbose_name="type de projet",
            ),
        ),
        migrations.AddField(
            model_name="contactmessage",
            name="city",
            field=models.CharField(blank=True, max_length=120, verbose_name="ville ou quartier"),
        ),
        migrations.AddField(
            model_name="contactmessage",
            name="timeline",
            field=models.CharField(
                blank=True,
                choices=[
                    ("urgent", "Urgent (moins d'un mois)"),
                    ("1-3", "Dans 1 à 3 mois"),
                    ("3+", "Dans plus de 3 mois"),
                    ("undefined", "Pas encore défini"),
                ],
                max_length=20,
                verbose_name="délai souhaité",
            ),
        ),
        migrations.AddField(
            model_name="contactmessage",
            name="budget",
            field=models.CharField(blank=True, max_length=100, verbose_name="budget indicatif"),
        ),
        migrations.CreateModel(
            name="ContactAttachment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "file",
                    models.FileField(
                        storage=common.storage.private_storage,
                        upload_to=common.images.UploadTo("contact/%Y/%m"),
                        verbose_name="fichier",
                    ),
                ),
                ("original_name", models.CharField(max_length=200, verbose_name="nom d'origine")),
                ("content_type", models.CharField(max_length=60, verbose_name="type")),
                ("size", models.PositiveIntegerField(verbose_name="taille (octets)")),
                (
                    "message",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="attachments",
                        to="contact.contactmessage",
                    ),
                ),
            ],
            options={
                "verbose_name": "pièce jointe",
                "verbose_name_plural": "pièces jointes",
                "ordering": ["id"],
            },
        ),
    ]
