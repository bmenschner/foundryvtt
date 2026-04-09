#!/bin/sh
# Führt einen manuellen Backup aus (via backup-Container)
# Verwendung: ./backup.sh
docker compose exec backup /usr/local/bin/backup.sh
