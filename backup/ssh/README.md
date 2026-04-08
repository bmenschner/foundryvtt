# Dieser Ordner enthält den SSH Deploy Key für GitHub-Backups.
# Die Datei backup_key (privater Key) darf NIEMALS in Git committet werden!
#
# Setup:
#   ssh-keygen -t ed25519 -f ./backup/ssh/backup_key -N "" -C "foundryvtt-backup"
#   cat ./backup/ssh/backup_key.pub  → bei GitHub als Deploy Key eintragen
