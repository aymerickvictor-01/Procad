#!/usr/bin/env bash
# Sauvegarde de la base PostgreSQL et des images téléversées (media).
#
#   scripts/backup.sh                  # production (docker-compose.prod.yml, fichier .env)
#   PROCAD_COMPOSE="docker compose" scripts/backup.sh   # environnement de développement
#
# Crée backups/AAAA-MM-JJ_HHMMSS/ contenant :
#   db.dump        export de la base (format personnalisé pg_dump, compressé)
#   media.tar.gz   archive du dossier media
#   SHA256SUMS     empreintes, vérifiées par restore.sh
#
# Variables :
#   PROCAD_COMPOSE     commande Docker Compose (défaut : docker compose -f docker-compose.prod.yml)
#   BACKUP_DIR         dossier des sauvegardes (défaut : backups/ à la racine du projet)
#   BACKUP_KEEP_DAYS   durée de conservation en jours (défaut : 14)
set -euo pipefail

cd "$(dirname "$0")/.."
# Git Bash (Windows) : ne pas convertir les chemins /app passés à Docker.
export MSYS_NO_PATHCONV=1

COMPOSE=${PROCAD_COMPOSE:-docker compose -f docker-compose.prod.yml}
BACKUP_DIR=${BACKUP_DIR:-backups}
KEEP_DAYS=${BACKUP_KEEP_DAYS:-14}

stamp=$(date +%Y-%m-%d_%H%M%S)
target="$BACKUP_DIR/$stamp"
tmp="$target.partiel"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

# En cas d'échec, aucune sauvegarde incomplète ne reste à côté des bonnes.
trap 'rm -rf "$tmp"' EXIT

mkdir -p "$tmp"

log "Export de la base de données"
$COMPOSE exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' > "$tmp/db.dump"

log "Archive des images (media)"
$COMPOSE exec -T backend tar -czf - -C /app media > "$tmp/media.tar.gz"

# Contrôles : un export vide ou illisible ne doit jamais passer pour une sauvegarde.
$COMPOSE exec -T db pg_restore --list < "$tmp/db.dump" > /dev/null
gzip -t "$tmp/media.tar.gz"

(cd "$tmp" && sha256sum db.dump media.tar.gz > SHA256SUMS)
mv "$tmp" "$target"
trap - EXIT

log "Sauvegarde créée : $target ($(du -sh "$target" | cut -f1))"

# Rotation : suppression des sauvegardes plus anciennes que KEEP_DAYS jours.
find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -name '20*' -mtime +"$KEEP_DAYS" -print \
    | while read -r old; do
        rm -rf "$old"
        log "Ancienne sauvegarde supprimée : $old"
    done
