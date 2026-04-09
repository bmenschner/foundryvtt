# FoundryVTT – Self-hosted Docker Setup

Self-hosted [FoundryVTT](https://foundryvtt.com) via Docker with automated HTTPS, reverse proxy, and daily backups.

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

- Server with public IP, ports **80** and **443** open
- DNS record pointing to the server (propagated)
- Docker & Docker Compose installed
- FoundryVTT account with a valid license

---

## Initial Setup

### 1. Clone the project

```sh
git clone git@github.com:bmenschner/foundryvtt.git ~/foundry
cd ~/foundry
```

### 2. Configure `.env`

```sh
nano .env
```

```dotenv
FOUNDRY_USERNAME=your-foundry-username
FOUNDRY_PASSWORD=your-foundry-password
FOUNDRY_VERSION=13.351          # 13.x = last version with German translation

DOMAIN=foundry.yourdomain.com

BACKUP_REPO=git@github.com:youruser/foundryvtt-backups.git
BACKUP_SCHEDULE=0 3 * * *
BACKUP_BRANCH=main
BACKUP_GIT_EMAIL=your@email.com
```

> ⚠️ Never commit `.env` to a public repository.

### 3. Set up SSH deploy key for backups

```sh
mkdir -p backup/ssh
ssh-keygen -t ed25519 -C "foundryvtt-backup" -f backup/ssh/backup_key -N ""
cat backup/ssh/backup_key.pub  # copy this output
```

Add the public key to GitHub: `foundryvtt-backups` → **Settings → Deploy Keys → Add** (✅ Allow write access).

The backup target repository must already exist on GitHub with at least one commit.

### 4. Build the images

```sh
docker compose build
```

FoundryVTT is downloaded automatically during build using the credentials from `.env`.
If the download fails, place `foundryvtt.zip` (Linux/Node.js build) in the project root as a fallback:

```sh
scp ~/Downloads/foundryvtt-13.351.zip user@your-server:~/foundry/foundryvtt.zip
```

> The file must be named exactly `foundryvtt.zip`.

### 5. Start

```sh
docker compose up -d
docker compose ps   # all containers should show "Up"
```

Open `https://foundry.yourdomain.com` in a browser, enter your license key, and set an admin password.

---

## Operations

### Update FoundryVTT

```sh
docker compose down
# Update FOUNDRY_VERSION in .env, then place new foundryvtt.zip (or use credentials)
docker compose build --no-cache
docker compose up -d
```

### Local access (without SSL)

Port 30000 is bound to `127.0.0.1` only – not reachable from the internet. Use an SSH tunnel to access it locally:

```sh
ssh -L 30000:localhost:30000 user@your-server
```

Then open `http://localhost:30000` in your browser.

### Logs

```sh
docker compose logs -f foundry   # FoundryVTT
docker compose logs -f caddy     # Caddy (HTTPS & proxy)
docker compose logs -f backup    # Backup
```

---

## Backup & Restore

User data (`data/`) is automatically pushed to [`bmenschner/foundryvtt-backups`](https://github.com/bmenschner/foundryvtt-backups) daily at 03:00.

### Manual backup

```sh
docker compose exec backup /usr/local/bin/backup.sh
```

### Restore

```sh
# List available snapshots
docker compose exec backup /usr/local/bin/restore.sh --list

# Restore latest snapshot
docker compose stop foundry
docker compose exec backup /usr/local/bin/restore.sh
docker compose start foundry

# Restore specific snapshot
docker compose stop foundry
docker compose exec backup /usr/local/bin/restore.sh <commit-hash>
docker compose start foundry
```

> Stop FoundryVTT before restoring to avoid data corruption. The restore script always asks for confirmation.

---

## Troubleshooting

| Symptom | Check |
|---|---|
| HTTPS not working | Verify DNS propagation: `nslookup foundry.yourdomain.com`; check `docker compose logs caddy` |
| Caddy certificate error | Confirm ports 80/443 are open; Let's Encrypt rate limits may apply |
| Backup fails | Check SSH key: `docker compose exec backup ssh -T git@github.com` |
| FoundryVTT won't start | Check `docker compose logs foundry`; verify `foundryvtt.zip` is valid |

---

## Notes

- **License binding:** The container `hostname` in `docker-compose.yml` must stay constant (`foundryvtt`). Foundry binds the license to it.
- **WebSocket:** Caddy proxies WebSocket connections automatically – no extra headers needed.
- **Certificates:** Caddy acquires and renews Let's Encrypt certificates automatically. Stored in the `caddy_data` named volume.
- **SSH key:** The deploy key is mounted read-only (`:ro`) – the backup script copies it to `/tmp` before use.