# Deployment ohne Git auf dem Server

GitHub Actions prüft die Module und erstellt eine feste Dateiliste mit SHA-256-Prüfsummen. Rsync über SSH überträgt die benötigten Docker-Dateien, Installationsskripte und verwalteten Module direkt nach `/root/foundry`. Unveränderte Bilder werden nicht erneut kopiert; ein zusätzliches großes ZIP/Tar-Archiv entfällt. Der Runner benötigt Git, der Deployment-Server nicht.

## Umstellung

Nach Zusammenführen dieses Pull Requests startet der normale Deployment-Workflow. Der Server benötigt Bash, rsync, Docker Compose, flock und die üblichen Linux-Dateiwerkzeuge. Fehlt rsync, bricht er vor der Übertragung ab; einmalig `apt-get install rsync` auf dem Server ausführen. Die vorhandenen Secrets `DEPLOY_HOST` und `DEPLOY_SSH_KEY` bleiben gültig. Optional kann `DEPLOY_KNOWN_HOSTS` den geprüften SSH-Hostschlüssel enthalten. Ohne dieses Secret wird wie bisher kein vorher hinterlegter Fingerprint vorausgesetzt.

Nach vollständiger Übertragung und Prüfung der Dateien sowie der Modulprüfung entfernt der Ablauf einmalig ausschließlich `/root/foundry/.git`. Das schafft Platz vor dem Kopieren der neuen Modulversionen. Scheitert die spätere Installation, ist die Git-Metadatenkopie dennoch entfernt; Wiederholungen benötigen sie nicht. GitHub und Entwicklungsrechner behalten ihre Repositories.

Die erste Umstellung verwendet vorhandene Docker-Images. Danach erkennt ein Fingerprint der Build-Dateien Änderungen gegenüber dem letzten erfolgreichen Deployment und löst bei Bedarf einen Build aus. Diese Umstellung setzt die vorhandene, eingerichtete Foundry-Installation voraus.

## Erhaltene Daten

- `data/`, Welten, installierte Fremdmodule, Modul-Backups und Migrationssicherungen.
- `.env`, vorhandene lokale Foundry-ZIP-Dateien und Docker-Volumes.
- Die separate Git-basierte Sicherung im Backup-Container; sie ist unabhängig vom Deployment-Repository.

Nur die explizit verwalteten Modulquellordner unter `modules/<id>/` werden mit Löschung entfallener Quelldateien synchronisiert. Auf `data/Data/modules` arbeitet weiterhin der Installer mit Backups. Die Übertragung auf das Wurzelverzeichnis verwendet keine pauschale Löschoption. Zusätzliche Modulquellordner auf dem Host führen vor der Installation zum Abbruch.

Eine neue `.dockerignore` schließt Daten, Secrets, Git und Modulbilder aus dem Foundry-Build-Kontext aus. Download und lokaler ZIP-Fallback bleiben erhalten.

## Platzbedarf und Prüfung

Die `.git`-Kopie entfällt vollständig. Die Modulquellen (ca. 693 MB) bleiben für den Installer vorhanden; installierte Module und Backups benötigen weiterhin Platz. Dieser PR bereinigt keine Backups.

Im Action-Protokoll muss `Deployment complete: … (no server Git required)` erscheinen. Der erfolgreich installierte Stand steht in `/root/foundry/.deployment-revision`. Bei Übertragungsfehlern startet die Installation nicht; nach einem Installationsfehler wird Foundry wieder gestartet und der Lauf kann wiederholt werden. Infrastrukturdateien werden nicht transaktional zurückgerollt. Während einer Action keine manuelle Bereitstellung gleichzeitig starten.
