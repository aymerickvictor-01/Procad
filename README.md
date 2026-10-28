# PROCAD — Site vitrine

Application web qui présente les services de PROCAD et permet à l'entreprise de gérer son contenu
(services, catégories, témoignages, profil, messages) depuis un espace administrateur.

| Couche          | Technologie                                     |
|-----------------|-------------------------------------------------|
| Front-end       | React (Vite) + React Router                     |
| Back-end        | Python / Django + Django REST Framework         |
| Base de données | PostgreSQL 16, administrée avec pgAdmin 4       |
| Tests d'API     | Postman                                         |
| Déploiement     | Docker, Docker Compose, Nginx, Let's Encrypt    |

## Structure du dépôt

```
backend/     API Django (accounts, company, services, testimonials, contact)
frontend/    Application React (Vite)
nginx/       Production : templates/ (http-only.conf, https.conf) et snippets/ (routes communes)
postman/     Collection et environnement Postman
scripts/     Sauvegarde, restauration, renouvellement du certificat
e2e/         Tests de bout en bout dans le navigateur
docs/        Guide de déploiement (deploiement.md), logo (docs/brand/)
```

## Prérequis

- Docker Desktop (avec Docker Compose)
- Git
- Node.js 22 LTS et Python 3.12 (facultatifs : tout tourne dans Docker)

## Démarrage en développement

```bash
cp .env.example .env          # puis renseigner les valeurs
docker compose up --build
```

| Adresse                          | Contenu                     |
|----------------------------------|-----------------------------|
| http://localhost:5174            | Site (React) — 5174 car le 5173 est pris par un autre projet |
| http://localhost:8000/api/docs/  | Documentation de l'API      |
| http://localhost:8000/django-admin/ | Admin Django (secours)   |
| http://localhost:5050            | pgAdmin (identifiants : `PGADMIN_EMAIL` / `PGADMIN_PASSWORD`) |
| http://localhost:8000/api/health/ | État de l'API et de la base |
| `localhost:5433`                 | PostgreSQL depuis le PC (5433 pour ne pas entrer en conflit avec un PostgreSQL local) |

Premier lancement, dans un second terminal :

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createcachetable
docker compose exec backend python manage.py createsuperuser
```

Tests automatiques du back-end :

```bash
docker compose exec backend python manage.py test
```

### Données de démonstration (développement)

```bash
docker compose exec backend python manage.py seed_demo          # crée ou recrée la démo
docker compose exec backend python manage.py seed_demo --reset  # supprime la démo
```

Crée 3 catégories, 7 services (dont 1 brouillon) avec images, 4 témoignages et 3 messages, tous
marqués « (démo) ». `--reset` ne supprime **que** ces données : le contenu réel saisi par
l'administrateur et le profil de l'entreprise ne sont jamais touchés. Refusé si `DJANGO_DEBUG=0`
(sauf `--force`). À lancer avec `--reset` avant de saisir le vrai contenu.

### Tests de bout en bout (navigateur)

```bash
node e2e/scenario.mjs
```

Pilote Microsoft Edge sans interface (aucune dépendance à installer : Node 22 + Edge) et
déroule 22 parcours réels : connexion, création d'une catégorie puis d'un service avec image
et points forts, publication, affichage public, envoi d'un message de contact, lecture et
suppression dans l'admin, témoignage, profil de l'entreprise, mot de passe, session expirée.
Un compte administrateur temporaire est créé puis supprimé, ainsi que toutes les données de
test ; le slogan de l'entreprise est restauré. Captures d'écran : `e2e/resultats/`.
Autre navigateur Chromium : variable `E2E_BROWSER` (chemin de l'exécutable).

### Tests de l'API avec Postman

1. Importer `postman/vitrine.postman_collection.json` et `postman/local.postman_environment.json`.
2. Sélectionner l'environnement **PROCAD - local** et renseigner `admin_username` / `admin_password`
   (compte staff).
3. *Settings > General > Working directory* : choisir la racine du dépôt (pour les images de
   `postman/fixtures/`).
4. Lancer toute la collection avec le **Collection Runner** (dossiers 00 à 04, dans l'ordre).

Le jeton CSRF est géré automatiquement par les scripts de la collection. Les données créées par
les tests sont supprimées en fin de dossier ; le profil de l'entreprise n'est pas modifié.
L'envoi de contact est limité à 5 par heure : au-delà, la collection reçoit un 429.

En ligne de commande (même résultat) :

```bash
npx newman run postman/vitrine.postman_collection.json -e postman/local.postman_environment.json \
  --env-var admin_username=MON_COMPTE --env-var admin_password=MON_MOT_DE_PASSE
