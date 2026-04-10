# ── Stage 1: Builder (Lädt Foundry herunter) ────────────────────────────────
FROM node:24-alpine AS builder

RUN apk add --no-cache unzip curl bash

WORKDIR /foundry/app

# Credentials werden nur hier verwendet und landen nicht im finalen Image
ARG FOUNDRY_USERNAME=""
ARG FOUNDRY_PASSWORD=""
ARG FOUNDRY_VERSION="13.351"

# Nur die relevanten Skripte kopieren (dank .dockerignore ohne .env)
COPY . /build-context/

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
      if [ -f /tmp/foundryvtt.zip ] \
         && \
         [ "$(od -An -tx1 -N4 /tmp/foundryvtt.zip | tr -d ' \n')" = "504b0304" ]; then \
        echo "  ✓ Gültiges ZIP heruntergeladen"; \
        DOWNLOAD_OK=true; \
      else \
        echo "  ✗ Download lieferte kein gültiges ZIP"; \
        rm -f /tmp/foundryvtt.zip; \
      fi; \
    else \
      echo "  ✗ Login oder URL-Abruf fehlgeschlagen"; \
    fi; \
  fi; \
  \
  if [ "$DOWNLOAD_OK" = "false" ]; then \
    if ls /build-context/foundryvtt*.zip 1>/dev/null 2>&1; then \
      echo "━━━ Nutze lokales foundryvtt.zip als Fallback ━━━"; \
      cp /build-context/foundryvtt*.zip /tmp/foundryvtt.zip; \
      DOWNLOAD_OK=true; \
    else \
      echo "✗ FEHLER: Download fehlgeschlagen und kein lokales foundryvtt.zip gefunden!"; \
      exit 1; \
    fi; \
  fi; \
  \
  echo "━━━ Entpacke foundryvtt.zip ━━━"; \
  unzip -q /tmp/foundryvtt.zip -d /foundry/app; \
  rm -f /tmp/foundryvtt.zip; \
  echo "✓ FoundryVTT verarbeitet."

# ── Stage 2: Production Runtime (Sicher, minimal, non-root) ──────────────────
FROM node:24-alpine

# su-exec für sicheres Droppen von Root-Rechten installieren
RUN apk add --no-cache su-exec && \
    mkdir -p /foundry/data && \
    chown -R node:node /foundry

# Foundry-Software von Stage 1 holen (die Passwörter/ARG bleiben in Stage 1 versteckt)
COPY --from=builder --chown=node:node /foundry/app /foundry/app

# Non-Root Entrypoint-Skript hereinziehen
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

VOLUME ["/foundry/data"]
EXPOSE 30000

# Nutze Entrypoint (wird als Root gestartet, setzt UID und wechselt dann auf Node)
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

CMD ["node", "/foundry/app/main.js", \
  "--dataPath=/foundry/data", \
  "--port=30000", \
  "--headless"]
