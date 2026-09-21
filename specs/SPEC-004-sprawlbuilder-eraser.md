# SPEC-004: Direkte Bodenauswahl und Radierer

Status: Review

## Ziel und Scope

Zielmodul: `shadowrun-sprawlbuilder`. Bodenkarten aktivieren das Werkzeug unmittelbar; der zusätzliche Startknopf entfällt. Ein Radierer nutzt dasselbe 1-m-Stempel- und Rechteckraster. Betroffen: brush.mjs, neues erase.mjs, catalog.css, README.md, Manifest sowie zugehörige Tests und Browser-Simulation. Keine Änderungen an anderen Modulen, Bildern oder Deployment.

## Akzeptanzkriterien

- Boden anklicken startet oder reaktiviert das Malen ohne Bestätigung. Öffnen allein malt noch nicht; Esc pausiert, erneute Materialwahl aktiviert.
- Radierer anklicken aktiviert Löschen; Stempel und Ziehen entfernen 1-m-Felder, Rechteck entfernt den gewählten Rasterbereich.
- Größere gemalte Flächen verlieren nur den ausgewählten Ausschnitt, vollständig leere Tiles werden entfernt. Textur außerhalb der Auswahl bleibt erhalten.
- Nur entsperrte, ungedrehte SprawlBuilder-Boden-Tiles auf der aktuellen Ebene werden verändert. Andere Objekte, Module und Ebenen bleiben erhalten. Gedrehte/gesperrte Böden werden übersprungen und gemeldet.
- Rote Vorschau unterscheidet Löschen vom Malen. Letzte Aktion kann einschließlich gelöschter Tiles rückgängig gemacht werden; zwischenzeitliche Änderungen dürfen nicht überschrieben werden.
- Berechtigungs-/Szenenwechsel und Uploadfehler werden vor Dokumentänderung abgefangen. Kein doppeltes Panel und keine zusätzlichen globalen Listener.

## Prüfung

Gezielte Tests für Auswahl, Teilflächen, vollständiges Löschen, Undo und geschützte Tiles; Browser-Simulation für direkte Aktivierung und beide Löschformen. Standardprüfung `node scripts/check-modules.mjs`. Manueller Foundry-14-Test als GM: Grasrechteck malen, Stempel und Rechteck radieren, Undo, pausieren und erneut Asphalt wählen, Ebene wechseln. Live-Test gesondert ausweisen.

## Auswirkung

Keine Migration. Neue Version 1.0.3 nach regulärem menschlichem Merge und Deployment; Browser neu laden. Generierte Masken liegen im vorhandenen Weltordner. Keine Bilddateien automatisch löschen.

## Ergebnis

Alle Akzeptanzkriterien implementiert. Node 24.19.0: 75 Tests bestanden, ein Linux-Deployment-Test unter Windows übersprungen. Browserprüfung mit Chrome/Playwright erfolgreich: direkte Aktivierung, Teilradierung mit Pixel-Alpha-Prüfung, vollständiges Rechtecklöschen, Wiederherstellung einschließlich mehrstufigem Undo, Pause/Reaktivierung, Uploadfehler und Schutz zwischenzeitlicher Änderungen. Kein Live-Test in Foundry; manuelle Schritte oben bleiben vor produktiver Nutzung zu prüfen.
