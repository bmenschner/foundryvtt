#!/bin/sh
# ============================================================================
# restore.sh – FoundryVTT User-Daten Restore ← GitHub (foundryvtt-backups)
#
# Stellt User-Daten (data/) aus dem Backup-Repo wieder her.
#
# Verwendung:
#   docker compose exec backup /usr/local/bin/restore.sh
#
# Optionaler Parameter: Spezifischen Commit/Stand wiederherstellen
#   docker compose exec backup /usr/local/bin/restore.sh <commit-hash>
#   docker compose exec backup /usr/local/bin/restore.sh abc1234
#
# Verfügbare Commits anzeigen:
#   docker compose exec backup /usr/local/bin/restore.sh --list
#
# FoundryVTT sollte während des Restores gestoppt sein:
#   docker compose stop foundry
#   docker compose exec backup /usr/local/bin/restore.sh
#   docker compose start foundry
# ============================================================================

set -e

TARGET_REF="${1:-}"
REPO_DIR="/repo"
BACKUP_BRANCH="${BACKUP_BRANCH:-main}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " FoundryVTT Restore"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── SSH-Key aus Umgebungsvariable schreiben ──────────────────────────────────
# BACKUP_SSH_KEY enthält den privaten Key Base64-kodiert
if [ -z "${BACKUP_SSH_KEY}" ]; then
    echo "❌ FEHLER: BACKUP_SSH_KEY ist nicht gesetzt. Restore abgebrochen." >&2
    exit 1
fi
echo "${BACKUP_SSH_KEY}" | base64 -d > /tmp/backup_key
chmod 600 /tmp/backup_key
export GIT_SSH_COMMAND="ssh -i /tmp/backup_key"

# ── Git-Konfiguration ────────────────────────────────────────────────────────
git config --global --add safe.directory "$REPO_DIR"

# ── Repo klonen oder aktualisieren ───────────────────────────────────────────
if [ ! -d "$REPO_DIR/.git" ]; then
    echo "▶ Klone Backup-Repo..."
    git clone "${BACKUP_REPO}" "$REPO_DIR"
    cd "$REPO_DIR"
    git checkout "$BACKUP_BRANCH"
else
    echo "▶ Aktualisiere Backup-Repo..."
    cd "$REPO_DIR"
    git fetch origin
    git checkout "$BACKUP_BRANCH"
    git reset --hard "origin/$BACKUP_BRANCH"
fi

# ── --list: Verfügbare Backups anzeigen ──────────────────────────────────────
if [ "$TARGET_REF" = "--list" ]; then
    echo ""
    echo "Verfügbare Backup-Stände:"
    echo ""
    git log --oneline --format="%C(yellow)%h%Creset  %ai  %s" | head -20
    echo ""
    echo "Restore mit: docker compose exec backup /usr/local/bin/restore.sh <commit-hash>"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
fi

# ── Spezifischen Commit auschecken (optional) ────────────────────────────────
if [ -n "$TARGET_REF" ]; then
    echo "▶ Wechsle zu Commit: $TARGET_REF"
    git checkout "$TARGET_REF" -- .
    echo "  Stand: $(git log -1 --oneline "$TARGET_REF")"
else
    echo "  → Neuester Stand: $(git log -1 --oneline)"
fi

# ── Prüfen ob data/ im Repo vorhanden ───────────────────────────────────────
if [ ! -d "$REPO_DIR/data" ]; then
    echo "❌ FEHLER: Kein data/-Verzeichnis im Backup-Repo gefunden!"
    exit 1
fi

# ── Sicherheitsbestätigung ───────────────────────────────────────────────────
echo ""
echo "⚠️  WARNUNG: Alle aktuellen User-Daten werden überschrieben!"
echo ""
echo "   Quelle: $BACKUP_REPO"
echo "   Stand:  $(git log -1 --format='%ai %s' 2>/dev/null)"
echo "   Ziel:   /backup/data/"
echo ""
echo "   FoundryVTT sollte jetzt gestoppt sein:"
echo "   docker compose stop foundry"
echo ""
printf "   Zum Fortfahren 'ja' eingeben: "
read -r CONFIRM

if [ "$CONFIRM" != "ja" ]; then
    echo "❌ Abgebrochen."
    exit 1
fi

# ── Restore: data/ zurückkopieren ────────────────────────────────────────────
echo ""
echo "▶ Stelle User-Daten wieder her..."

rsync -a --delete \
    "$REPO_DIR/data/" "/backup/data/"

echo "  ✓ data/ wiederhergestellt ($(du -sh /backup/data 2>/dev/null | cut -f1))"
echo ""
echo "✅ Restore abgeschlossen!"
echo ""
echo "   FoundryVTT neu starten:"
echo "   docker compose start foundry"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
