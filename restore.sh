#!/bin/sh
# Stellt User-Daten aus dem Backup-Repo wieder her (via backup-Container)
#
# Verwendung:
#   ./restore.sh               # neuester Stand
#   ./restore.sh --list        # verfügbare Snapshots anzeigen
#   ./restore.sh <commit-hash> # spezifischen Stand wiederherstellen
docker compose exec backup /usr/local/bin/restore.sh "$@"
