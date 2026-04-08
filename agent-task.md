# FoundryVTT Docker Setup – Agent-Aufgabenprotokoll

> Erstellt: 2026-04-08  
> Zweck: Nachschlagewerk für erledigte Tasks, aufgetretene Fehler und deren Lösungen

---

## ✅ Erledigte Tasks (Session 1)

### 1. Projektanalyse
- README.md gelesen und Anforderungen verstanden
- Vorhandene (leere) Dateien gesichtet: `Dockerfile`, `docker-compose.yml`, `.env`, `.dockerignore`
- Festgestellt: `foundryvtt.zip` (146 MB) bereits lokal vorhanden

### 2. Dockerfile erstellt
- Base Image: `node:24-alpine` (Alpine für minimale Image-Größe)
- System-Pakete: `unzip curl bash`
- Download-Logik mit Credential-Support und automatischem Fallback auf lokales ZIP
- ZIP-Validierung via Magic-Bytes (`PK\x03\x04`) nach Download
- Login-Validierung (sessionid / logout-Keyword im Response)
- Entpackt ZIP direkt nach `/foundry/app/`
- Start: `node /foundry/app/main.js --dataPath=/foundry/data --port=30000 --headless`

### 3. docker-compose.yml erstellt
- Service `foundry`: Build mit ARGs für Credentials, stabiler `hostname` (wichtig für Lizenz!)
- Service `nginx`: Reverse Proxy mit Certbot-Volumes, Port 80+443, sanftes Reload alle 6h
- Service `certbot`: Auto-Renewal alle 12h via Loop-Entrypoint

### 4. Nginx-Konfigurationen erstellt
- `nginx/default.conf` – Phase 1: HTTP-only (vor SSL-Ausstellung, ACME-Challenge)
- `nginx/foundry.conf` – Phase 2: HTTPS + HTTP→HTTPS Redirect + WebSocket-Proxy
  - `proxy_buffering off` für Echtzeit-Streaming
  - `client_max_body_size 300M` für große Uploads (Karten, Token, Musik)
  - WebSocket-Header `Upgrade` + `Connection: upgrade` sind **zwingend** für FoundryVTT

### 5. Let's Encrypt Init-Skript erstellt (`init-letsencrypt.sh`)
- Lädt empfohlene TLS-Parameter von Certbot herunter (`options-ssl-nginx.conf`, `ssl-dhparams.pem`)
- Erstellt temporäres Dummy-Zertifikat (damit nginx vor erstem echten Zertifikat startet)
- Aktiviert HTTPS-Konfiguration (`foundry.conf → default.conf`)
- Löscht Dummy-Zertifikat
- Stellt echtes Let's Encrypt Zertifikat aus (via HTTP-01 Challenge / Webroot)
- Lädt nginx neu

### 6. .env-Template befüllt
- `FOUNDRY_USERNAME`, `FOUNDRY_PASSWORD`, `FOUNDRY_VERSION`, `DOMAIN`

### 7. .dockerignore erweitert
- `data/`, `certbot/`, `.env`, `.git/`, `.vscode/`, `README.md` ausgeschlossen

---

## ✅ Erledigte Tasks (Session 2)

### 8. Lokaler Zugriff auf `localhost:30000` via nginx
- Port `127.0.0.1:30000:30000` in `docker-compose.yml` hinzugefügt (nur localhost, nicht extern erreichbar)
- Neuen `server`-Block in `nginx/default.conf` und `nginx/foundry.conf.template` ergänzt
- Lauscht auf Port `30000`, kein SSL, `server_name localhost 127.0.0.1`
- WebSocket-Header auch im lokalen Block gesetzt
- Ziel: lokales Testen ohne SSL und externe Domain möglich

---

## ✅ Erledigte Tasks (Session 3)

