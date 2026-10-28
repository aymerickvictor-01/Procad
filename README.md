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

Documentation interactive complète : http://localhost:8000/api/docs/

> Les sections « Production » et « Déploiement » seront complétées aux étapes 6 et 7.
