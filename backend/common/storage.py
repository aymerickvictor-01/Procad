from pathlib import Path

from django.conf import settings
from django.core.files.storage import FileSystemStorage


class PrivateStorage(FileSystemStorage):
    """
    Stockage hors du dossier media public : Nginx ne le sert jamais. Les fichiers ne sont
    accessibles qu'au travers d'une vue réservée aux administrateurs.
    L'emplacement est relu dans les réglages à chaque accès (tests : override_settings).
    """

    def __init__(self):
        super().__init__(base_url=None)

    @property
    def base_location(self):
        return settings.PRIVATE_MEDIA_ROOT

    @property
    def location(self):
        return str(Path(self.base_location).resolve())


def private_storage():
    # Fonction plutôt qu'instance : la migration reste indépendante de la classe de stockage.
    return PrivateStorage()
