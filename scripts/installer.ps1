# Installation de l'environnement de développement sur un nouvel ordinateur Windows.
# Lancer installer.cmd (double-clic, à la racine du projet), ou dans PowerShell :
#   powershell -ExecutionPolicy Bypass -File scripts\installer.ps1
#
# Relançable sans risque : un .env existant est conservé, les données ne sont jamais effacées.
# « Continue » : avec « Stop », PowerShell 5.1 transforme en erreur fatale le moindre message de
# Docker sur la sortie d'erreur. Chaque commande est vérifiée par son code de retour.
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Say($text) { Write-Host ""; Write-Host "==> $text" -ForegroundColor Cyan }
function Fail($text) { Write-Host ""; Write-Host "ERREUR : $text" -ForegroundColor Red; exit 1 }

# --- 1. Docker ------------------------------------------------------------------
Say "Vérification de Docker"
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Fail "Docker Desktop n'est pas installé (https://www.docker.com/products/docker-desktop/)."
}
docker info *> $null
if ($LASTEXITCODE -ne 0) { Fail "Docker Desktop est installé mais ne tourne pas : le démarrer, attendre « Engine running », puis relancer." }
docker compose version *> $null
if ($LASTEXITCODE -ne 0) { Fail "Docker Compose v2 est requis (commande « docker compose »)." }

# --- 2. Fichier .env --------------------------------------------------------------
function New-Secret([int]$length) {
    $chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    $byte = New-Object byte[] 1
    $result = ""
    while ($result.Length -lt $length) {
        $rng.GetBytes($byte)
        # 248 = 4 x 62 : on écarte les valeurs au-delà pour un tirage sans biais.
        if ($byte[0] -lt 248) { $result += $chars[$byte[0] % 62] }
    }
    return $result
}

$utf8 = New-Object Text.UTF8Encoding($false)
$envPath = Join-Path $root ".env"

if (Test-Path $envPath) {
    Say "Fichier .env existant conservé"
} else {
    Say "Création du fichier .env (mots de passe aléatoires)"
    $lines = [IO.File]::ReadAllLines((Join-Path $root ".env.example"), $utf8) | ForEach-Object {
        if ($_ -like "DJANGO_SECRET_KEY=*") { "DJANGO_SECRET_KEY=" + (New-Secret 60) }
        elseif ($_ -match "^([A-Z_]+)=changez-moi") { $Matches[1] + "=" + (New-Secret 24) }
        else { $_ }
    }
    # UTF-8 sans BOM et fins de ligne LF, comme attendu par Docker Compose.
    [IO.File]::WriteAllText($envPath, (($lines -join "`n") + "`n"), $utf8)
}

function Get-EnvValue($name, $default) {
    $line = [IO.File]::ReadAllLines($envPath, $utf8) | Where-Object { $_ -like "$name=*" } | Select-Object -Last 1
    if ($line) { return $line.Substring($name.Length + 1).Trim() }
    return $default
}
$backendPort = Get-EnvValue "BACKEND_PORT" "8000"
$frontendPort = Get-EnvValue "FRONTEND_PORT" "5174"
$pgadminPort = Get-EnvValue "PGADMIN_PORT" "5050"

# --- 3. Démarrage -----------------------------------------------------------------
Say "Construction et démarrage des conteneurs (plusieurs minutes la première fois)"
docker compose up -d --build
if ($LASTEXITCODE -ne 0) { Fail "Échec du démarrage. Vérifier la connexion Internet puis relancer." }

function Wait-Url($url, [int]$seconds) {
    $deadline = (Get-Date).AddSeconds($seconds)
    while ((Get-Date) -lt $deadline) {
        try {
            Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5 | Out-Null
            return $true
        } catch { Start-Sleep -Seconds 5 }
    }
    return $false
}

Say "Attente de l'API (migrations de la base)"
if (-not (Wait-Url "http://localhost:$backendPort/api/health/" 600)) {
    Fail "L'API ne répond pas. Voir : docker compose logs backend"
}

# --- 4. Catalogue des services ---------------------------------------------------
# Services réels de PROCAD ; les services déjà présents ne sont pas modifiés.
Say "Chargement du catalogue des services"
docker compose exec -T backend python manage.py load_catalogue

# --- 5. Compte administrateur -----------------------------------------------------
$check = 'from django.contrib.auth import get_user_model as U; print(U().objects.filter(is_superuser=True).exists())'
$hasAdmin = (docker compose exec -T backend python manage.py shell -v 0 -c $check | Select-Object -Last 1)

if ("$hasAdmin".Trim() -eq "True") {
    Say "Un compte administrateur existe déjà"
} else {
    Say "Création du compte administrateur (identifiant, e-mail facultatif, mot de passe)"
    docker compose exec backend python manage.py createsuperuser
}

# --- 6. Résumé ----------------------------------------------------------------------
Say "Attente du site (installation des modules du front-end)"
if (-not (Wait-Url "http://localhost:$frontendPort/" 600)) {
    Write-Host "Le site n'est pas encore prêt. Patienter puis voir : docker compose logs frontend" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Installation terminée." -ForegroundColor Green
Write-Host ""
Write-Host "  Site                 http://localhost:$frontendPort"
Write-Host "  Administration       http://localhost:$frontendPort/admin"
Write-Host "  Documentation API    http://localhost:$backendPort/api/docs/"
Write-Host "  pgAdmin              http://localhost:$pgadminPort"
Write-Host "                       identifiant : $(Get-EnvValue 'PGADMIN_EMAIL' '')"
Write-Host "                       mot de passe : $(Get-EnvValue 'PGADMIN_PASSWORD' '')"
Write-Host "                       (mot de passe de la base dans pgAdmin : POSTGRES_PASSWORD du fichier .env)"
Write-Host ""
Write-Host "  Arrêter    : docker compose stop"
Write-Host "  Relancer   : docker compose up -d"
