#!/bin/sh
# Stellt User-Daten aus dem Backup-Repo wieder her (via backup-Container)
#
# Verwendung:
#   ./restore.sh               # neuester Stand
#   ./restore.sh --list        # verfügbare Snapshots anzeigen
#   ./restore.sh <commit-hash> # spezifischen Stand wiederherstellen

if [ "$1" = "--list" ]; then
    docker compose exec backup /usr/local/bin/restore.sh --list
    exit 0
fi

docker compose stop foundry
docker compose exec backup /usr/local/bin/restore.sh "$@"
docker compose start foundry
