FROM node:24-alpine

# ── System-Abhängigkeiten ───────────────────────────────────────────────────
RUN apk add --no-cache unzip curl bash

WORKDIR /foundry/app

# ── Build-Args für Download ─────────────────────────────────────────────────
# Option A: Timed URL (empfohlen) – generieren unter:
#   https://foundryvtt.com/community/<username>/licenses → "Timed URL"
# Option B: Lokales foundryvtt.zip im Projektverzeichnis ablegen
ARG FOUNDRY_TIMED_URL=""

# ── Lokales ZIP als Fallback kopieren (falls vorhanden) ────────────────────
COPY . /build-context/

# ── Download via Timed URL ODER nutze lokales ZIP ──────────────────────────
RUN set -e; \
    DOWNLOAD_OK=false; \
    \
    # ── Versuch A: Download via Timed URL ─────────────────────────────────\
    if [ -n "$FOUNDRY_TIMED_URL" ]; then \
      echo "━━━ Versuche Download via Timed URL ━━━"; \
      curl -L \
        "$FOUNDRY_TIMED_URL" \
        -o /tmp/foundryvtt.zip \
        --write-out "HTTP-Status: %{http_code}, Größe: %{size_download} Bytes\n"; \
      \
      # ZIP-Validierung: Prüfe Magic-Bytes (ZIP beginnt mit PK\x03\x04)
      if [ -f /tmp/foundryvtt.zip ] && \
         [ "$(od -An -tx1 -N4 /tmp/foundryvtt.zip | tr -d ' \n')" = "504b0304" ]; then \
        echo "  ✓ Gültiges ZIP heruntergeladen"; \
        DOWNLOAD_OK=true; \
      else \
        echo "  ✗ Download lieferte kein gültiges ZIP (URL abgelaufen oder ungültig?)"; \
        echo "  → Erste Zeile der Antwort:"; \
        head -1 /tmp/foundryvtt.zip 2>/dev/null || true; \
        rm -f /tmp/foundryvtt.zip; \
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
        echo "✗ FEHLER: Kein Timed URL angegeben und kein lokales foundryvtt.zip gefunden!"; \
        echo "  Optionen:"; \
        echo "  1) Timed URL generieren: https://foundryvtt.com/community/<user>/licenses"; \
        echo "     → docker compose build --build-arg FOUNDRY_TIMED_URL='<url>'"; \
        echo "  2) foundryvtt.zip lokal ablegen (neben dem Dockerfile)"; \
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
