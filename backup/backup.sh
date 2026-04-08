#!/bin/sh
# ============================================================================
# backup.sh – FoundryVTT Backup → GitHub
# Wird vom crond im backup-Container ausgeführt.
# Kann auch manuell ausgelöst werden:
#   docker exec foundry-backup /usr/local/bin/backup.sh
# ============================================================================

set -e

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
REPO_DIR="/repo"
BACKUP_BRANCH="${BACKUP_BRANCH:-main}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " FoundryVTT Backup – $TIMESTAMP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── SSH-Key in beschreibbares Verzeichnis kopieren ───────────────────────────
# Der Key ist read-only gemountet → chmod direkt darauf schlägt fehl
cp /root/.ssh/id_ed25519 /tmp/backup_key
chmod 600 /tmp/backup_key
export GIT_SSH_COMMAND="ssh -i /tmp/backup_key"

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
    # Branch sicherstellen (main oder master je nach Repo)
    git checkout "$BACKUP_BRANCH" 2>/dev/null || git checkout -b "$BACKUP_BRANCH"
else
    echo "▶ Aktualisiere Backup-Repo..."
    cd "$REPO_DIR"
    git pull --rebase origin "$BACKUP_BRANCH" || true
fi

# ── Gesamtes Projektverzeichnis kopieren ─────────────────────────────────────
echo "▶ Kopiere Projektverzeichnis..."

rsync -a --delete \
    --exclude='.git/' \
    --exclude='foundryvtt.zip' \
    --exclude='backup/ssh/backup_key' \
    /backup/project/ "$REPO_DIR/"

# .gitignore im Backup-Repo sicherstellen (doppelter Schutz für Secrets)
cat > "$REPO_DIR/.gitignore" << 'EOF'
# Private SSH Key – darf NIEMALS in Git!
backup/ssh/backup_key

# FoundryVTT ZIP – kommerzielle Software, nicht sichern
foundryvtt.zip

# Docker Build Cache
.dockerignore
EOF

echo "  ✓ Projekt $(du -sh "$REPO_DIR" --exclude='.git' 2>/dev/null | cut -f1) gesamt"

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
