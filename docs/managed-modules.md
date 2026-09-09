# Eigene Foundry-Module

Der Ordner `modules/` ist die Quelle für eigene Module. Aktuell enthält er
`sr6-multiple-wild-dice` in Version 1.1.0 für Foundry 14 und Shadowrun 6 Eden 4.0.7.
Die Versionsnummer steht jeweils in `module.json`; die Modul-ID muss dem Ordnernamen entsprechen.

## Änderungen ausrollen

1. Änderungen in einem Branch vornehmen und die Modulversion erhöhen.
2. Pull Request öffnen. „Check managed modules“ prüft Manifest, Dateien und Installationstests.
3. Nach Prüfung nach `main` übernehmen. Die vorhandene Action „Deploy to Server“ übernimmt die Installation.
4. Spieler laden den Browser neu. Ein neu installiertes Modul einmalig in der Welt unter „Module verwalten“ aktivieren.

Es gibt keinen öffentlichen Manifest-Link: Dieses Repository ist privat. Die Action installiert
das Modul direkt in den bestehenden Host-Datenordner `data/Data/modules/<id>`.
Foundrys automatische Paketupdates sind für diese verwalteten Module nicht erforderlich.

## Ablauf auf dem Server

- Vor dem SSH-Schritt laufen Manifestprüfung und Tests.
- Der Server muss genau den geprüften Commit verwenden.
- Die Moduldateien werden in einem kurzlebigen Container mit dem vorhandenen Foundry-Image geprüft.
- Unveränderte Dateien lösen keinen Modul-Neustart aus.
- Bei Änderungen stoppt nur der Dienst `foundry` kurz. Caddy und Backup laufen weiter.
- Neue Dateien werden zuerst bereitgestellt und geprüft, vorhandene Modulordner gesichert und dann ersetzt.
- Nach erfolgreicher Installation startet Foundry wieder. Bei einem Installationsfehler werden bereits ersetzte Module zurückgesetzt und Foundry wieder gestartet.
- Andere Module, Welten und Systeme werden nicht verändert. Die Aktivierung in einer Welt bleibt eine bewusste Auswahl der Spielleitung.

Die Sicherungen liegen unter `data/module-backups/<modul-id>-<zeitstempel>-<kennung>`
und bleiben erhalten. Der tägliche Daten-Backupdienst erfasst sie ebenfalls.
Der Installer übernimmt die Besitzerrechte des bestehenden Modulverzeichnisses.

## Rückkehr zur vorherigen Modulversion

Bevorzugt den betreffenden Modul-Commit in einem neuen Commit zurücknehmen und über
`main` erneut deployen. Der Dateivergleich installiert auch eine ältere Version.
Bei einem manuellen Restore Foundry zuerst stoppen und nur den betroffenen Modulordner
aus `data/module-backups/` wiederherstellen; anschließend Foundry starten.

## Lokal prüfen

Node.js 20 oder neuer verwenden. Die GitHub Actions und das Foundry-Image verwenden Node.js 24.

```sh
node scripts/deploy-modules.mjs validate modules
node --test tests/*.test.mjs
node modules/sr6-multiple-wild-dice/tests/core.test.mjs
node --check modules/sr6-multiple-wild-dice/scripts/main.mjs
```

Eine erfolgreiche Action bestätigt die Dateiinstallation, nicht die Funktion aller
Spielmechaniken in einer laufenden Welt. Dort eine Probe mit Pool 8 und 3 Schicksalswürfeln
ausführen und den Hinweis-Link prüfen. Einschränkungen stehen in der Modul-README.
