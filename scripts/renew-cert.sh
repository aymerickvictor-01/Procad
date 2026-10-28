#!/usr/bin/env bash
# Renouvellement du certificat Let's Encrypt, puis rechargement de Nginx.
# Certbot ne renouvelle que si le certificat expire dans moins de 30 jours : le script peut
# donc être lancé chaque jour sans risque (voir docs/deploiement.md, tâches planifiées).
set -euo pipefail

cd "$(dirname "$0")/.."
# Git Bash (Windows) : ne pas convertir les chemins passés à Docker.
export MSYS_NO_PATHCONV=1

COMPOSE=${PROCAD_COMPOSE:-docker compose -f docker-compose.prod.yml}

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

log "Renouvellement du certificat"
$COMPOSE run --rm certbot renew --webroot -w /var/www/certbot --quiet

# Nginx relit les certificats sans couper les connexions en cours.
$COMPOSE exec -T web nginx -s reload
log "Nginx rechargé"