### 9. Automatischer Backup-Container
- Neuer Service `backup` in `docker-compose.yml` ergänzt
- Eigenes `backup/Dockerfile` auf Basis `alpine:3.20` mit `git`, `openssh`, `rsync`, `tzdata`
- `backup/backup.sh`: klont GitHub-Repo (Erststart), rsync der Daten, git commit + push
- Authentifizierung per **SSH Ed25519 Deploy Key** (nur Write-Access auf Backup-Repo)
- GitHub Known Hosts werden beim Image-Build vorausgefüllt (`ssh-keyscan github.com`)
- Cron-Zeitplan via `BACKUP_SCHEDULE` Umgebungsvariable (Standard: `0 3 * * *` = täglich 03:00 Uhr)
- SSH-Key wird als read-only Volume gemountet: `backup/ssh/backup_key:/root/.ssh/id_ed25519:ro`
- Backup-Repo: `git@github.com:bmenschner/foundryvtt-backups.git`
- Gesicherte Verzeichnisse: `./data/` (92 KB), `./certbot/conf/` (20 KB), `./nginx/` (16 KB)
- Erster Backup-Commit erfolgreich: `88776d1 backup: 2026-04-08 02:00:22`

---

## 🐛 Aufgetretene Fehler & Lösungen

---

### Fehler 1: Ungültiges ZIP nach Download via Credentials

**Fehlermeldung:**
```
End-of-central-directory signature not found. Either this file is not
a zipfile, or it constitutes one disk of a multi-part archive.
unzip: cannot find zipfile directory in one of /tmp/foundryvtt.zip
```

**Ursache:**
- Der Login-Flow von FoundryVTT via `curl` + CSRF-Token-Extraktion funktionierte nicht korrekt
- CSRF-Token wurde per `grep` aus HTML extrahiert – Pattern traf nicht
- Die Login-Session war ungültig → Download-Endpoint lieferte eine HTML-Fehlerseite statt das ZIP
- `curl -s` (silent) verdeckte den Fehler; Script meldete trotzdem „✓ Download abgeschlossen"

**Lösung:**
1. **ZIP-Validierung via Magic-Bytes** direkt nach Download:
   ```sh
   od -An -tx1 -N4 /tmp/foundryvtt.zip | tr -d ' \n' = "504b0304"
   ```
   (`504b0304` = `PK\x03\x04` = ZIP-Signatur)
2. **Login-Validierung**: Response auf `sessionid`/`logout`-Keywords prüfen
3. **Automatischer Fallback** auf lokales ZIP wenn Download fehlschlägt
4. Besseres Debugging: HTTP-Status und Dateigröße per `--write-out` ausgeben
5. Login-Response in temporäre Datei schreiben und prüfen statt `> /dev/null`

**Lektion:**  
FoundryVTT bietet **keine stabile API für automatischen Download**. Der Cookie/CSRF-Login-Flow ist fragil. Das lokale ZIP als Fallback ist der zuverlässigste Weg. Credentials-Download ist ein „best effort".

---

### Fehler 2: `Cannot find module '/foundry/app/resources/app/main.js'`

**Fehlermeldung:**
```
Error: Cannot find module '/foundry/app/resources/app/main.js'
  code: 'MODULE_NOT_FOUND'
```

**Ursache:**
- Der Dockerfile-CMD verwendete den Pfad, der bei Electron-basierten FoundryVTT-Versionen (Windows/macOS) üblich ist: `resources/app/main.js`
- Das Linux-ZIP entpackt sich **flach direkt nach `/foundry/app/`** – ohne `resources/app/` Unterordner
- `main.js` liegt direkt auf Root-Ebene: `/foundry/app/main.js`

**Diagnose:**
```sh
docker run --rm --entrypoint sh foundry-foundry -c "ls /foundry/app/"
# → main.js, main.mjs, client/, common/, dist/, node_modules/, ...
```

**Lösung:**
```dockerfile
# Falsch (Electron-Pfad):
CMD ["node", "/foundry/app/resources/app/main.js", ...]

# Richtig (Linux-ZIP-Pfad):
CMD ["node", "/foundry/app/main.js", ...]
```

