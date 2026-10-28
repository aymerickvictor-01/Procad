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
nginx/       Configurations Nginx (conf.d/ = active, templates/ = HTTP seul / HTTPS)
postman/     Collection et environnement Postman
docs/        Document de conception, schémas
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
| http://localhost:5173            | Site (React)                |
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

> Les sections « Production » et « Déploiement » seront complétées aux étapes 6 et 7.
