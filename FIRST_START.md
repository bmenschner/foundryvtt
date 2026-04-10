# 🎲 FoundryVTT – First Start Guide

Schritt-für-Schritt-Anleitung zum **ersten Deployment** auf einem Live-Server.

---

## Voraussetzungen

| Was | Status |
|-----|--------|
| Server mit öffentlicher IP (z.B. Hetzner, DigitalOcean, Netcup) | ✅ |
| DNS-Eintrag: `foundry.yourdomain.de` → Server-IP (propagiert, prüfbar via `nslookup foundry.yourdomain.de`) | ✅ |
| Ports **80** und **443** in der Firewall offen | ✅ |
| **Docker** und **Docker Compose** auf dem Server installiert | ✅ |
| **Git** auf dem Server installiert | ✅ |
| Gültiger **foundryvtt.com Account** mit aktiver Lizenz | ✅ |

---

## Schritt 1 – Projekt auf den Server übertragen

```sh
git clone git@github.com:bmenschner/foundryvtt.git ~/foundry
cd ~/foundry
```

> Falls `git clone` fehlschlägt: Für SSH-Auth einen Server-Key bei GitHub hinterlegen (siehe `README.md` → *Git Setup on the Remote Server*).

---

## Schritt 2 – `.env` Datei konfigurieren

```sh
cp .env.example .env
nano .env
```

```dotenv
FOUNDRY_USERNAME=dein-foundry-username
FOUNDRY_PASSWORD=dein-foundry-passwort
FOUNDRY_VERSION=13.351              # z.B. 13.351

DOMAIN=foundry.deinedomain.de

BACKUP_REPO=git@github.com:deinuser/foundryvtt-backups.git
BACKUP_SCHEDULE=0 3 * * *           # täglich 03:00 Uhr
BACKUP_BRANCH=main
BACKUP_GIT_EMAIL=deine@email.de
BACKUP_SSH_KEY=<base64-kodierter-privater-SSH-Key>   # siehe Schritt 3
```

> ⚠️ **Wichtig:** Niemals `.env` in ein öffentliches Repository pushen!

---

## Schritt 3 – SSH Deploy Key für Backup einrichten

Das Backup-System pusht täglich Daten in ein privates GitHub-Repo. Der SSH-Key wird **nicht als Datei** in den Container gemountet, sondern als Base64-kodierte Umgebungsvariable (`BACKUP_SSH_KEY`) in der `.env` gesetzt.

### 3a – Schlüsselpaar generieren

```sh
ssh-keygen -t ed25519 -C "foundryvtt-backup" -f /tmp/backup_key -N ""
```

### 3b – Privaten Key Base64-kodieren und in `.env` eintragen

```sh
base64 -w 0 /tmp/backup_key
```

Den ausgegebenen String (eine lange Zeile, kein Umbruch) in `.env` eintragen:

```dotenv
BACKUP_SSH_KEY=LS0tLS1CRUdJTiBPUEVOU1NI...   # dein Base64-String
```

> ⚠️ Den temporären Key danach löschen: `rm /tmp/backup_key /tmp/backup_key.pub`

### 3c – Public Key bei GitHub als Deploy Key hinterlegen

1. Gehe zu: `github.com/<deinuser>/foundryvtt-backups` → **Settings** → **Deploy Keys**
2. Klicke **Add deploy key**
3. Füge den Inhalt des Public Keys ein:
   ```sh
   cat /tmp/backup_key.pub
   ```
4. ✅ **Allow write access** aktivieren
5. Speichern

### 3d – Backup-Repo initialisieren

Das Ziel-Repo (`BACKUP_REPO`) muss auf GitHub **bereits existieren** und mindestens einen Commit haben (z.B. eine leere README). Erstelle es manuell auf github.com, falls noch nicht vorhanden.

---

## Schritt 4 – Docker Images bauen

```sh
docker compose build
```

FoundryVTT wird automatisch beim Build heruntergeladen (via Credentials aus `.env`).
Schlägt der Download fehl, lege `foundryvtt.zip` (Linux/Node.js-Build) als Fallback ins Projektverzeichnis:

```sh
scp ~/Downloads/foundryvtt-<version>.zip user@server:~/foundry/foundryvtt.zip
```

> Die Datei **muss** exakt `foundryvtt.zip` heißen.

---

## Schritt 5 – Stack starten

```sh
docker compose up -d
```

**Status prüfen:**

```sh
docker compose ps
```

Alle Container sollten den Status `Up` haben:

| Container | Erwarteter Status |
|-----------|------------------|
| `foundryvtt` | Up |
| `foundry-caddy` | Up |
| `foundry-backup` | Up |

> Caddy besorgt das SSL-Zertifikat von Let's Encrypt **automatisch** beim ersten Start – kein Init-Skript nötig.

**Logs beobachten:**

```sh
docker compose logs -f foundry   # FoundryVTT
docker compose logs -f caddy     # Caddy (HTTPS & Zertifikat)
docker compose logs -f backup    # Backup-Container
```

---

## Schritt 6 – FoundryVTT im Browser aufrufen

Öffne im Browser:

```
https://foundry.deinedomain.de
```

Beim ersten Start:

1. **Lizenzschlüssel** eingeben (von https://foundryvtt.com/me/licenses/)
2. Lizenzvereinbarung bestätigen
3. Admin-Passwort setzen *(Einstellungen → Konfigurieren → Administratorkennwort)*

> ⚠️ **Das Admin-Passwort notieren und sicher aufbewahren!** Es gibt keinen einfachen Reset.

---

## Schritt 7 – Backup verifizieren

Das erste automatische Backup läuft gemäß `BACKUP_SCHEDULE` (Standard: täglich 03:00 Uhr). Für einen sofortigen Testlauf:

```sh
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
│    Caddy    │  ← Reverse Proxy, automatisches HTTPS (Let's Encrypt)
└──────┬──────┘
       │ :30000 (intern)
┌──────▼──────┐
│  FoundryVTT │  ← App-Container (Node.js 24)
└─────────────┘

┌─────────────┐
│   Backup    │  ← Pusht data/ täglich zu GitHub via SSH
└─────────────┘
```

---

## Troubleshooting

### Caddy-Zertifikat schlägt fehl

```sh
docker compose logs caddy
# DNS-Propagation prüfen:
nslookup foundry.deinedomain.de
# Ports 80 und 443 müssen von außen erreichbar sein
```

### Backup schlägt fehl

```sh
docker compose logs backup
# SSH-Verbindung zum Backup-Repo testen:
docker compose exec backup ssh -T git@github.com
```

### FoundryVTT startet nicht

```sh
docker compose logs foundry
# Häufige Ursache: foundryvtt.zip fehlt oder ist fehlerhaft
```

---

## Nach dem ersten Start: laufender Betrieb

| Aufgabe | Befehl |
|---------|--------|
| Alle Container starten | `docker compose up -d` |
| Alle Container stoppen | `docker compose down` |
| FoundryVTT aktualisieren | s. `README.md` → *Update FoundryVTT* |
| Logs einsehen | `docker compose logs -f [service]` |
| Backup manuell auslösen | `docker compose exec backup /usr/local/bin/backup.sh` |
