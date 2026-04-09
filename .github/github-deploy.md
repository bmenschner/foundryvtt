# GitHub Actions Deployment – Setup Guide

Dieses Dokument beschreibt, wie das automatische Deployment via GitHub Actions eingerichtet wird.

Bei jedem Push auf `main` verbindet sich GitHub über SSH mit dem Server und führt automatisch `git pull` und `docker compose up -d` aus. Reine Dokumentations-Änderungen (`.md`-Dateien) lösen kein Deployment aus.

---

## Voraussetzungen

- Der Server ist bereits eingerichtet und das Projekt liegt unter `~/foundry` (siehe `README.md`)
- GitHub-Repository: `github.com/bmenschner/foundryvtt` (privat)
- SSH-Zugriff auf den Server (als `root`)

---

## Schritt 1 – Deploy-Key generieren

Erzeuge ein **dediziertes** SSH-Schlüsselpaar speziell für GitHub Actions. Verwende **nicht** den bestehenden Server-Key oder den Backup-Key.

Führe diesen Befehl auf deinem lokalen Rechner aus:

```sh
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy -N ""
```

Das erzeugt:
- `~/.ssh/github_deploy` → **Privater Schlüssel** (kommt als GitHub Secret)
- `~/.ssh/github_deploy.pub` → **Öffentlicher Schlüssel** (kommt auf den Server)

---

## Schritt 2 – Public Key auf den Server kopieren

Zeige den öffentlichen Schlüssel an und kopiere ihn:

```sh
cat ~/.ssh/github_deploy.pub
```

Verbinde dich mit dem Server und füge ihn zu `authorized_keys` hinzu:

```sh
ssh root@your-server
echo "PASTE_YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
```

Prüfe ob der Key korrekt hinterlegt ist:

```sh
cat ~/.ssh/authorized_keys
```

> ⚠️ Die Datei `authorized_keys` darf keine Zeilenumbrüche **innerhalb** eines Keys haben. Jeder Key steht auf einer eigenen Zeile.

---

## Schritt 3 – GitHub Secrets anlegen

Öffne im Browser:
`github.com/bmenschner/foundryvtt` → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Lege folgende zwei Secrets an:

### `DEPLOY_HOST`

| Feld | Wert |
|---|---|
| Name | `DEPLOY_HOST` |
| Secret | IP-Adresse oder Domain des Servers (z.B. `123.456.78.9` oder `foundry.bastianmenschner.de`) |

### `DEPLOY_SSH_KEY`

| Feld | Wert |
|---|---|
| Name | `DEPLOY_SSH_KEY` |
| Secret | Gesamter Inhalt der Datei `~/.ssh/github_deploy` (privater Schlüssel, **inklusive** der `-----BEGIN...` und `-----END...` Zeilen) |

Den privaten Schlüssel anzeigen:

```sh
cat ~/.ssh/github_deploy
```

---

## Schritt 4 – Verbindung testen (optional)

Teste vom lokalen Rechner aus, ob GitHub Actions sich damit in den Server einloggen kann:

```sh
ssh -i ~/.ssh/github_deploy root@your-server "echo 'SSH-Verbindung erfolgreich'"
```

Erwartete Ausgabe: `SSH-Verbindung erfolgreich`

---

## Schritt 5 – Ersten Deploy auslösen

Committe und pushe eine beliebige Code-Änderung auf `main`:

```sh
git commit --allow-empty -m "ci: trigger first deployment"
git push
```

Öffne dann:
`github.com/bmenschner/foundryvtt` → **Actions**

Du siehst den laufenden Workflow. Bei Erfolg erscheint ein grüner Haken ✅.

---

## Wie das Deployment intern funktioniert

```
Push auf main
     │
     ▼
[GitHub Actions Runner]
  1. Checkout (fetch-depth: 2)
  2. Prüfe geänderte Dateien:
     - Dockerfile / Caddyfile / docker-compose.yml → needs_rebuild=true
     - Alles andere                                → needs_rebuild=false
  3. SSH-Verbindung zum Server
     │
     ▼
[Remote Server ~/foundry]
  4. git pull origin main
  5. (falls needs_rebuild=true) docker compose build
  6. docker compose up -d
```

---

## Was löst einen Docker-Rebuild aus?

| Datei geändert | Rebuild? |
|---|---|
| `Dockerfile` | ✅ Ja |
| `backup/Dockerfile` | ✅ Ja |
| `Caddyfile` | ✅ Ja |
| `docker-compose.yml` | ✅ Ja |
| `backup/backup.sh` | ✅ Ja (per `COPY` ins Image gebacken) |
| `backup/restore.sh` | ✅ Ja (per `COPY` ins Image gebacken) |
| `README.md`, `*.md` | ❌ Kein Deployment |

---

## Troubleshooting

### Workflow läuft nicht an

- Prüfe ob `paths-ignore` greift: Wurde wirklich eine Code-Datei geändert?
- Prüfe im Tab **Actions** ob der Workflow vom Branch `main` getriggert wurde

### SSH-Fehler: `Permission denied (publickey)`

1. Prüfe ob der Public Key korrekt in `~/.ssh/authorized_keys` auf dem Server steht
2. Prüfe ob `DEPLOY_SSH_KEY` den **privaten** Key enthält (mit Begin/End-Zeilen)
3. Teste manuell: `ssh -i ~/.ssh/github_deploy root@your-server`

### `git pull` schlägt fehl auf dem Server

- Der Server-User braucht SSH-Zugriff auf GitHub (Deploy Key im Code-Repo)
- Prüfe: `ssh -T git@github.com` auf dem Server

### `docker compose build` schlägt fehl

- FoundryVTT-Credentials in `.env` prüfen (`FOUNDRY_USERNAME`, `FOUNDRY_PASSWORD`)
- Logs: `docker compose logs foundry`
