FROM node:24-alpine

# ── System-Abhängigkeiten ───────────────────────────────────────────────────
RUN apk add --no-cache unzip curl bash

WORKDIR /foundry/app

# ── Build-Args für Download ─────────────────────────────────────────────────
# Option A: Credentials (Username + Password von foundryvtt.com)
#           → Download läuft vollautomatisch via JSON-API (wie felddy/foundryvtt-docker)
# Option B: Lokales foundryvtt.zip neben dem Dockerfile ablegen
#           → ZIP aus Build-Context kopiert (zuverlässiger Fallback)
ARG FOUNDRY_USERNAME=""
ARG FOUNDRY_PASSWORD=""
ARG FOUNDRY_VERSION="13.351"

# ── Build-Context kopieren (enthält ZIP-Fallback + Download-Script) ─────────
COPY . /build-context/

# ── Download via Credentials ODER nutze lokales ZIP ────────────────────────
# Das get_release_url.js Script:
#   1. Holt CSRF-Token via node built-ins (kein grep -P, kein BusyBox-Problem)
#   2. Loggt sich ein und holt Presigned S3-URL via JSON-API
#   3. Gibt URL auf stdout aus → curl lädt ZIP herunter
RUN set -e; \
  DOWNLOAD_OK=false; \
  \
  if [ -n "$FOUNDRY_USERNAME" ] && [ -n "$FOUNDRY_PASSWORD" ]; then \
  echo "━━━ Versuche Download via Account-Credentials ━━━"; \
  PRESIGNED_URL=$(node /build-context/get_release_url.js \
  "$FOUNDRY_USERNAME" "$FOUNDRY_PASSWORD" "$FOUNDRY_VERSION" 2>/tmp/get_url.log) || true; \
  if [ -n "$PRESIGNED_URL" ]; then \
  echo "  ✓ Presigned URL erhalten"; \
  curl -L "$PRESIGNED_URL" \
  -o /tmp/foundryvtt.zip \
  --write-out "HTTP-Status: %{http_code}, Größe: %{size_download} Bytes\n"; \
  if [ -f /tmp/foundryvtt.zip ] && \
  [ "$(od -An -tx1 -N4 /tmp/foundryvtt.zip | tr -d ' \n')" = "504b0304" ]; then \
  echo "  ✓ Gültiges ZIP heruntergeladen"; \
  DOWNLOAD_OK=true; \
  else \
  echo "  ✗ Download lieferte kein gültiges ZIP"; \
  head -1 /tmp/foundryvtt.zip 2>/dev/null || true; \
  rm -f /tmp/foundryvtt.zip; \
  fi; \
  else \
  echo "  ✗ Login oder URL-Abruf fehlgeschlagen:"; \
  cat /tmp/get_url.log || true; \
  fi; \
  fi; \
  \
  # ── Fallback: Lokales ZIP verwenden ────────────────────────────────────\
  if [ "$DOWNLOAD_OK" = "false" ]; then \
  if ls /build-context/foundryvtt*.zip 1>/dev/null 2>&1; then \
  echo "━━━ Nutze lokales foundryvtt.zip als Fallback ━━━"; \
  cp /build-context/foundryvtt*.zip /tmp/foundryvtt.zip; \
  DOWNLOAD_OK=true; \
  else \
  echo "✗ FEHLER: Download fehlgeschlagen und kein lokales foundryvtt.zip gefunden!"; \
  echo "  Optionen:"; \
  echo "  1) FOUNDRY_USERNAME + FOUNDRY_PASSWORD in .env korrekt setzen"; \
  echo "  2) foundryvtt.zip lokal neben dem Dockerfile ablegen"; \
  exit 1; \
  fi; \
  fi; \
  \
  # ── Entpacken ──────────────────────────────────────────────────────────\
  echo "━━━ Entpacke foundryvtt.zip ━━━"; \
  unzip -q /tmp/foundryvtt.zip -d /foundry/app; \
  rm -f /tmp/foundryvtt.zip; \
  rm -rf /build-context; \
  echo "✓ FoundryVTT erfolgreich installiert."

# ── Daten-Volume (Welten, Module, Systeme – persistent) ────────────────────
VOLUME ["/foundry/data"]

EXPOSE 30000

# ── Start: Headless-Modus, Daten im Volume ─────────────────────────────────
CMD ["node", "/foundry/app/main.js", \
  "--dataPath=/foundry/data", \
  "--port=30000", \
  "--headless"]
