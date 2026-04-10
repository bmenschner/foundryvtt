# Gitea Actions Backup Workflow

Dieses Dokument dient als Kopiervorlage, wenn du das Backup deiner FoundryVTT-Instanz zusätzlich oder alternativ über eine geschlossene, intern gehostete **Gitea**-Umgebung fahren möchtest.

### Wie es funktioniert (Pull-Prinzip)
Der Server, auf dem Foundry läuft, pusht keine Daten. Stattdessen nutzt dein internes Gitea seine "Gitea Actions" (den `act_runner`), loggt sich per SSH auf deinem Foundry-Server ein, holt sich die Daten (`/data`) ab und speichert sie direkt im internen Git-Repository ab. 

Das bestehende GitHub-Backup bleibt davon völlig unberührt.

---

### Schritt 1: SSH-Key für Gitea anlegen

Damit sich Gitea automatisch per SSH in deinen Live-Server einloggen kann, erzeugst du lokal (oder auf deinem Server) ein neues, passwortloses Schlüsselpaar:

```sh
ssh-keygen -t ed25519 -C "gitea-backup-runner" -f ~/.ssh/gitea_backup -N ""
```

1. **Public Key auf dem Live-Server hinterlegen**
   Lass dir den Public Key anzeigen: `cat ~/.ssh/gitea_backup.pub`
   Füge ihn auf deinem Live-Server (wo FoundryVTT läuft) in die Datei `~/.ssh/authorized_keys` des Benutzers ein, der Zugriff auf die Dateien hat (i.d.R. `root` oder dein SSH-User).

2. **Private Key in Gitea als Secret eintragen**
   Lass dir den privaten Schlüssel anzeigen: `cat ~/.ssh/gitea_backup` (inklusive `BEGIN`/`END` Zeilen).
   Gehe in dein internes Gitea-Repository unter:
   **Settings → Actions → Secrets**
   Füge ein neues Secret hinzu:
   * **Name:** `SSH_PRIVATE_KEY`
   * **Value:** `<dein privater Schlüssel>`

---

### Schritt 2: Workflow anlegen

Erstelle in deinem (ggf. noch leeren) internen Gitea Repository die Datei:
`.gitea/workflows/pull-backup.yml`

Kopiere den folgenden Block in die Datei und passe `root@your-server` an deine tatsächlichen SSH-Logindaten / Server-IP an.

```yaml
name: "Pull Backup from Foundry Server"

# Führe das Backup jeden Tag um 04:00 Uhr aus (eine Stunde nach dem Github Backup)
on:
  schedule:
    - cron: '0 4 * * *'
  # Erlaubt das manuelle Starten über die Gitea-Oberfläche (Button)
  workflow_dispatch: 

jobs:
  backup:
    runs-on: ubuntu-latest # Dein Gitea Act_Runner

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup SSH Key
        uses: webfactory/ssh-agent@v0.8.0
        with:
          # SSH_PRIVATE_KEY muss in Gitea als Secret hinterlegt sein
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

      - name: Trust Server Host Key
        run: |
          mkdir -p ~/.ssh
          # Damit SSH nicht interaktiv wegen dem Server-Fingerprint nachfragt
          echo "StrictHostKeyChecking no" >> ~/.ssh/config

      - name: Download Data via Rsync
        run: |
          echo "Ziehe Daten vom Server..."
          # ACHTUNG: Hier 'root@your-server' auf deine IP/Domain anpassen!
          # ~/foundry/data/ = Quellverzeichnis auf dem Foundry-Server (Slash am Ende ist wichtig!)
          # ./data/         = Zielverzeichnis hier im Gitea Repository
          rsync -avz --delete \
            root@your-server:~/foundry/data/ ./data/

      - name: Commit and Push to Gitea
        run: |
          git config --global user.name "Gitea Backup Bot"
          git config --global user.email "bot@deine-gitea.local"
          
          git add data/
          
          # Prüft, ob es überhaupt Änderungen gab, bevor ein Commit gemacht wird
          if ! git diff-index --quiet HEAD; then
            git commit -m "Automated backup from Live Server: $(date +'%Y-%m-%d %H:%M')"
            git push origin main
          else
            echo "Keine Änderungen zum vorherigen Backup gefunden."
          fi
```

### Schritt 3: Runner prüfen
Stelle sicher, dass in Gitea unter **Site Administration → Actions → Runners** ein funktionierender Runner registriert ist. Ab sofort kannst du Backups manuell im Reiter "Actions" starten oder einfach auf den Zeitplan (04:00 Uhr nachts) warten.
