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

## Installation sur un nouvel ordinateur

Seul **Docker Desktop** est nécessaire (Python, Node.js et PostgreSQL tournent dans des conteneurs).

1. Installer [Docker Desktop](https://www.docker.com/products/docker-desktop/) et [Git](https://git-scm.com/),
   puis démarrer Docker Desktop (attendre « Engine running »).
2. Récupérer le code :
   ```bash
   git clone https://github.com/aymerickvictor-01/Procad.git
   cd Procad
   ```
3. Lancer l'installation :
   - **Windows** : double-cliquer sur `installer.cmd` ;
   - **Linux / macOS** : `scripts/installer.sh`.

Le script vérifie Docker, crée le fichier `.env` avec des mots de passe aléatoires, construit et
démarre les conteneurs (base migrée automatiquement), charge le catalogue des services PROCAD
et propose de créer le compte administrateur, puis affiche les adresses ci-dessous.
La première installation télécharge environ 1,5 Go : compter 10 à 20 minutes selon la connexion.
Il peut être relancé sans risque (le `.env` et les données existants sont conservés).

| Adresse                          | Contenu                     |
|----------------------------------|-----------------------------|
| http://localhost:5174            | Site (React)                |
| http://localhost:5174/admin      | Espace administrateur       |
| http://localhost:8000/api/docs/  | Documentation de l'API      |
| http://localhost:8000/django-admin/ | Admin Django (secours)   |
| http://localhost:5050            | pgAdmin (identifiants : `PGADMIN_EMAIL` / `PGADMIN_PASSWORD` du `.env`) |
| http://localhost:8000/api/health/ | État de l'API et de la base |
| `localhost:5433`                 | PostgreSQL depuis le PC     |

Un port déjà utilisé sur la machine se change dans `.env` (`FRONTEND_PORT`, `BACKEND_PORT`,
`PGADMIN_PORT`, `DB_PORT`), puis `docker compose up -d`.

### Utilisation au quotidien

```bash
docker compose up -d       # démarrer (Docker Desktop doit tourner)
docker compose stop        # arrêter (données conservées)
docker compose logs -f backend frontend   # voir les journaux
docker compose exec backend python manage.py createsuperuser   # autre compte administrateur
```

### Transférer les données d'un ordinateur à l'autre

Le code passe par GitHub, mais pas les données (services saisis, images, comptes). Pour les
reprendre sur la nouvelle machine, depuis Git Bash ou un terminal Linux / macOS :

```bash
# Ancien ordinateur
PROCAD_COMPOSE="docker compose" scripts/backup.sh        # crée backups/AAAA-MM-JJ_HHMMSS/
# Copier ce dossier dans backups/ du nouvel ordinateur (clé USB, cloud...), puis, après l'installation :
PROCAD_COMPOSE="docker compose" scripts/restore.sh backups/AAAA-MM-JJ_HHMMSS
```

### Tests automatiques du back-end

```bash
docker compose exec backend python manage.py test
```

### Catalogue des services

```bash
docker compose exec backend python manage.py load_catalogue           # crée ce qui manque
docker compose exec backend python manage.py load_catalogue --update  # remet les textes du catalogue
```

Les 19 métiers du document « SERVICES » de PROCAD, regroupés en 7 domaines et 15 services, avec
textes, points forts et photos (`backend/services/catalogue/`). Sans `--update`, les services
déjà présents ne sont jamais modifiés : les corrections faites dans l'administration sont
conservées. À lancer aussi sur le serveur après la mise en ligne.

### Demandes de devis, WhatsApp et alertes par e-mail

- **WhatsApp** : bouton flottant sur tout le site et sur chaque fiche service, avec un message
  pré-rempli. Le numéro est celui du champ « WhatsApp » du profil de l'entreprise
  (administration > Entreprise).
- **Demande de devis** (page Contact) : 4 étapes, jusqu'à 5 photos ou PDF (20 Mo au total).
  Chaque demande reçoit une référence (`DV-XXXXXX`). Les pièces jointes sont stockées hors du
  dossier public (`/app/private`, volume `private_data`) et ne se téléchargent que depuis
  l'administration ; les photos sont réduites et débarrassées de leurs métadonnées (GPS).
- **Alertes** : chaque demande envoie un e-mail à `DJANGO_NOTIFY_EMAILS` (pièces jointes et
  lien WhatsApp vers le client inclus) et un accusé de réception au client s'il a laissé son
  e-mail. Sans `DJANGO_EMAIL_HOST`, les e-mails s'affichent dans `docker compose logs backend`.

**Activer l'envoi réel avec Gmail** (compte camerinfos18@gmail.com) :

1. Sur https://myaccount.google.com/security, activer la **validation en deux étapes**.
2. Sur https://myaccount.google.com/apppasswords, créer un **mot de passe d'application**
   (nom : « Site PROCAD ») : Google affiche 16 lettres.
3. Dans `.env` :
   ```
   DJANGO_EMAIL_HOST=smtp.gmail.com
   DJANGO_EMAIL_HOST_USER=camerinfos18@gmail.com
   DJANGO_EMAIL_HOST_PASSWORD=les16lettressansespaces
   DJANGO_DEFAULT_FROM_EMAIL=PROCAD <camerinfos18@gmail.com>
   ```
4. `docker compose up -d backend`, puis envoyer une demande de test depuis le site.

Ne jamais mettre le mot de passe Gmail habituel : le mot de passe d'application peut être
révoqué à tout moment sans toucher au compte.

Images déjà en ligne avant l'ajout des versions allégées (ou après une restauration) :

```bash
docker compose exec backend python manage.py generate_image_variants
```

### Données de démonstration (tests uniquement)

```bash
docker compose exec backend python manage.py seed_demo          # crée ou recrée la démo
docker compose exec backend python manage.py seed_demo --reset  # supprime la démo
```

Crée 3 catégories, 7 services (dont 1 brouillon) avec images, 4 témoignages et 3 messages, tous
marqués « (démo) ». `--reset` ne supprime **que** ces données : le contenu réel saisi par
l'administrateur et le profil de l'entreprise ne sont jamais touchés. Refusé si `DJANGO_DEBUG=0`
(sauf `--force`). Ne pas mélanger avec le catalogue réel : `--reset` après les essais.

### Tests de bout en bout (navigateur)

```bash
node e2e/scenario.mjs
```

Pilote Microsoft Edge sans interface (aucune dépendance à installer : Node 22 + Edge) et
déroule 24 parcours réels : connexion, création d'une catégorie puis d'un service avec image
et points forts, publication, affichage public, demande de devis en 4 étapes avec photo jointe,
question simple, lecture et suppression dans l'admin (projet, pièce jointe), témoignage, profil
de l'entreprise, mot de passe, session expirée.
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
| POST | `/api/contact/` | Message (`kind=message`) ou demande de devis (`kind=quote`, multipart avec `attachments`) — 5 par heure et par IP ; renvoie la référence |

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
| GET / PATCH / DELETE | `/api/admin/messages/{id}/` | PATCH limité à `is_read` — filtres `kind`, `is_read` |
| GET | `/api/admin/messages/{id}/attachments/{id}/` | Pièce jointe (téléchargement ; `?inline=1` pour afficher une image) |

Images : JPEG, PNG ou WebP, 5 Mo maximum. Envoyer `null` (JSON) pour retirer une image.
Chaque image reçoit des versions WebP allégées (480, 960 et 1600 px de large) renvoyées dans les
champs `*_variants` : le site les utilise pour ne télécharger que la taille utile à l'écran.

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
