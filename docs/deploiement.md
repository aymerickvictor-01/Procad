# Déploiement de PROCAD sur un serveur

Procédure de mise en ligne, de la machine vierge au site en HTTPS, puis exploitation courante
(sauvegardes, certificat, mises à jour). Les commandes sont lancées sur le serveur, dans le
dossier du projet, sauf mention contraire.

## 1. Serveur

| Élément | Minimum conseillé |
|---------|-------------------|
| Système | Ubuntu Server 24.04 LTS (ou Debian 12) |
| Processeur / mémoire | 1 vCPU, 2 Go de RAM |
| Disque | 25 Go SSD (base, images et 14 jours de sauvegardes) |
| Réseau | Adresse IPv4 publique fixe, ports 22, 80 et 443 ouverts |

Un VPS chez un hébergeur (OVHcloud, Hetzner, Contabo, DigitalOcean…) convient.

### Préparation (une seule fois)

```bash
# Mises à jour et pare-feu
sudo apt update && sudo apt upgrade -y
sudo apt install -y git ufw
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Docker et Docker Compose (dépôt officiel Docker)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER     # puis se déconnecter / reconnecter
docker compose version
```

Conseillé : connexion SSH par clé uniquement (`PasswordAuthentication no` dans
`/etc/ssh/sshd_config`) et mises à jour de sécurité automatiques (`sudo apt install unattended-upgrades`).

## 2. Nom de domaine (DNS)

Chez le registraire du domaine, créer deux enregistrements pointant vers l'IP du serveur :

| Type | Nom | Valeur |
|------|-----|--------|
| A | `procad.com` (ou `@`) | IP du serveur |
| A | `www` | IP du serveur |

Vérifier depuis n'importe quel poste avant de continuer (la propagation peut prendre quelques heures) :

```bash
nslookup procad.com
nslookup www.procad.com
```

## 3. Installation de l'application

```bash
git clone <adresse du dépôt GitHub> procad
cd procad
cp .env.prod.example .env
nano .env          # remplacer chaque « changez-moi », vérifier les domaines
chmod 600 .env
```

Générer les secrets (sur le serveur ou n'importe quel poste) :

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(24))"   # POSTGRES_PASSWORD
python3 -c "import secrets; print(secrets.token_urlsafe(50))"   # DJANGO_SECRET_KEY
```

Laisser `NGINX_CONFIG=http-only` pour l'instant, puis démarrer :

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
docker compose -f docker-compose.prod.yml exec backend python manage.py load_catalogue
```

Le site public répond alors en HTTP sur http://procad.com. La connexion à l'administration ne
fonctionne pas encore : les cookies de session sont réservés à HTTPS, c'est voulu. Ne pas lancer
`seed_demo` en production.

## 4. Certificat HTTPS (Let's Encrypt)

Obtenir le certificat (remplacer l'adresse e-mail, qui reçoit les alertes d'expiration) :

```bash
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d procad.com -d www.procad.com \
  --email contact@procad.com --agree-tos --no-eff-email
```

Le premier `-d` doit être égal à `NGINX_CERT_NAME` dans `.env`. Puis passer en HTTPS :

```bash
sed -i 's/^NGINX_CONFIG=.*/NGINX_CONFIG=https/' .env
docker compose -f docker-compose.prod.yml up -d
```

Vérifications :

- http://procad.com redirige vers https://procad.com ;
- le cadenas s'affiche, l'administration https://procad.com/admin permet de se connecter ;
- note A ou A+ sur https://www.ssllabs.com/ssltest/.

Une fois tout validé, activer HSTS : décommenter la ligne `Strict-Transport-Security` dans
`nginx/snippets/security-headers.conf`, puis `docker compose -f docker-compose.prod.yml restart web`.
HSTS oblige les navigateurs à n'utiliser que HTTPS pendant un an : ne l'activer qu'une fois
HTTPS fonctionnel sur `procad.com` **et** `www.procad.com`.

## 5. Tâches planifiées

```bash
chmod +x scripts/*.sh
crontab -e
```

Ajouter (remplacer `/home/procad/procad` par le chemin réel du projet) :

```
# Sauvegarde chaque nuit à 2 h 30
30 2 * * * /home/procad/procad/scripts/backup.sh >> /home/procad/procad/backups/backup.log 2>&1
# Renouvellement du certificat chaque jour à 3 h 15 (effectif seulement à moins de 30 jours de l'expiration)
15 3 * * * /home/procad/procad/scripts/renew-cert.sh >> /home/procad/procad/backups/renew.log 2>&1
```

Le fuseau horaire du serveur fixe l'heure d'exécution : `sudo timedatectl set-timezone Africa/Douala`.

## 6. Sauvegardes

`scripts/backup.sh` crée `backups/AAAA-MM-JJ_HHMMSS/` avec :

| Fichier | Contenu |
|---------|---------|
| `db.dump` | Toute la base : services, catégories, témoignages, messages, profil, comptes |
| `media.tar.gz` | Toutes les images téléversées (logo, bannière, couvertures, galeries, photos) |
| `SHA256SUMS` | Empreintes, pour détecter un fichier abîmé |

Chaque sauvegarde est contrôlée (export lisible, archive valide) avant d'être conservée. Les
sauvegardes de plus de 14 jours sont supprimées (`BACKUP_KEEP_DAYS` pour changer la durée).

**Copie hors du serveur** : une sauvegarde restée sur le serveur disparaît avec lui. Rapatrier
régulièrement le dossier `backups/` sur un autre support, par exemple depuis un PC :

```bash
scp -r utilisateur@procad.com:/home/procad/procad/backups ./sauvegardes-procad
```

ou automatiser l'envoi vers un stockage externe (rclone vers Google Drive, S3, etc.).

Les fichiers `.env` et le dossier du certificat ne sont pas dans la sauvegarde : conserver une
copie du `.env` en lieu sûr (gestionnaire de mots de passe). Le certificat se récupère en
relançant l'étape 4.

### Restaurer

```bash
ls backups/                                         # choisir une sauvegarde
scripts/restore.sh backups/2026-10-28_023000        # demande de taper « restaurer »
```

Le script vérifie les empreintes, arrête le back-end, remplace la base et les images, puis
redémarre. La restauration complète prend moins d'une minute pour un site de cette taille.

**Sur un nouveau serveur** : refaire les étapes 1 à 3 (même `.env`), copier le dossier de
sauvegarde dans `backups/`, lancer `scripts/restore.sh`, puis l'étape 4.

Tester une restauration de temps en temps (par exemple chaque trimestre, sur le test local de
la production) : une sauvegarde jamais restaurée n'est pas une sauvegarde vérifiée.

## 7. Mise à jour de l'application

```bash
scripts/backup.sh                                     # toujours sauvegarder avant
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Les migrations et les fichiers statiques sont appliqués au redémarrage du back-end. En cas de
problème : `git checkout <version précédente>`, reconstruire, et restaurer la sauvegarde si une
migration a modifié la base.

## 8. Surveillance

```bash
docker compose -f docker-compose.prod.yml ps               # état des conteneurs
docker compose -f docker-compose.prod.yml logs -f --tail 100 backend web
curl -s https://procad.com/api/health/                      # {"status":"ok","database":"ok"}
df -h                                                       # espace disque
```

Un service gratuit de surveillance (UptimeRobot, Better Stack…) peut interroger
`https://procad.com/api/health/` toutes les 5 minutes et prévenir par e-mail en cas de panne.
