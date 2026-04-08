# 🎲 FoundryVTT – First Start Guide

Schritt-für-Schritt-Anleitung zum **ersten Deployment** auf einem Live-Server.

---

## Voraussetzungen

Bevor du anfängst, müssen folgende Dinge erledigt sein:

| Was | Status |
|-----|--------|
| Server mit öffentlicher IP (z.B. Hetzner, DigitalOcean, Netcup) | ✅ |
| DNS-Eintrag: `foundry.bastianmenschner.de` → Server-IP (bereits propagiert, prüfbar via `nslookup foundry.bastianmenschner.de`) | ✅ |
| Ports **80** und **443** in der Firewall offen | ✅ |
| **Docker** und **Docker Compose** auf dem Server installiert | ✅ |
| **Git** auf dem Server installiert | ✅ |
| Gültiger **foundryvtt.com Account** mit aktiver Lizenz | ✅ |

---

## Schritt 1 – Projekt auf den Server übertragen

Klone oder kopiere das Projekt auf den Server:

```sh
git clone git@github.com:bmenschner/foundryvtt-backups.git ~/foundry
cd ~/foundry
```

---

## Schritt 2 – `foundryvtt.zip` bereitstellen

Das Zip-Archiv wird **nicht** im Repository gespeichert (zu groß). Es muss manuell auf den Server übertragen werden.

1. Lade die gewünschte Version von https://foundryvtt.com/releases/ herunter (Linux/NodeJS `.zip`)
2. Kopiere das Archiv in das Projektverzeichnis:

```sh
scp ~/Downloads/foundryvtt-<version>.zip user@server:~/foundry2/foundryvtt.zip
```

> Die Datei **muss** exakt `foundryvtt.zip` heißen.

---

## Schritt 3 – `.env` Datei konfigurieren

Die `.env`-Datei enthält alle Secrets und wird **nicht** in Git eingecheckt. Lege sie auf dem Server an:

```sh
cp .env.example .env   # falls vorhanden
nano .env
```

Folgende Felder müssen befüllt sein:

```dotenv
FOUNDRY_USERNAME=dein-foundry-username
FOUNDRY_PASSWORD=dein-foundry-passwort
FOUNDRY_VERSION=14.359              # z.B. 14.359

DOMAIN=foundry.deinedomain.de

BACKUP_REPO=git@github.com:deinuser/foundryvtt-backups.git
BACKUP_SCHEDULE=0 3 * * *           # täglich 03:00 Uhr
BACKUP_BRANCH=main
BACKUP_GIT_EMAIL=deine@email.de
```

> ⚠️ **Wichtig:** Niemals `.env` in ein öffentliches Repository pushen!

---

## Schritt 4 – SSH Deploy Key für Backup einrichten

Das Backup-System pusht automatisch Daten in ein privates GitHub-Repo. Dafür wird ein SSH-Schlüsselpaar benötigt.

### 4a – Schlüsselpaar generieren (auf dem Server)

```sh
mkdir -p backup/ssh
ssh-keygen -t ed25519 -C "foundryvtt-backup" -f backup/ssh/backup_key -N ""
```

Dies erzeugt:
- `backup/ssh/backup_key` → **Privater Schlüssel** (bleibt auf dem Server)
- `backup/ssh/backup_key.pub` → **Öffentlicher Schlüssel** (wird bei GitHub hinterlegt)

### 4b – Public Key bei GitHub als Deploy Key hinterlegen

1. Gehe zu: `github.com/<deinuser>/foundryvtt-backups` → **Settings** → **Deploy Keys**
2. Klicke **Add deploy key**
3. Füge den Inhalt von `backup/ssh/backup_key.pub` ein
4. ✅ **Allow write access** aktivieren
5. Speichern

```sh
# Public Key anzeigen:
cat backup/ssh/backup_key.pub
```

### 4c – Backup-Repo initialisieren (beim ersten Mal)

Das Ziel-Repo muss bereits auf GitHub existieren und mindestens einen Commit haben (z.B. eine leere README). Erstelle es manuell auf github.com, falls noch nicht vorhanden.

---

## Schritt 5 – nginx-Konfiguration prüfen

Stelle sicher, dass deine Domain in der nginx-Konfiguration korrekt eingetragen ist:

```sh
grep -r "server_name" nginx/
```

Die Domain sollte überall mit `DOMAIN` in `.env` übereinstimmen.

Falls nötig, passe `nginx/foundry.conf.template` an.

