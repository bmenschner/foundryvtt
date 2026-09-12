# Arbeitsstand: 1-m-Geländestempel

Lokaler Entwicklungsstand auf `feat/terrain-stamps`, basierend auf dem Stand von PR #12. Noch kein Release, Push oder Pull Request für diese Erweiterung.

## Implementiert

- Neuer Standardmodus „Stempel · 1 × 1 m“ im Bodenwerkzeug.
- Ein Linksklick erstellt ein separates 1-m-Tile; Ziehen sammelt Rasterfelder bis zum Loslassen.
- Raster relativ zum Szenenursprung; volle 1-m-Felder bleiben innerhalb der Szene.
- Zwischen Mausereignissen durchlaufene Felder werden ergänzt, erneut besuchte Felder im selben Zug dedupliziert.
- Vorschau-Rahmen unter der Maus und gefüllte Rahmen für den laufenden Zug.
- Gemeinsamer Erstellvorgang für die Tile-Dokumente nach dem Vorbereiten der Texturen; Rückgängig behandelt den gesamten Zug als Gruppe.
- Materialtexturen werden in festen Metermaßen ausgeschnitten. Wiederkehrende Ausschnitte werden innerhalb der Browsersitzung wiederverwendet. PNGs liegen im Weltordner.
- Maximal 512 Felder pro Zug; vorhandene Felder aus älteren Zügen werden derzeit nicht automatisch übersprungen oder ersetzt.
- Rechteck und bisherige Freihand bleiben auswählbar.

## Geprüft

50 automatisierte Modulprüfungen bestanden. Neue Tests prüfen Rasterursprung, Szenengrenzen, schnellen diagonalen Mausweg, Wiederbesuche, Grenzen, ungültige Eingaben und gruppiertes Rückgängig. Syntaxprüfungen bestanden.

## Vor Abschluss noch nötig

1. Browser-Harness an mehrere erzeugte Tiles pro Aufruf anpassen; bisherige Harness verarbeitet nur das erste Element.
2. Klick, Ziehen, Hover-Rahmen, Kamera-Zoom/Pan und Esc praktisch prüfen, einschließlich Strichen über den Szenenrand.
3. Upload-/Cache-Verhalten, Szenenwechsel während Upload, fehlgeschlagene Uploads und Batch-Erstellung mit mehreren Dokumenten gezielt testen.
4. Performance bei längeren Zügen prüfen. Persistierte Tiles erscheinen nach dem Loslassen; während des Ziehens sind Vorschau-Rahmen sichtbar.
5. Dokumentation und Versionsnummer erst nach diesen Prüfungen aktualisieren, aktuellen main-Stand abgleichen und PR erstellen. Nicht automatisch mergen oder deployen; GitHub-Netzwerkzugriff weiter über WSL gh/git.

Dateien: `modules/assets-grimmes-erwachen/stamps.mjs`, Integration in `brush.mjs`, Tests in `tests/assets-stamps.test.mjs`. Keine neuen Bildgenerierungen erforderlich.
