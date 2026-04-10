#!/bin/sh
# ============================================================================
# backup.sh – FoundryVTT User-Daten Backup → GitHub (foundryvtt-backups)
# Wird vom crond im backup-Container ausgeführt.
# Kann auch manuell ausgelöst werden:
#   docker exec foundry-backup /usr/local/bin/backup.sh
#
# Gesichert wird NUR der data/-Ordner (User-Welten, Module, Systeme).
# Projekt-Dateien (Dockerfile, nginx, etc.) liegen im foundryvtt-Repo.
# ============================================================================

set -e

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
REPO_DIR="/repo"
BACKUP_BRANCH="${BACKUP_BRANCH:-main}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " FoundryVTT Backup – $TIMESTAMP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── SSH-Key aus Umgebungsvariable schreiben ──────────────────────────────────
# BACKUP_SSH_KEY enthält den privaten Key Base64-kodiert (kein Zeilenumbruch-Problem in .env)
if [ -z "${BACKUP_SSH_KEY}" ]; then
    echo "✗ Fehler: BACKUP_SSH_KEY ist nicht gesetzt. Backup abgebrochen." >&2
    exit 1
fi
echo "${BACKUP_SSH_KEY}" | base64 -d > /tmp/backup_key
chmod 600 /tmp/backup_key
export GIT_SSH_COMMAND="ssh -i /tmp/backup_key -o StrictHostKeyChecking=no"

# ── Git-Konfiguration ────────────────────────────────────────────────────────
git config --global user.email "${BACKUP_GIT_EMAIL:-backup@foundryvtt}"
git config --global user.name "FoundryVTT Backup"
git config --global init.defaultBranch "$BACKUP_BRANCH"
# Verhindert "dubious ownership" Fehler wenn /repo von anderem User angelegt wurde
git config --global --add safe.directory "$REPO_DIR"

# ── Repo klonen oder aktualisieren ───────────────────────────────────────────
if [ ! -d "$REPO_DIR/.git" ]; then
    echo "▶ Klone Backup-Repo (Erststart)..."
    git clone "${BACKUP_REPO}" "$REPO_DIR"
    cd "$REPO_DIR"
    git checkout "$BACKUP_BRANCH" 2>/dev/null || git checkout -b "$BACKUP_BRANCH"
else
    echo "▶ Aktualisiere Backup-Repo..."
    cd "$REPO_DIR"
    git pull --rebase origin "$BACKUP_BRANCH" || true
fi

# ── Nur User-Daten (data/) kopieren ─────────────────────────────────────────
# Projekt-Dateien (Dockerfile, nginx, etc.) gehören ins foundryvtt-Repo, nicht hierher!
echo "▶ Kopiere User-Daten (data/)..."

mkdir -p "$REPO_DIR/data"
rsync -a --delete \
    /backup/data/ "$REPO_DIR/data/"

echo "  ✓ data/ $(du -sh "$REPO_DIR/data" 2>/dev/null | cut -f1)"

# ── .gitignore im Backup-Repo sicherstellen ──────────────────────────────────
cat > "$REPO_DIR/.gitignore" << 'EOF'
# Nur User-Daten (data/) gehören in dieses Repo.
# Alles andere ist im foundryvtt Projekt-Repo.
*.zip
EOF

# ── Git: Änderungen committen und pushen ─────────────────────────────────────
cd "$REPO_DIR"
git add -A

if git diff --cached --quiet; then
    echo "✓ Keine Änderungen seit letztem Backup – kein Commit nötig."
else
    CHANGED=$(git diff --cached --stat | tail -1)
    git commit -m "backup: $TIMESTAMP ($CHANGED)"
    git push origin "$BACKUP_BRANCH"
    echo "✓ Backup erfolgreich gepusht → $BACKUP_REPO"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
