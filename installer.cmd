@echo off
rem Installation de PROCAD sur un nouvel ordinateur Windows : double-cliquer sur ce fichier.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\installer.ps1" %*
pause
