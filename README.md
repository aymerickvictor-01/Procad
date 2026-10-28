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
| http://localhost:5050            | pgAdmin                     |

Premier lancement, dans un second terminal :

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

> Les sections « Production » et « Déploiement » seront complétées aux étapes 6 et 7.