**Lektion:**  
Das FoundryVTT Linux-ZIP hat eine andere Verzeichnisstruktur als das Windows/macOS-Paket. Immer zuerst die tatsächliche Struktur mit `docker run --entrypoint sh ... -c "ls /foundry/app/"` verifizieren.

---

### Fehler 3: Node.js Version zu alt

**Fehlermeldung:**
```
You are using Node.js version 22.22.2.
Foundry Virtual Tabletop requires Node.js version 24 or greater.
```

**Ursache:**
- Initial wurde `node:22-alpine` als Base Image gewählt
- FoundryVTT v14 (Build 359) benötigt mindestens **Node.js 24**

**Lösung:**
```dockerfile
# Falsch:
FROM node:22-alpine

# Richtig:
FROM node:24-alpine
```

**Lektion:**  
FoundryVTT erhöht die Node.js-Mindestanforderungen mit jeder Major-Version.
- FoundryVTT v12 → Node 16+
- FoundryVTT v13 → Node 18+
- **FoundryVTT v14 → Node 24+**

Immer die [offizielle Dokumentation](https://foundryvtt.com/article/installation/) prüfen oder `node:lts-alpine` verwenden (aktuell immer die neueste LTS).

---

### Fehler 4: nginx lädt `foundry.conf` vor Let's Encrypt-Initialisierung

**Fehlermeldung:**
```
2026/04/07 23:23:41 [emerg] 1#1: open() "/etc/letsencrypt/options-ssl-nginx.conf" failed
(2: No such file or directory) in /etc/nginx/conf.d/foundry.conf:30
```

**Ursache:**
- Der `nginx/`-Ordner ist als `/etc/nginx/conf.d/` gemountet
- nginx lädt beim Start **alle `*.conf`-Dateien** aus diesem Verzeichnis automatisch
- `foundry.conf` (HTTPS-Konfiguration) referenziert Certbot-Dateien:
  - `/etc/letsencrypt/options-ssl-nginx.conf`
  - `/etc/letsencrypt/ssl-dhparams.pem`
- Diese Dateien existieren erst **nach** `./init-letsencrypt.sh` – beim ersten Start fehlen sie
- Resultat: nginx startet nicht, da beide `.conf`-Dateien gleichzeitig geladen werden

**Lösung:**
Die HTTPS-Konfiguration in eine Datei mit `.template`-Endung umbenennen:
```sh
mv nginx/foundry.conf nginx/foundry.conf.template
```
nginx ignoriert alle Dateien ohne `.conf`-Endung. Das Init-Skript kopiert das Template zur richtigen Zeit:
```sh
cp nginx/foundry.conf.template nginx/default.conf
docker compose exec nginx nginx -s reload
```

**Init-Skript-Verbesserung:**
- Variable `NGINX_TEMPLATE="nginx/foundry.conf.template"` und `NGINX_ACTIVE="nginx/default.conf"`
- Sicherheitscheck: Template-Datei muss vor dem Start existieren
- Kommentar dokumentiert warum die Datei `.template` heißt

**Lektion:**  
nginx lädt **alle `*.conf`-Dateien** in `/etc/nginx/conf.d/` beim Start. In einem Multi-Phase-Setup (erst HTTP, dann HTTPS nach Certbot) darf die HTTPS-Konfiguration **nicht** als `.conf`-Datei im Mount-Verzeichnis liegen bis die Zertifikate vorhanden sind.
Alternativen:
- `.conf.template` / `.conf.disabled` Endung → nginx ignoriert sie
- Template in ein separates Verzeichnis auslagern (z.B. `nginx-templates/`)
- Nginx `include`-Direktive mit expliziten Dateinamen statt Wildcard

---

### Fehler 5: ERR_EMPTY_RESPONSE auf localhost:30000 nach nginx-Konfigurationänderung

**Symptom:**
```
Diese Seite funktioniert nicht – localhost hat keine Daten gesendet.
ERR_EMPTY_RESPONSE
```

**Ursache:**
- Nginx-Konfiguration wurde geändert (neuer Port 30000 Server-Block)
- `docker compose up -d` startet bereits **laufende** Container **nicht neu**
- `foundry-nginx` zeigte `Running 0.0s` = wurde nicht neu gestartet
- Nginx las weiterhin die alte Konfiguration ohne den Port-30000-Block
- Der Port war im Compose gemappt (`127.0.0.1:30000:30000` korrekt), aber nginx hörte noch nicht darauf

**Diagnose:**
```sh
# Port-Mapping prüfen (war korrekt):
docker inspect foundry-nginx --format '{{range $p,$conf := .NetworkSettings.Ports}}{{$p}} -> {{$conf}}{{"\n"}}{{end}}'
# → 30000/tcp -> [{127.0.0.1 30000}]

# Nginx-Konfiguration validieren:
docker exec foundry-nginx nginx -t
```

**Lösung:**
```sh
# Nginx-Service explizit neu starten:
docker compose restart nginx

# ODER sanfter Reload (keine Downtime):
docker exec foundry-nginx nginx -s reload
```

**Lektion:**  
`docker compose up -d` startet laufende Container **nicht neu**. Nach Konfigurationsdateien die über Volumes gemountet sind, muss nginx manuell reloaded werden.  
Faustregeln:
- **Neue Ports hinzugefügt** → `docker compose restart nginx` (neues Port-Binding erfordert Container-Neustart)
- **Nur Konfig-Inhalt geändert** → `docker exec foundry-nginx nginx -s reload` (sanft, ohne Downtime)
- **Compose-Datei geändert** (Ports, Volumes, Image) → `docker compose up -d` (erstellt neuen Container)

---

### Fehler 6: Port-Tippfehler in User-Anforderung (3000 statt 30000)

**Situation:**  
User bat um nginx auf `localhost:3000` – gemeint war `localhost:30000` (Foundry's nativer Port).  
Fehler bemerkt und alle drei Stellen korrigiert:

| Datei | Falsch | Richtig |
|---|---|---|
| `docker-compose.yml` | `127.0.0.1:3000:3000` | `127.0.0.1:30000:30000` |
| `nginx/default.conf` | `listen 3000` | `listen 30000` |
| `nginx/foundry.conf.template` | `listen 3000` | `listen 30000` |

**Lektion:**  
Bei Port-Änderungen immer alle drei Stellen gleichzeitig aktualisieren:
1. `docker-compose.yml` Ports-Mapping
2. `nginx/default.conf` Server-Block
3. `nginx/foundry.conf.template` Server-Block (damit die HTTPS-Phase konsistent bleibt)

---

### Fehler 7: `chmod: /root/.ssh/id_ed25519: Read-only file system`

**Fehlermeldung:**
```
chmod: /root/.ssh/id_ed25519: Read-only file system
```

**Ursache:**
- Der SSH-Key wird als read-only Volume gemountet (`:ro` in `docker-compose.yml`)
- Das Backup-Skript versuchte direkt `chmod 600 /root/.ssh/id_ed25519` auf der gemounteten Datei
- Read-only Mounts erlauben keine Metadaten-Änderungen (Berechtigungen) – auch nicht `chmod`

**Lösung:**
```sh
# Key zuerst in beschreibbares Verzeichnis kopieren:
cp /root/.ssh/id_ed25519 /tmp/backup_key
chmod 600 /tmp/backup_key
export GIT_SSH_COMMAND="ssh -i /tmp/backup_key"
```

**Lektion:**  
Auf read-only gemountete Dateien (`:ro`) können weder Inhalte noch Metadaten (Berechtigungen, Zeitstempel)
geändert werden. SSH-Keys müssen `chmod 600` haben – daher immer in `/tmp` kopieren wenn `:ro` gemountet.

---

### Fehler 8: Script-Änderung ohne Rebuild wirkungslos

**Situation:**
- `backup.sh` wurde auf dem Host geändert (Fehler 7 Fix)
- `docker exec foundry-backup /usr/local/bin/backup.sh` zeigte **immer noch den alten Fehler**

**Ursache:**
- `backup.sh` wird per `COPY` im `Dockerfile` ins Image gebacken
- Das Volume für den SSH-Key (`./backup/ssh/backup_key`) ist gemountet – das Script selbst **nicht**
- Host-Änderungen an `backup.sh` haben **keine Wirkung** ohne Image-Rebuild

**Lösung:**
```sh
docker compose build backup   # Image neu bauen
docker compose up -d backup   # Container neu starten
```

**Lektion:**  
Grundregel Docker: Was per `COPY` im `Dockerfile` landet → nur nach Rebuild verfügbar.  
Was als Volume gemountet ist → sofort live ohne Rebuild.

Faustregeln für `backup.sh`:
- Wenn `backup.sh` häufig geändert werden soll: Als Volume mounten (`- ./backup/backup.sh:/usr/local/bin/backup.sh`)
- Wenn es stabil ist (wie jetzt): Per `COPY` ins Image – Änderungen brauchen `docker compose build backup`

---

## 📁 Finale Dateistruktur

```
foundry/
├── Dockerfile             ← node:24-alpine, download + unzip
├── docker-compose.yml     ← foundry + nginx + certbot + backup
├── nginx/
│   ├── default.conf           ← Phase 1: HTTP (vor SSL) + localhost:30000
│   └── foundry.conf.template  ← Phase 2: HTTPS + WebSocket + Redirect + localhost:30000
├── certbot/
│   ├── conf/              ← Let's Encrypt Zertifikate (Volume)
│   └── www/               ← ACME Challenge Webroot (Volume)
├── backup/
│   ├── Dockerfile         ← alpine:3.20 + git + rsync + openssh + crond
│   ├── backup.sh          ← Backup-Skript (clone → rsync → commit → push)
│   └── ssh/
│       ├── backup_key         ← Privater SSH Deploy Key (NICHT in Git!)
│       ├── backup_key.pub     ← Öffentlicher Key (in GitHub Deploy Keys eintragen)
│       └── README.md          ← Setup-Anleitung für Key-Generierung
├── data/                  ← Foundry User-Daten: Welten, Module, Systeme (Volume)
├── init-letsencrypt.sh    ← Einmalig ausführen für erstes SSL-Zertifikat
├── .env                   ← FOUNDRY_USERNAME, FOUNDRY_PASSWORD, BACKUP_REPO, ...
├── .dockerignore          ← data/, certbot/, .env, backup/ssh/ ausgeschlossen
├── foundryvtt.zip         ← Lokales ZIP (Fallback, 146 MB, nicht in Git!)
├── agent-task.md          ← Dieses Dokument
└── README.md
```

---

## 🚀 Deployment-Checkliste

```
[ ] DNS: foundry.bastianmenschner.de → Server-IP gesetzt und propagiert
[ ] .env befüllt (FOUNDRY_USERNAME, FOUNDRY_PASSWORD, BACKUP_REPO, BACKUP_GIT_EMAIL)
[ ] Port 80 + 443 auf dem Server offen (Firewall)
[ ] SSH Deploy Key generieren: ssh-keygen -t ed25519 -f ./backup/ssh/backup_key -N ""
[ ] Public Key bei GitHub eintragen: Repo → Settings → Deploy Keys → Add (✓ Allow write access)
[ ] docker compose build
[ ] chmod +x init-letsencrypt.sh && ./init-letsencrypt.sh
[ ] docker compose up -d
[ ] Backup testen: docker exec foundry-backup /usr/local/bin/backup.sh
[ ] https://foundry.bastianmenschner.de → Lizenzschlüssel eingeben
```

## 🔄 Update-Prozess

```sh
docker compose down
# FOUNDRY_VERSION in .env anpassen (z.B. 14 → 15)
# Neues foundryvtt.zip herunterladen und ablegen (oder via Credentials)
docker compose build --no-cache
docker compose up -d
```

### Fehler 9: `grep: unrecognized option: P` auf Remote-Host (BusyBox)

**Fehlermeldung:**
```
grep: unrecognized option: P
BusyBox v1.37.0 multi-call binary ...
CSRF-Token: ...
✗ Login fehlgeschlagen (falsche Credentials oder CSRF-Problem)
✗ FEHLER: Download fehlgeschlagen und kein lokales foundryvtt.zip gefunden!
```

**Ursache:**
- Alpine Linux verwendet **BusyBox grep** – dieses kennt kein `-P` (Perl-compatible regex / PCRE)
- `grep -oP` mit Lookahead `\K` ist GNU-grep-spezifisch
- Lokal funktionierte es zufällig, weil dort GNU-grep vorhanden war
- `grep -P` scheiterte lautlos → CSRF-Token war leer → Login fehlgeschlagen
- Ohne Login kein Download → kein lokales ZIP auf Remote → Build bricht ab

**Lösung:**
`grep -oP` durch POSIX/BusyBox-kompatibles `grep -oE` + `sed` ersetzen:
```sh
# Vorher (GNU-only):
grep -oP 'csrfmiddlewaretoken["\s]+value[="\s]+\K[^"]+'

# Nachher (BusyBox-kompatibel):
grep -oE 'csrfmiddlewaretoken[^>]+value="[^"]+"' \
  | grep -oE 'value="[^"]+"' \
  | sed 's/value="//;s/"//g'

# Cookie-Fallback (vorher):
grep -oP 'csrftoken=\K[^;]+'
# Cookie-Fallback (nachher):
grep -oE 'csrftoken=[^;]+' | sed 's/csrftoken=//'
```

**Lektion:**  
Alpine Linux = BusyBox-Tools. Bei Shell-Skripten im Dockerfile **niemals GNU-spezifische Flags** annehmen:
- ❌ `grep -P` / `grep -oP` ... `\K` → nur GNU grep
- ✅ `grep -E` oder `grep -oE` + `sed` → BusyBox-kompatibel
- Alternative: `apk add grep` installiert GNU grep, aber erhöht Image-Größe

---

## 🔑 Wichtige Hinweise

- **Lizenz-Hostname**: Der Container-`hostname` in `docker-compose.yml` muss **immer gleich bleiben** (`foundryvtt`). Foundry bindet die Lizenz an den Hostname – bei Änderung muss neu aktiviert werden.
- **WebSocket**: Nginx muss `Upgrade` + `Connection: upgrade` Header weiterleiten – sonst kein Echtzeit-Spiel möglich.
- **Let's Encrypt Renewal**: Läuft automatisch alle 12h via Certbot-Container. Nginx lädt alle 6h neu. Kein manueller Eingriff nötig.
- **Backups**: Automatisch täglich 03:00 Uhr. Manuell: `docker exec foundry-backup /usr/local/bin/backup.sh`
- **Backup-Rebuild**: Änderungen an `backup/backup.sh` brauchen `docker compose build backup` + `docker compose up -d backup`.
- **Nginx nach Konfig-Änderung**: Neue Ports → `docker compose restart nginx`; nur Konfig-Inhalt → `docker exec foundry-nginx nginx -s reload`.
- **Lokaler Zugriff**: `http://localhost:30000` via nginx (kein SSL). Port ist nur auf `127.0.0.1` gebunden, nicht extern erreichbar.
- **SSH-Key read-only**: Der Deploy Key ist `:ro` gemountet – `chmod` geht nur auf einer `/tmp`-Kopie.
