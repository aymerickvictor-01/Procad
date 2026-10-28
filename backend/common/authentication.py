from drf_spectacular.authentication import SessionScheme
from rest_framework.authentication import SessionAuthentication


class SessionAuthentication401(SessionAuthentication):
    """
    Authentification par session qui répond 401 (et non 403) aux visiteurs non connectés.

    DRF ne renvoie 401 que si la méthode d'authentification fournit un en-tête
    WWW-Authenticate ; la session n'en a pas, d'où ce schéma « Session ». Les
    navigateurs n'affichent de fenêtre de connexion que pour « Basic » : aucun effet visible.
    Résultat : 401 = non connecté, 403 = connecté mais sans les droits.
    """

    def authenticate_header(self, request):
        return "Session"


class SessionAuthentication401Scheme(SessionScheme):
    """Documente cette classe comme « cookie de session » dans le schéma OpenAPI."""

    target_class = "common.authentication.SessionAuthentication401"
