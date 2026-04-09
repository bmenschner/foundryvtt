# FoundryVTT – Self-hosted Docker Setup

Self-hosted [FoundryVTT](https://foundryvtt.com) via Docker with automated HTTPS, reverse proxy, and daily backups.

## Architecture

```
Internet
   │
   ▼ :80 / :443
┌─────────────┐
│    nginx    │  Reverse proxy, SSL termination
└──────┬──────┘
       │ :30000 (internal)
┌──────▼──────┐
│  FoundryVTT │  App container (Node.js 24)
└─────────────┘

┌─────────────┐
│   Certbot   │  Auto-renews Let's Encrypt certificates every 12h
└─────────────┘

┌─────────────┐
│   Backup    │  Pushes data/ to GitHub daily via SSH
└─────────────┘
```

**Repositories:**
- [`bmenschner/foundryvtt`](https://github.com/bmenschner/foundryvtt) – project code (Dockerfile, nginx, scripts)
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
If the download fails, place `foundryvtt.zip` (Linux/Node.js build) in the project root as a fallback.

### 5. Initialize SSL *(once only)*

```sh
chmod +x init-letsencrypt.sh
./init-letsencrypt.sh
```

This resolves the chicken-and-egg problem between nginx and Certbot by creating a temporary dummy certificate, then replacing it with a real Let's Encrypt certificate. Only needed once – renewal is fully automatic afterwards.

### 6. Start

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

### Logs

```sh
docker compose logs -f foundry   # FoundryVTT
docker compose logs -f nginx     # nginx
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
| nginx won't start | Run `init-letsencrypt.sh` first; check `docker compose logs nginx` |
| Certbot fails | Verify DNS propagation: `nslookup foundry.yourdomain.com`; confirm ports 80/443 are open |
| Backup fails | Check SSH key: `docker compose exec backup ssh -T git@github.com` |
| FoundryVTT won't start | Check `docker compose logs foundry`; verify `foundryvtt.zip` is valid |

---

## Notes

- **License binding:** The container `hostname` in `docker-compose.yml` must stay constant (`foundryvtt`). Foundry binds the license to it.
- **WebSocket:** nginx forwards `Upgrade` and `Connection: upgrade` headers – required for real-time gameplay.
- **Certificates:** Auto-renewed every 12h by Certbot; nginx reloads every 6h to pick them up.
- **SSH key:** The deploy key is mounted read-only (`:ro`) – the backup script copies it to `/tmp` before use.