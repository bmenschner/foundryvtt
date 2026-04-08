# Documentation
https://foundryvtt.com/article/installation/

# What?
- A Docker Container to run FoundryVTT on a shared Hosting Environment.
- Downloads the latest stable version of FoundryVTT from https://foundryvtt.com/releases/ on build time.
- It uses a volume to store the data, so it persists across container restarts.
- The Data folder can be backed up by pushing it to a git repository.
- App Data is stored inside the container.
- It uses a reverse proxy (nginx) to serve the application on a custom domain.

# Environment
- Docker
- Nodejs

# Artifcats
- foundryvtt.zip

# Technical Details
- Download the latest foundryvtt.zip from https://foundryvtt.com/releases/
- run `docker compose build` to build the image.
- run `docker-compose up -d to start the application.
- run `docker-compose down` to stop the application.

# Update
- run `docker-compose down` to stop the application.
- run `docker compose build` to build the new image.
- run `docker-compose up -d` to start the application.

# Backup
- Backups are automated via a cronjob on the host system.
- Backups are saved on github.com/menschner/foundryvtt-backups

# SSL / HTTPS (Let's Encrypt)

The SSL certificate is **not** generated automatically on first start. This is a classic chicken-and-egg problem: nginx needs a certificate to start, but Certbot needs a running nginx to verify domain ownership.

The `init-letsencrypt.sh` script solves this once:
1. Creates a temporary dummy certificate so nginx can start
2. Starts nginx so the ACME challenge endpoint (`/.well-known/acme-challenge/`) is reachable
3. Requests a real Let's Encrypt certificate for the domain
4. Removes the dummy, reloads nginx with the real certificate

**This script only needs to be run once** – on initial server setup, after DNS is pointing to the server:

```sh
chmod +x init-letsencrypt.sh
./init-letsencrypt.sh
```

After that, everything is fully automatic:
- The Certbot container checks for renewal every **12 hours**
- nginx reloads every **6 hours** to pick up renewed certificates
- No manual intervention needed, even after server reboots