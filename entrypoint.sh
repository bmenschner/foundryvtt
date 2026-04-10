#!/bin/sh
set -e

# ============================================================================
# entrypoint.sh – Wrapper für Non-Root Execution
# 
# Da das Laufwerk "data/" oft mit Root-Rechten vom Host erstellt wird,
# korrigiert dieses Skript beim Start die Eigentumsrechte (chown)
# und gibt danach die Root-Rechte ab (su-exec), um FoundryVTT sicher
# als unprivilegierter User 'node' (UID 1000) auszuführen.
# ============================================================================

DATA_DIR="/foundry/data"

echo "Einrichten von Berechtigungen für $DATA_DIR..."

# Wenn der User 'node' das Verzeichnis nicht besitzt, chown ausführen
if [ "$(stat -c '%U' "$DATA_DIR")" != "node" ]; then
    echo "Setze Eigentumsrechte auf User 'node'..."
    chown -R node:node "$DATA_DIR"
fi

# Gebe Rechte ab und starte das Hauptprogramm (Foundry)
echo "Starte FoundryVTT als User 'node'..."
exec su-exec node "$@"
