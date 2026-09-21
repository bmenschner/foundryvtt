# SPEC-005: Gerade Asset-Reihen ziehen

Status: Review

## Ziel und Scope

Shadowrun SprawlBuilder erhält als ersten Schritt der Erweiterungsmechanik gerade Reihen aus vorhandenen Segmenten. Asset auswählen, „Reihe ziehen“, klicken und ziehen, Vorschau, beim Loslassen gemeinsam platzieren. Scope: catalog.mjs, brush.mjs (gegenseitiges Schließen der Werkzeuge), neue rows.mjs, Modul-CSS, Manifest/README sowie zugehörige Tests. Keine Verbindung zu anderen Assets, Anschlussprofile, Kurven, automatischen Ecken, neuen Bilder oder Deployment-Änderungen.

## Akzeptanzkriterien

- Unterstützt Heckensegment, Grundmauersegment, Mauerrest, Entwässerungsrinne, Dachentwässerung, geraden Bordstein und Gehwegplatten. Andere Objekte behalten Einzelplatzierung.
- Wiederholt vollständige Segmente unverzerrt in der gewählten sichtbaren Breite; Ausrichtung folgt der geraden Strecke in alle Richtungen. Transparente Außenränder zählen nicht als Segmentabstand. Gehwegplatten werden zunächst ebenfalls als vollständige quadratische Segmente wiederholt.
- Vorschau zeigt Bilder, Stückzahl und tatsächliche Länge. Angefangene Endsegmente werden auf vollständige Stücke aufgerundet. Klick setzt ein Segment.
- Maximal 128 Segmente pro Zug; sichtbare Segmente müssen innerhalb der Szene liegen. Ungültige Auswahl erzeugt keine Tiles.
- Loslassen erstellt die Reihe auf der aktuellen Ebene; Rückgängig entfernt nur die letzte eigene Reihe auf dieser Ebene. Fremde Tiles und Bodenhistorie bleiben erhalten.
- Esc/Rechtsklick brechen das Werkzeug ab. Szenen-/Ebenenwechsel oder fehlende Rechte verhindern Platzierung; Hooks/Listener/Vorschauen werden aufgeräumt. Bodenwerkzeug und Reihenwerkzeug können nicht gleichzeitig zeichnen.

## Prüfung und Auswirkung

Geometrietests (Richtungen, Maßstab, Alpharänder, Grenzen), Dokumenttests (Gruppe, Undo, Berechtigungen) und Browserprüfung (Vorschau, Ziehen, Werkzeugwechsel). `node scripts/check-modules.mjs`. Manueller Foundry-14-Test: Hecke, Mauer, Rinne und Gehweg horizontal/vertikal/diagonal ziehen und Undo; keine Verbindung zu anderen Assets erwarten. Kein Live-Test behaupten. Version 1.0.4; keine Migration oder neue Bilddateien. Nur PR, kein Merge/Deployment.

## Ergebnis

Implementiert und geprüft: 78 Tests bestanden, 1 Linux-Deployment-Test unter Windows übersprungen (Node 24.19.0). Browserprüfung mit Chrome/Playwright: Katalogeinstieg, Bildvorschau, komplette Segmente, rückwärts/vertikal, Gruppen-Undo, Esc, Werkzeugwechsel, wiederholtes Öffnen und Teardown. Bestehende Radierer-Browserprüfung weiterhin erfolgreich. Kein Live-Test in Foundry; manuelle Prüfung mit Hecke, Mauer, Rinne und Gehweg auf der Zielinstallation bleibt erforderlich.

API-Referenz für Tile-Dokumente: https://foundryvtt.com/api/interfaces/foundry.documents.types.TileData.html. Es werden vorhandene Dokument- und Koordinaten-APIs des Moduls verwendet.
