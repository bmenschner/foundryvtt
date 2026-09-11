# Git-Speicher auf dem Deployment-Server

Das Deployment lädt auf dem Server nur den aktuellen `main`-Commit ohne Tags und entfernt dort alte Reflogs und nicht mehr erreichbare Git-Objekte. Beim ersten Deployment mit dem neuen Workflow wird das bestehende Repository automatisch umgestellt; ein erneutes Klonen ist nicht erforderlich. GitHub und lokale Entwicklungsrepositories behalten ihre Historie. Der vollständige Checkout im GitHub Runner dient weiterhin der Erkennung von Docker-relevanten Änderungen.

Der Ablauf schützt lokale Änderungen an versionierten Dateien und bricht bei zusätzlichen Branches, Tags oder anderen Referenzen ab. Unversionierte Foundry-Daten und manuell installierte Module werden nicht bereinigt. Gleichzeitig laufende Deployments werden durch eine Sperre verhindert; während der Bereinigung keine manuellen Git-Schreiboperationen auf dem Server starten.

Die Größe von `.git` entspricht nicht nur der Historie: Auch die aktuellen Bilder bleiben als Git-Objekte vorhanden. Die tatsächlich freigegebene Menge hängt deshalb von den alten Versionen ab. Der Workflow zeigt die verbleibende Größe an. Die Bereinigung benötigt vorübergehend zusätzlichen Platz zum Neupacken; bei fast voller Platte zuerst Systemprotokolle oder ungenutzten Build-Cache bereinigen.

Diese Änderung ersetzt keine installierten Module und löscht keine Modul-Backups. Sie wird beim nächsten freigegebenen Deployment wirksam.
