# Einzelne Ausstattungs-Icons verwenden

1. Das ZIP vollständig entpacken; die Unterordner in `bibliotheken/` beibehalten.
2. `Katalog.html` im Browser öffnen. Ein Klick auf ein Objekt öffnet dessen PNG-Datei. Die Größenangaben sind Vorschläge in Metern für den sichtbaren Gegenstand.
3. Für Foundry die Bibliotheksordner in ein eigenes Verzeichnis unter `Data/` kopieren. In der Szene ein **Tile** erstellen und im Bilddialog das gewünschte PNG auswählen. Die Bilder lassen sich auch in anderen Karteneditoren verwenden.
4. Tilegröße und Drehung einstellen. Bei einem Raster von 100 Pixeln pro Meter entspricht ein 2 Meter breiter Gegenstand 200 Pixeln sichtbarer Breite. Transparenter Rand zählt nicht zur Objektgröße.
5. Für eine genaue Einstellung die Bildgröße und `alphaBounds` aus `Bibliotheken.json` verwenden: **Tilebreite = gewünschte Meterbreite × Pixel pro Meter × PNG-Breite ÷ sichtbare Pixelbreite**. Die sichtbare Pixelbreite ist der dritte minus der erste Wert in `alphaBounds`. Für die Höhe entsprechend den vierten minus den zweiten Wert verwenden; das Bildseitenverhältnis möglichst erhalten.

Die PNGs sind unabhängig platzierbare Rasterbilder mit transparentem Hintergrund. Es sind keine Foundry-Actor-Tokens und kein Dungeondraft-Spezialformat. Die empfohlenen Abmessungen sind keine vermessenen Herstellermaße. Die Bildvorgaben stehen in `icon-jobs.json`; die Bilder wurden mit dem eingebauten Bildgenerator erzeugt.

Die Kategorien sind auch separat als ZIP verfügbar. Ihre jeweilige `Bibliotheken.json` enthält nur die Objekte dieser Kategorie.