```

## API publique

| Méthode | Route | Description |
|---------|-------|-------------|
| GET  | `/api/company/` | Profil de l'entreprise |
| GET  | `/api/categories/` | Catégories + nombre de services publiés (non paginé) |
| GET  | `/api/services/` | Services publiés — `category`, `search`, `featured=true`, `page`, `page_size` |
| GET  | `/api/services/{slug}/` | Détail d'un service publié |
| GET  | `/api/testimonials/` | Témoignages publiés — `service` (slug) |
| POST | `/api/contact/` | Message de contact (5 par heure et par IP) |

## Authentification (session + CSRF)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET  | `/api/auth/csrf/` | Pose le cookie `csrftoken` (à appeler en premier) |
| POST | `/api/auth/login/` | `{username, password}` — comptes staff uniquement, 10 essais/min |
| POST | `/api/auth/logout/` | Ferme la session |
| GET  | `/api/auth/me/` | Utilisateur connecté — **401** si non connecté |
| POST | `/api/auth/change-password/` | `{old_password, new_password}` |

Toute requête POST/PUT/PATCH/DELETE doit envoyer l'en-tête `X-CSRFToken` avec la valeur
du cookie `csrftoken`. Le jeton change après la connexion : toujours relire le cookie.

Codes : **401** = non connecté, **403** = connecté sans les droits (ou jeton CSRF absent).

## API d'administration (comptes staff)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/admin/stats/` | Compteurs du tableau de bord + 5 derniers messages |
| GET / PUT / PATCH | `/api/admin/company/` | Profil de l'entreprise (multipart pour logo / bannière) |
| GET / POST | `/api/admin/services/` | Tous les services — filtres `category` (id), `is_published`, `is_featured`, `search` |
| GET / PUT / PATCH / DELETE | `/api/admin/services/{id}/` | `features` = liste de textes qui remplace l'existante |
| POST | `/api/admin/services/{id}/images/` | Ajout d'une image à la galerie (multipart) |
| PATCH / DELETE | `/api/admin/services/{id}/images/{image_id}/` | Texte alternatif, ordre / suppression |
| GET / POST | `/api/admin/categories/` | Catégories (non paginé) |
| GET / PUT / PATCH / DELETE | `/api/admin/categories/{id}/` | 400 si des services y sont rattachés |
| GET / POST | `/api/admin/testimonials/` | Filtres `is_published`, `service` (id) |
| GET / PUT / PATCH / DELETE | `/api/admin/testimonials/{id}/` | |
| GET | `/api/admin/messages/` | Du plus récent au plus ancien — filtre `is_read` |
| GET / PATCH / DELETE | `/api/admin/messages/{id}/` | PATCH limité à `is_read` |

Images : JPEG, PNG ou WebP, 5 Mo maximum. Envoyer `null` (JSON) pour retirer une image.

Documentation interactive complète : http://localhost:8000/api/docs/



## Production

La production utilise `docker-compose.prod.yml` : PostgreSQL (aucun port ouvert), Django servi
par Gunicorn, Nginx (React compilé, relais `/api/` et `/django-admin/`, fichiers `/static/` et
`/media/`) et Certbot pour le certificat HTTPS. Au démarrage, le conteneur `backend` applique les
migrations, crée la table de cache et collecte les fichiers statiques.

### Tester la production en local (http://localhost)

Projet Docker séparé (`procad-prod`) : l'environnement de développement n'est pas touché.

```bash
cp .env.prod.example .env.prod   # puis : DJANGO_DEBUG=0, hôtes localhost, NGINX_CONFIG=http-only
export PROCAD_ENV_FILE=.env.prod # PowerShell : $env:PROCAD_ENV_FILE=".env.prod"
docker compose -p procad-prod -f docker-compose.prod.yml --env-file .env.prod up -d --build
docker compose -p procad-prod -f docker-compose.prod.yml --env-file .env.prod exec backend python manage.py createsuperuser
docker compose -p procad-prod -f docker-compose.prod.yml --env-file .env.prod down   # arrêt (données conservées)
```

### Configuration Nginx

Le gabarit actif est choisi par `NGINX_CONFIG` dans le `.env` : `http-only` (avant le certificat)
puis `https`. Les noms de domaine (`NGINX_SERVER_NAMES`, `NGINX_CERT_NAME`) sont insérés au
démarrage du conteneur `web` : aucun fichier à modifier à la main. Passer en HTTPS :

```bash
# après avoir obtenu le certificat (section 12.4 du document de conception)
sed -i 's/^NGINX_CONFIG=.*/NGINX_CONFIG=https/' .env
docker compose -f docker-compose.prod.yml up -d web
```

### Sauvegardes

```bash
scripts/backup.sh                                   # base + images dans backups/AAAA-MM-JJ_HHMMSS/
scripts/restore.sh backups/2026-10-28_023000        # remplace la base et les images (confirmation)
```

Par défaut, les scripts visent `docker-compose.prod.yml`. Pour un autre environnement, définir
`PROCAD_COMPOSE`, par exemple `PROCAD_COMPOSE="docker compose" scripts/backup.sh` en développement
(sous Windows : depuis Git Bash).

### Mise en ligne

Serveur, DNS, certificat HTTPS, tâches planifiées, sauvegardes hors serveur et mises à jour :
[docs/deploiement.md](docs/deploiement.md).