---

## Schritt 6 – Docker Image bauen

```sh
docker compose build
```

> Dieser Schritt lädt FoundryVTT-Abhängigkeiten herunter und kann einige Minuten dauern.

---

## Schritt 7 – SSL-Zertifikat initialisieren *(einmalig!)*

> ⚠️ Dieser Schritt löst das "Henne-Ei-Problem": nginx braucht ein Zertifikat zum Starten, Certbot braucht nginx für die Verifikation.

```sh
chmod +x init-letsencrypt.sh
./init-letsencrypt.sh
```

Das Skript führt automatisch folgende Schritte aus:
1. Erstellt ein temporäres Dummy-Zertifikat
2. Startet nginx mit dem Dummy-Zertifikat
3. Löscht das Dummy-Zertifikat
4. Beantragt das echte Let's Encrypt Zertifikat
5. Lädt nginx mit dem echten Zertifikat neu

> ✅ Dieser Schritt muss nur **einmal** ausgeführt werden. Danach läuft die Zertifikatserneuerung vollautomatisch.

---

## Schritt 8 – Stack starten

```sh
docker compose up -d
```

### Status prüfen:

```sh
docker compose ps
```

Alle Container sollten den Status `Up` haben:

| Container | Erwarteter Status |
|-----------|------------------|
| `foundryvtt` | Up |
| `foundry-nginx` | Up |
| `foundry-certbot` | Up |
| `foundry-backup` | Up |

### Logs beobachten:

```sh
docker compose logs -f foundry        # FoundryVTT Logs
docker compose logs -f nginx          # nginx Logs
docker compose logs -f foundry-backup # Backup Logs
```

---

## Schritt 9 – FoundryVTT im Browser aufrufen

Öffne im Browser:

```
https://foundry.deinedomain.de
```

Beim ersten Start ist folgendes zu tun:

1. **Lizenzschlüssel** eingeben (von https://foundryvtt.com/me/licenses/)
2. Lizenzvereinbarung bestätigen
3. Admin-Passwort setzen *(Einstellungen → Konfigurieren → Administratorkennwort)*

> ⚠️ **Das Admin-Passwort notieren und sicher aufbewahren!** Es gibt keinen einfachen Reset.

---

## Schritt 10 – Backup verifizieren

Das erste automatische Backup läuft gemäß `BACKUP_SCHEDULE` (Standard: täglich 03:00 Uhr). Für einen sofortigen Testlauf:

```sh
docker exec foundry-backup /usr/local/bin/backup.sh
docker compose exec backup /usr/local/bin/backup.sh
```

Überprüfe danach das GitHub-Repo auf neue Commits.

---

## Architektur-Übersicht

```
Internet
   │
   ▼ :80 / :443
┌─────────────┐
│    nginx    │  ← Reverse Proxy, SSL-Termination
└──────┬──────┘
       │ :30000 (intern)
┌──────▼──────┐
│  FoundryVTT │  ← App-Container (Node.js)
└─────────────┘

┌─────────────┐
│   Certbot   │  ← Erneuert Zerts alle 12h automatisch
└─────────────┘

┌─────────────┐
│   Backup    │  ← Pusht Daten täglich zu GitHub via SSH
└─────────────┘
```

---

## Troubleshooting

### nginx startet nicht
```sh
docker compose logs nginx
# Häufige Ursache: init-letsencrypt.sh wurde noch nicht ausgeführt
```

### Certbot schlägt fehl
```sh
# DNS-Propagation prüfen:
nslookup foundry.deinedomain.de
# Ports prüfen:
curl -I http://foundry.deinedomain.de/.well-known/acme-challenge/test
```

### Backup schlägt fehl
```sh
docker compose logs foundry-backup
# SSH-Verbindung testen:
docker compose exec foundry-backup ssh -T git@github.com
```

### FoundryVTT startet nicht
```sh
docker compose logs foundry
# Häufige Ursache: foundryvtt.zip fehlt oder ist beschädigt
```

---

## Nach dem ersten Start: laufender Betrieb

| Aufgabe | Befehl |
|---------|--------|
| Alle Container starten | `docker compose up -d` |
| Alle Container stoppen | `docker compose down` |
| FoundryVTT aktualisieren | s. `README.md` → Update-Abschnitt |
| Logs einsehen | `docker compose logs -f [service]` |
| Backup manuell auslösen | `docker compose exec foundry-backup /backup/backup.sh` |
