FROM node:24-alpine

# ── System-Abhängigkeiten ───────────────────────────────────────────────────
RUN apk add --no-cache unzip curl bash

WORKDIR /foundry/app

# ── Build-Args für optionalen automatischen Download ───────────────────────
# Werden nur zur Build-Zeit genutzt und sind NICHT im Image gespeichert (ARG ≠ ENV)
ARG FOUNDRY_USERNAME=""
ARG FOUNDRY_PASSWORD=""
ARG FOUNDRY_VERSION="13"

# ── Lokales ZIP als Fallback kopieren (falls vorhanden) ────────────────────
COPY . /build-context/

# ── Download via Credentials ODER nutze lokales ZIP ────────────────────────
RUN set -e; \
    DOWNLOAD_OK=false; \
    \
    # ── Versuch: Download via Foundry-Credentials ──────────────────────────\
    if [ -n "$FOUNDRY_USERNAME" ] && [ -n "$FOUNDRY_PASSWORD" ]; then \
      echo "━━━ Versuche Download via Account-Credentials ━━━"; \
      \
      # CSRF-Token aus Login-Seite extrahieren (mehrere grep-Muster als Fallback)
      CSRF=$(curl -sv -c /tmp/cookies.txt "https://foundryvtt.com/auth/login/" 2>/tmp/curl_debug.txt \
        | grep -oP 'csrfmiddlewaretoken["\s]+value[="\s]+\K[^"]+' \
        | head -1); \
      if [ -z "$CSRF" ]; then \
        CSRF=$(grep -oP 'csrftoken=\K[^;]+' /tmp/cookies.txt 2>/dev/null | head -1); \
      fi; \
      echo "  CSRF-Token: ${CSRF:0:10}..."; \
      \
      # Login (Cookie-Session aufbauen)
      curl -s -b /tmp/cookies.txt -c /tmp/cookies.txt \
        -H "Referer: https://foundryvtt.com/auth/login/" \
        -H "Origin: https://foundryvtt.com" \
        --data-urlencode "csrfmiddlewaretoken=${CSRF}" \
        --data-urlencode "login_password=${FOUNDRY_PASSWORD}" \
        --data-urlencode "login_username=${FOUNDRY_USERNAME}" \
        --data-urlencode "login=true" \
        "https://foundryvtt.com/auth/login/" -o /tmp/login_response.html; \
      \
      # Prüfe ob Login erfolgreich (Redirect zu /me/ oder Dashboard)
      if grep -qi "logout\|Abmelden\|dashboard\|Hello" /tmp/login_response.html 2>/dev/null \
         || grep -q "sessionid" /tmp/cookies.txt 2>/dev/null; then \
        echo "  ✓ Login erfolgreich"; \
        \
        # Timed URL abrufen (folgt S3-Redirect automatisch)
        curl -L -b /tmp/cookies.txt -c /tmp/cookies.txt \
          -H "Referer: https://foundryvtt.com/community/${FOUNDRY_USERNAME}/licenses" \
          "https://foundryvtt.com/releases/download?version=${FOUNDRY_VERSION}&platform=linux" \
          -o /tmp/foundryvtt.zip \
          --write-out "HTTP-Status: %{http_code}, Größe: %{size_download} Bytes\n"; \
        \
        # ZIP-Validierung: Prüfe Magic-Bytes (ZIP beginnt mit PK\x03\x04)
        if [ -f /tmp/foundryvtt.zip ] && \
           [ "$(od -An -tx1 -N4 /tmp/foundryvtt.zip | tr -d ' \n')" = "504b0304" ]; then \
          echo "  ✓ Gültiges ZIP heruntergeladen"; \
          DOWNLOAD_OK=true; \
        else \
          echo "  ✗ Download lieferte kein gültiges ZIP (möglicherweise HTML-Fehlerseite)"; \
          echo "  → Erste Zeile der Antwort:"; \
          head -1 /tmp/foundryvtt.zip 2>/dev/null || true; \
          rm -f /tmp/foundryvtt.zip; \
        fi; \
      else \
        echo "  ✗ Login fehlgeschlagen (falsche Credentials oder CSRF-Problem)"; \
      fi; \
      rm -f /tmp/cookies.txt /tmp/login_response.html /tmp/curl_debug.txt; \
    fi; \
    \
    # ── Fallback: Lokales ZIP verwenden ───────────────────────────────────\
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
    # ── Entpacken ─────────────────────────────────────────────────────────\
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
