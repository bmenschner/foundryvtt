#!/bin/bash
# ============================================================================
# init-letsencrypt.sh
# Einmalig ausführen vor dem ersten `docker compose up -d`
#
# Voraussetzungen:
#   1. DNS: foundry.bastianmenschner.de → Server-IP (bereits propagiert)
#   2. Ports 80 + 443 sind auf dem Server offen
#   3. .env ist befüllt (FOUNDRY_USERNAME, FOUNDRY_PASSWORD)
#   4. `docker compose build` wurde bereits ausgeführt
# ============================================================================

set -e

DOMAIN="foundry.bastianmenschner.de"
EMAIL="bastian@menschner.de"   # E-Mail für Let's Encrypt Ablauf-Benachrichtigungen
RSA_KEY_SIZE=4096
NGINX_TEMPLATE="nginx/foundry.conf.template"
NGINX_ACTIVE="nginx/default.conf"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " FoundryVTT – Let's Encrypt Initialisierung"
echo " Domain: $DOMAIN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Sicherheitscheck: Template muss vorhanden sein
if [ ! -f "$NGINX_TEMPLATE" ]; then
  echo "✗ FEHLER: $NGINX_TEMPLATE nicht gefunden!"
  exit 1
fi

# ── 1. Verzeichnisse anlegen ────────────────────────────────────────────────
echo
echo "▶ Lege Verzeichnisse an..."
mkdir -p certbot/conf/live/"$DOMAIN" certbot/www nginx

# ── 2. SSL-Basis-Dateien von Certbot herunterladen ─────────────────────────
echo
echo "▶ Lade empfohlene TLS-Parameter herunter..."
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
    -o certbot/conf/options-ssl-nginx.conf
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem \
    -o certbot/conf/ssl-dhparams.pem

# ── 3. Dummy-Zertifikat erstellen (nginx braucht ein Zertifikat zum Starten) ─
echo
echo "▶ Erstelle temporäres Dummy-Zertifikat für $DOMAIN..."
docker compose run --rm --entrypoint \
    "openssl req -x509 -nodes -newkey rsa:1024 -days 1 \
     -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem \
     -out    /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
     -subj   '/CN=localhost'" \
    certbot

# ── 4. nginx mit HTTPS-Template starten (Dummy-Zertifikat) ─────────────────
echo
echo "▶ Aktiviere HTTPS-Konfiguration (aus Template) und starte nginx..."
# Template → aktive Konfiguration kopieren
# (foundry.conf.template wird von nginx NICHT geladen – nur *.conf-Dateien)
cp "$NGINX_TEMPLATE" "$NGINX_ACTIVE"
docker compose up --force-recreate -d nginx
sleep 5   # nginx Zeit zum Starten geben

# ── 5. Dummy-Zertifikat löschen ─────────────────────────────────────────────
echo
echo "▶ Lösche Dummy-Zertifikat..."
docker compose run --rm --entrypoint \
    "rm -rf /etc/letsencrypt/live/$DOMAIN \
             /etc/letsencrypt/archive/$DOMAIN \
             /etc/letsencrypt/renewal/$DOMAIN.conf" \
    certbot

# ── 6. Echtes Let's Encrypt Zertifikat beantragen ──────────────────────────
echo
echo "▶ Beantrage Let's Encrypt Zertifikat für $DOMAIN..."
docker compose run --rm --entrypoint \
    "certbot certonly --webroot \
     -w /var/www/certbot \
     --email $EMAIL \
     -d $DOMAIN \
     --rsa-key-size $RSA_KEY_SIZE \
     --agree-tos \
     --no-eff-email \
     --force-renewal" \
    certbot

# ── 7. nginx neu laden mit echtem Zertifikat ───────────────────────────────
echo
echo "▶ Lade nginx neu (echtes Zertifikat)..."
docker compose exec nginx nginx -s reload

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " ✅  Fertig! Zertifikat erfolgreich ausgestellt."
echo ""
echo "  Nächste Schritte:"
echo "  1. docker compose up -d"
echo "  2. https://$DOMAIN im Browser öffnen"
echo "  3. Foundry-Lizenzschlüssel eingeben"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
