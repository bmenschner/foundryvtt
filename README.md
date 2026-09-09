# 🎲 FoundryVTT – Self-hosted Docker Setup

Self-hosted [FoundryVTT](https://foundryvtt.com) via Docker with automated HTTPS, reverse proxy, and daily backups to GitHub.

---

## Datenverzeichnis nach der Volume-Migration

Foundry und der Backup-Dienst verwenden jetzt gemeinsam `./data` auf dem Host.
Foundry-Welten liegen unter `data/Data/worlds`, Module unter `data/Data/modules`.
Das Verzeichnis muss vor dem Start existieren und die migrierten Daten enthalten.
`create_host_path: false` verhindert die automatische Anlage eines leeren Ordners.
Bei einer Neuinstallation den Ordner vor dem ersten Start mit `mkdir data` anlegen.
Bestehende Installationen zuerst bei gestoppten Diensten vollständig sichern,
kopieren und prüfen; ein leerer Ordner ersetzt keine Datenmigration.
Das alte benannte Volume vorerst als Sicherung behalten, kein `down -v` ausführen.
Nach neuen Spielständen ist das alte Volume veraltet und kein verlustfreier Rückweg.

Reine Compose-Änderungen lösen im Deployment keinen Image-Build mehr aus.
Änderungen an Build-Argumenten oder der gewünschten Foundry-Version benötigen
jetzt einen bewusst ausgeführten Build. `up` läuft mit `--no-build`.
Vor dem nächsten Build eine passende `.dockerignore` sicherstellen, die `.env`,
`data/`, `migration-*/`, `_old/` und `.git/` ausschließt: Der Dockerfile kopiert den
Build-Kontext. Migrationssicherungen gehören weder in Git noch in Images.
Die älteren Setup-/Deployment-Beispiele weiter unten berücksichtigen diese
Umstellung noch nicht vollständig.

## Eigene Module

Eigene Module werden aus `modules/` über die vorhandene Deployment-Action installiert.
Änderungen werden vorab geprüft; vorhandene Modulversionen werden gesichert.
Bei geänderten Modulen startet Foundry kurz neu.
Details: [Eigene Module verwalten](docs/managed-modules.md).

## Architecture

```
Internet
   │
   ▼ :80 / :443
┌─────────────┐
│    Caddy    │  Reverse proxy, automatic HTTPS (Let's Encrypt)
└──────┬──────┘
       │ :30000 (internal)
┌──────▼──────┐
│  FoundryVTT │  App container (Node.js 24)
└─────────────┘

┌─────────────┐
│   Backup    │  Pushes data/ to GitHub daily via SSH
└─────────────┘
```

**Repositories:**
- [`bmenschner/foundryvtt`](https://github.com/bmenschner/foundryvtt) – project code (Dockerfile, Caddy, scripts)
- [`bmenschner/foundryvtt-backups`](https://github.com/bmenschner/foundryvtt-backups) – user data (`data/`) only

---

## Prerequisites

Before you start, make sure you have the following ready:

| What | Notes |
|---|---|
| Server with public IP | e.g. Hetzner, DigitalOcean, Netcup |
| Ports **80** and **443** open | in the server firewall |
| DNS record pointing to the server | `foundry.yourdomain.com → <server-ip>`, fully propagated |
| **Docker** and **Docker Compose** installed | `docker --version` and `docker compose version` |
| **Git** installed | `git --version` |
| FoundryVTT account with a valid license | [foundryvtt.com](https://foundryvtt.com) |

---

## Initial Setup

### Step 1 – Get the project onto the server

The project uses SSH authentication for Git. Set up a key on the server once so `git clone` works without a password.

```sh
# Generate an SSH key on the server
ssh-keygen -t ed25519 -C "your-server-name" -f ~/.ssh/id_ed25519 -N ""

# Show the public key and copy the output
cat ~/.ssh/id_ed25519.pub
```

Add the public key to GitHub:
→ **github.com → Settings → SSH and GPG keys → New SSH key**

Test the connection:
```sh
ssh -T git@github.com
# Expected: Hi bmenschner! You've successfully authenticated...
```

Now clone the project:
```sh
git clone git@github.com:bmenschner/foundryvtt.git ~/foundry
cd ~/foundry
```

---

### Step 2 – Configure `.env`

```sh
cp .env.example .env
nano .env
```

Fill in your values:

```dotenv
# Your foundryvtt.com account credentials (used to download Foundry during build)
FOUNDRY_USERNAME=your-foundry-username
FOUNDRY_PASSWORD=your-foundry-password
FOUNDRY_VERSION=13.351          # 13.x = last version with German translation

# Your domain
DOMAIN=foundry.yourdomain.com

# Backup settings
BACKUP_REPO=git@github.com:youruser/foundryvtt-backups.git
BACKUP_SCHEDULE=0 3 * * *       # daily at 03:00
BACKUP_BRANCH=main
BACKUP_GIT_EMAIL=your@email.com
BACKUP_SSH_KEY=<base64-encoded-private-key>   # see Step 3
```

> ⚠️ Never commit `.env` to a public repository. It contains secrets.

---

### Step 3 – Set up SSH deploy key for backups

The backup container pushes your Foundry data to a private GitHub repo every night.
To authenticate, it needs a dedicated SSH deploy key – stored **Base64-encoded** in `.env` (no file mounts, no secrets in the image).

**3a – Generate the key pair**

```sh
ssh-keygen -t ed25519 -C "foundryvtt-backup" -f /tmp/backup_key -N ""
```

**3b – Base64-encode and add to `.env`**

```sh
# This outputs one long line – copy it entirely
base64 -w 0 /tmp/backup_key
```

Paste the output into `.env`:
```dotenv
BACKUP_SSH_KEY=LS0tLS1CRUdJTiBPUEVOU1NI...   # your full Base64 string, no line breaks
```

> ⚠️ Delete the temp files afterwards: `rm /tmp/backup_key /tmp/backup_key.pub`

**3c – Add the public key to GitHub as a Deploy Key**

```sh
cat /tmp/backup_key.pub   # copy this before deleting the files
```

Go to the **backup repository** on GitHub:
→ `github.com/<youruser>/foundryvtt-backups` → **Settings → Deploy Keys → Add deploy key**
→ Paste the public key, enable ✅ **Allow write access**, save.

**3d – Create the backup repository**

The target repo (`BACKUP_REPO`) must already exist on GitHub with at least one commit.
If it doesn't exist yet, create it on github.com with a blank README, then come back here.

---

### Step 4 – Build the Docker images

```sh
docker compose build
```

FoundryVTT is downloaded automatically during the build using the credentials from `.env`.

If the automatic download fails (e.g. due to Foundry API changes), place a manually downloaded
`foundryvtt.zip` (Linux/Node.js build) into the project root as a fallback:

```sh
# On your local machine:
scp ~/Downloads/foundryvtt-13.351.zip user@your-server:~/foundry/foundryvtt.zip
```

> The file must be named exactly `foundryvtt.zip`.

---

### Step 5 – Start the stack

```sh
docker compose up -d
```

Check that all three containers are running:

```sh
docker compose ps
```

| Container | Expected status |
|---|---|
| `foundryvtt` | Up |
| `foundry-caddy` | Up |
| `foundry-backup` | Up |

Caddy automatically obtains an SSL certificate from Let's Encrypt on first start – no extra steps needed.

**Watch the logs in real time:**

```sh
docker compose logs -f foundry   # FoundryVTT app
docker compose logs -f caddy     # Caddy (HTTPS & proxy)
docker compose logs -f backup    # Backup container
```

---

### Step 6 – First browser setup

Open your browser and go to:
```
https://foundry.yourdomain.com
```

On first start you will be prompted to:
1. Enter your **license key** (find it at https://foundryvtt.com/me/licenses/)
2. Accept the license agreement
3. Set an **admin password** (Settings → Configure → Administrator Password)

> ⚠️ Note the admin password somewhere safe – there is no easy reset.

---

### Step 7 – Verify the backup

The first automatic backup runs according to `BACKUP_SCHEDULE` (default: daily at 03:00).
To trigger a backup immediately and verify everything works:

```sh
./backup.sh
# or directly:
docker compose exec backup /usr/local/bin/backup.sh
```

Then check the backup repository on GitHub for a new commit.

---

## Day-to-day Operations

### Update FoundryVTT

```sh
docker compose down

# 1. Update FOUNDRY_VERSION in .env
# 2. Optionally place a new foundryvtt.zip in the project root
docker compose build --no-cache
docker compose up -d
```

### Local access (without SSL)

Port 30000 is bound to `127.0.0.1` only – not reachable from the internet directly.
Use an SSH tunnel to test locally without HTTPS:

```sh
ssh -L 30000:localhost:30000 user@your-server
```

Then open `http://localhost:30000` in your browser.

### Manual backup

```sh
./backup.sh
```

### Logs

```sh
docker compose logs -f foundry   # FoundryVTT
docker compose logs -f caddy     # Caddy (HTTPS & proxy)
docker compose logs -f backup    # Backup
```

---

## Backup & Restore

User data (`data/`) is automatically pushed to [`bmenschner/foundryvtt-backups`](https://github.com/bmenschner/foundryvtt-backups) daily at 03:00.

### Restore

```sh
# List available snapshots (commits)
docker compose exec backup /usr/local/bin/restore.sh --list

# Restore the latest snapshot
docker compose stop foundry
docker compose exec backup /usr/local/bin/restore.sh
docker compose start foundry

# Restore a specific snapshot
docker compose stop foundry
docker compose exec backup /usr/local/bin/restore.sh <commit-hash>
docker compose start foundry
```

> Always stop FoundryVTT before restoring to avoid data corruption. The restore script asks for confirmation.

---

## Automated Deployment (GitHub Actions)

Every push to `main` automatically deploys to the server via SSH.
Pushes that only change documentation (`*.md`) are skipped.

**What happens on each deploy:**
1. GitHub detects a push to `main`
2. If `Dockerfile`, `Caddyfile`, or `docker-compose.yml` changed → `docker compose build`
3. `git pull origin main` on the server
4. `docker compose up -d`

### One-time setup: Deploy SSH key

Generate a dedicated key pair on your **local machine** (not the server):

```sh
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy -N ""
```

Add the public key to the server's `authorized_keys`:

```sh
cat ~/.ssh/github_deploy.pub
# On the server:
echo "<paste public key>" >> ~/.ssh/authorized_keys
```

Add the private key as GitHub Secrets:
→ `github.com/bmenschner/foundryvtt` → **Settings → Secrets and variables → Actions**

| Secret | Value |
|---|---|
| `DEPLOY_HOST` | Server IP or domain |
| `DEPLOY_SSH_KEY` | Contents of `~/.ssh/github_deploy` (private key) |

---

## Troubleshooting

| Symptom | What to check |
|---|---|
| HTTPS not working | DNS propagation: `nslookup foundry.yourdomain.com`; ports 80/443 open? |
| Caddy certificate error | `docker compose logs caddy`; Let's Encrypt rate limits may apply |
| Backup fails | `docker compose logs backup`; test SSH: `docker compose exec backup ssh -T git@github.com` |
| FoundryVTT won't start | `docker compose logs foundry`; verify `foundryvtt.zip` is valid |
| `base64: truncated input` | `BACKUP_SSH_KEY` in `.env` is incomplete – re-run `base64 -w 0 /tmp/backup_key` |

---

## Notes

- **License binding:** The `hostname` in `docker-compose.yml` must stay `foundryvtt`. Foundry binds the license to it – changing it requires re-activating the license.
- **WebSocket:** Caddy proxies WebSocket connections automatically – no extra configuration needed.
- **Certificates:** Caddy acquires and renews Let's Encrypt certificates automatically. Stored in the `caddy_data` named volume – don't delete it.
- **SSH deploy key:** Stored Base64-encoded in `BACKUP_SSH_KEY` (`.env`) and written to `/tmp` at container startup. It is never baked into the image and requires no file mounts.
- **`data/` directory:** Contains all Foundry user data (worlds, modules, systems). Backed up nightly. Never delete it without a verified backup.
