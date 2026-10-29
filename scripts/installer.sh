#!/usr/bin/env bash
# Installation de l'environnement de développement sur un nouvel ordinateur (Linux, macOS).
# Sous Windows, utiliser plutôt installer.cmd (à la racine du projet).
#
#   scripts/installer.sh            # questions posées pour la démo et le compte administrateur
#   scripts/installer.sh --demo     # charge les données de démonstration sans demander
#
# Relançable sans risque : un .env existant est conservé, les données ne sont jamais effacées.
set -euo pipefail

cd "$(dirname "$0")/.."
export MSYS_NO_PATHCONV=1

say()  { printf '\n==> %s\n' "$*"; }
fail() { printf '\nERREUR : %s\n' "$*" >&2; exit 1; }

# --- 1. Docker ------------------------------------------------------------------
say "Vérification de Docker"
command -v docker > /dev/null || fail "Docker n'est pas installé (https://docs.docker.com/get-docker/)."
docker info > /dev/null 2>&1 || fail "Docker est installé mais ne tourne pas : démarrer Docker Desktop puis relancer."
docker compose version > /dev/null 2>&1 || fail "Docker Compose v2 est requis (commande « docker compose »)."

# --- 2. Fichier .env --------------------------------------------------------------
random_secret() { LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c "$1"; }

if [ -f .env ]; then
    say "Fichier .env existant conservé"
else
    say "Création du fichier .env (mots de passe aléatoires)"
    while IFS= read -r line || [ -n "$line" ]; do
        case "$line" in
            DJANGO_SECRET_KEY=*) echo "DJANGO_SECRET_KEY=$(random_secret 60)" ;;
            *=changez-moi*)      echo "${line%%=*}=$(random_secret 24)" ;;
            *)                   echo "$line" ;;
        esac
    done < .env.example > .env
    chmod 600 .env
fi

env_value() { grep -E "^$1=" .env | tail -1 | cut -d= -f2- | tr -d '\r'; }
BACKEND_PORT=$(env_value BACKEND_PORT); BACKEND_PORT=${BACKEND_PORT:-8000}
FRONTEND_PORT=$(env_value FRONTEND_PORT); FRONTEND_PORT=${FRONTEND_PORT:-5174}
PGADMIN_PORT=$(env_value PGADMIN_PORT); PGADMIN_PORT=${PGADMIN_PORT:-5050}

# --- 3. Démarrage -----------------------------------------------------------------
say "Construction et démarrage des conteneurs (plusieurs minutes la première fois)"
docker compose up -d --build

wait_for() {  # wait_for <adresse> <secondes>
    local url=$1 limit=$2 waited=0
    until curl -fs -o /dev/null "$url"; do
        [ "$waited" -ge "$limit" ] && return 1
        sleep 5; waited=$((waited + 5))
    done
}

say "Attente de l'API (migrations de la base)"
wait_for "http://localhost:$BACKEND_PORT/api/health/" 600 \
    || fail "L'API ne répond pas. Voir : docker compose logs backend"

manage() { docker compose exec -T backend python manage.py "$@"; }

# --- 4. Données de démonstration --------------------------------------------------
load_demo=n
if [ "${1:-}" = "--demo" ]; then
    load_demo=o
elif [ -t 0 ]; then
    read -r -p "Charger les données de démonstration (services, témoignages fictifs) ? [o/N] " load_demo
fi
case "$load_demo" in
    [oOyY]*) say "Chargement des données de démonstration"; manage seed_demo ;;
esac

# --- 5. Compte administrateur -----------------------------------------------------
has_admin=$(manage shell -v 0 -c \
    "from django.contrib.auth import get_user_model; print(get_user_model().objects.filter(is_superuser=True).exists())" \
    | tr -d '\r' | tail -1)

if [ "$has_admin" = "True" ]; then
    say "Un compte administrateur existe déjà"
elif [ -t 0 ]; then
    say "Création du compte administrateur (identifiant, e-mail facultatif, mot de passe)"
    # Git Bash (mintty) n'est pas un vrai terminal pour Docker : winpty fait le lien.
    if command -v winpty > /dev/null; then
        winpty docker compose exec backend python manage.py createsuperuser
    else
        docker compose exec backend python manage.py createsuperuser
    fi
else
    echo "Créer le compte administrateur : docker compose exec backend python manage.py createsuperuser"
fi

# --- 6. Résumé ----------------------------------------------------------------------
say "Attente du site (installation des modules du front-end)"
wait_for "http://localhost:$FRONTEND_PORT/" 600 \
    || echo "Le site n'est pas encore prêt. Patienter puis voir : docker compose logs frontend"

cat <<EOF

Installation terminée.

  Site                 http://localhost:$FRONTEND_PORT
  Administration       http://localhost:$FRONTEND_PORT/admin
  Documentation API    http://localhost:$BACKEND_PORT/api/docs/
  pgAdmin              http://localhost:$PGADMIN_PORT
                       identifiant : $(env_value PGADMIN_EMAIL)
                       mot de passe : $(env_value PGADMIN_PASSWORD)
                       (mot de passe de la base dans pgAdmin : POSTGRES_PASSWORD du fichier .env)

  Arrêter    : docker compose stop
  Relancer   : docker compose up -d
EOF
