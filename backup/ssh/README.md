# SSH Deploy Key

Dieser Ordner enthält den SSH Deploy Key für automatische GitHub-Backups.

> ⚠️ Der private Key (`backup_key`) darf **niemals** in Git committet werden!

## Setup

```sh
# Schlüsselpaar generieren:
ssh-keygen -t ed25519 -f ./backup/ssh/backup_key -N "" -C "foundryvtt-backup"

# Öffentlichen Key anzeigen (für GitHub):
cat ./backup/ssh/backup_key.pub
```

**GitHub:** `foundryvtt-backups` → Settings → Deploy Keys → Add (✅ Allow write access)
