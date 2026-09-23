# SPEC-019: Gebäudeteile und offene Wandseiten

Status: Review

## Ziel und Scope

Nächster Ausbau des SprawlBuilder-Gebäudewerkzeugs: Neue Gebäude enthalten getrennte Tiles für Innenboden, Dach, Wandseiten und optional Balkon mit gemeinsamer Gebäude-ID. Oben, unten, links und rechts können unabhängig ausgeblendet werden, vor dem Zeichnen sowie nachträglich. Beim L-Grundriss zählt die Ausrichtung der jeweiligen Kante, einschließlich der beiden zurückgesetzten Kanten. Die Einstellungen beziehen sich auf die ursprüngliche Gebäudeausrichtung vor einer späteren Drehung.

Ein Gebäude-Editor bietet einen lokalen Innenraum-Modus für die Spielleitung: Dach ausblenden und Karte freigeben, ohne Spielersicht oder gespeicherte Dach-Deckkraft zu ändern. Bodenmaterial und Dachhöhe sind bei der Erstellung wählbar. Zeichnen nutzt das bisherige 1-m-Raster, vorhandene Materialien und aktuelle Ebene.

Scope: shadowrun-sprawlbuilder (Gebäude-Renderer, Verwaltung der Teile, Navigation, Tile-Bearbeitung, Kantenfang/Stapeln soweit für Gruppen erforderlich, CSS, Dokumentation, Manifest) und direkte Tests. Ein Branch/PR, keine Deployment-Änderungen.

## Akzeptanz

- Vier Wandcheckboxen, Vorschau entspricht der Auswahl. Ausgeblendete Seiten haben keine Rand-/Fassadengrafik. Balkon bleibt unabhängig.
- Neue Gebäude besitzen getrennte, zuordenbare Teile. Undo entfernt ausschließlich alle Teile der letzten eigenen Gruppe.
- Nachträgliche Wandwahl bleibt nach Neuladen erhalten. Gebäude-Editor bleibt erreichbar, auch wenn das Dach für Innenarbeit ausgeblendet ist.
- Innenraum-Modus blendet nur das eigene Dach lokal aus; Schließen/Beenden und Szenenwechsel stellen die normale Ansicht wieder her. Keine Schreibzugriffe auf andere Spieleransichten.
- Verschieben/Skalieren/Drehen eines Gebäudeteils überträgt die gemeinsame Geometrie auf die anderen Teile; Einrichtung wird nicht mitverschoben. Gebäude ganz löschen ist ein expliziter Editorbefehl.
- Fehler beim Hochladen erzeugen keine halben Gruppen; fremde Dokumente und alte Gebäude-Tiles bleiben unverändert.

## Grenzen

Bildwände sind keine Sicht-/Bewegungswände. Keine automatische Foundry-Level-/Region-/Surface-Erstellung, keine automatischen Stockwerke. Der Balkon ist in diesem Ausbau eine Plattform auf Höhe des Innenbodens. Alte zusammengerechnete PNG-Gebäude werden nicht automatisch zerlegt. Individuell erzeugte Dateien bleiben nach Undo erhalten.

## Validierung

Gezielte Gruppen-/Geometriechecks sowie Browsercheck für Wandwahl, Vorschau/Pixel, Speicherung, Innenansicht, Undo und Fehlerpfade. node scripts/check-modules.mjs. Ein manueller Live-Test in Foundry 14 bleibt dokumentiert.

Ergebnis: Browsercheck bestanden (sieben Gebäudeteile bei Balkon, alle vier Wandmasken, Balkonzugang, lokale Innenansicht ohne Dokumentänderung, nachträgliche Wandwahl, gemeinsames Bewegen/Skalieren/Drehen, Gruppen-Undo, Upload-Abbruch ohne neue Dokumente). Zusammengesetzte Rendereransichten visuell geprüft. Modulcheck: 110 Tests bestanden, ein Linux-Deployment-Test unter Windows übersprungen.

Die lokale Innenansicht verwendet die dokumentierten Tile-Zugriffe `isVisible` und `isInteractable` sowie `renderFlags` innerhalb des vorhandenen Tile-Adapters: https://foundryvtt.com/api/v14/classes/foundry.canvas.placeables.Tile.html. Diese Anbindung ist isoliert getestet; eine echte Foundry-Canvas-Prüfung steht aus.

Manueller Live-Test nach menschlichem Merge/Deployment: Als GM oben ein Gebäude ohne untere Wand, unten eines ohne obere Wand erstellen; einen L-Grundriss auf seine zurückgesetzten Kanten prüfen. Im Gebäude-Editor weitere Seiten umschalten, schließen/öffnen und Browser neu laden: Wandwahl bleibt erhalten. Innenansicht aktivieren, über Assets einen Tisch auf Innenbodenhöhe setzen; Dach nur beim GM ausgeblendet, Spieleransicht unverändert. Editor schließen: Dach wieder sichtbar. Ein Gebäudeteil drehen/verschieben: andere Teile folgen nach Speichern, Tisch bleibt stehen. Gruppenlöschung/Undo und Szenenwechsel prüfen.
