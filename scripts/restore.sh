#!/usr/bin/env bash
# Restauration d'une sauvegarde créée par backup.sh. REMPLACE la base et les images actuelles.
#
#   scripts/restore.sh backups/2026-10-28_023000          # demande confirmation
#   scripts/restore.sh backups/2026-10-28_023000 --oui    # sans confirmation
#
# PROCAD_COMPOSE : même variable que pour backup.sh.
set -euo pipefail

cd "$(dirname "$0")/.."
# Git Bash (Windows) : ne pas convertir les chemins /app passés à Docker.
export MSYS_NO_PATHCONV=1

COMPOSE=${PROCAD_COMPOSE:-docker compose -f docker-compose.prod.yml}
source_dir=${1:?Usage : scripts/restore.sh <dossier de sauvegarde> [--oui]}
source_dir=${source_dir%/}

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

for f in db.dump media.tar.gz SHA256SUMS; do
    [ -f "$source_dir/$f" ] || { echo "Fichier manquant : $source_dir/$f" >&2; exit 1; }
done

log "Vérification des empreintes"
(cd "$source_dir" && sha256sum --check --quiet SHA256SUMS)

if [ "${2:-}" != "--oui" ]; then
    echo "La base de données et les images actuelles vont être REMPLACÉES par : $source_dir"
    read -r -p "Taper « restaurer » pour continuer : " answer
    [ "$answer" = "restaurer" ] || { echo "Annulé."; exit 1; }
fi

# Le site est coupé pendant la restauration : aucune écriture ni connexion ouverte sur la base.
log "Arrêt du back-end"
$COMPOSE stop backend
trap 'log "Redémarrage du back-end"; $COMPOSE start backend' EXIT

log "Restauration de la base de données"
$COMPOSE exec -T db sh -c \
    'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --single-transaction' \
    < "$source_dir/db.dump"

log "Restauration des images et des pièces jointes"
$COMPOSE run --rm --no-deps -T backend \
    sh -c 'find /app/media /app/private -mindepth 1 -delete && tar -xzf - -C /app' \
    < "$source_dir/media.tar.gz"

log "Restauration terminée"
