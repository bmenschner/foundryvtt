# SPEC-007: Magnetische Kanten im Asset-Stempel

Status: Review

## Ziel / Scope

Zielmodul shadowrun-sprawlbuilder: neues snapping.mjs, rows.mjs, README, Manifest und zugehörige Tests. Alle Assets können beim Stempeln bündig an rechteckigen Außenkanten vorhandener Tiles einrasten. Keine Kategorienbeschränkung. Keine dauerhaften Verbindungen, nachträgliche Tile-Verschiebung oder Reihen-Snapping, Kurven, neue Assets, Migration oder CI/CD-Änderung.

## Akzeptanzkriterien

- Standardmäßig aktiver Schalter „Kanten einrasten“; Alt unterdrückt Einrasten auch ohne Mausbewegung.
- Vorschau und gespeicherte Position stimmen überein; Zielkante wird hervorgehoben. Entlang einer Kante bleibt Bewegung möglich, nahe Enden richten sich bündig aus.
- Fangbereich 12 Bildschirmpixel, Loslösen bei 20 Pixeln; aktuelle Kante bleibt innerhalb dieses Bereichs stabil. Keine Rasterpflicht.
- Sichtbare Alpharechtecke bekannter Katalogassets berücksichtigen transparente Außenränder, Maßstab, Anker und Rotation. Gemalte Flächen und unbekannte Bilder verwenden die Tile-Außenmaße; keine Erkennung innerer Aussparungen oder Pixelkonturen.
- Nur Ziel-Tiles auf derselben Ebene; unsichtbare Tiles werden ausgeschlossen. Ziel-Tiles werden nie verändert. Gesperrte Tiles können Referenz sein.
- Gedrehte Rechtecke unterstützt; Ausrichtung parallel zum Ziel unter Beibehaltung der nächsten Vierteldrehung. Ein Drehwinkel-Feld erlaubt insbesondere vertikale Bordsteine. Auch ohne Einrasten bleibt dieser Winkel erhalten.
- Werkzeug-/Szenenwechsel, Undo und vorhandene Stempel/Reihen bleiben erhalten. Zieländerung während Dateiprüfung verhindert veraltete Platzierung.

## Prüfung / Auswirkung

Geometrietests: Bordstein/Gehweg, Alpharänder, gedrehte Ziele, Enden, Fangbereich bei Zoom, Hysterese, Ebene. Browserprüfung: Vorschau/Platzierung, Schalter, Alt, Drehen und Undo. Standardprüfung node scripts/check-modules.mjs. Manueller Foundry-Test separat dokumentieren. Version 1.0.6; keine Migration. PR ausdrücklich nach main; kein Merge/Deployment.

## Ergebnis

86 Tests bestanden, ein Linux-Deployment-Test unter Windows übersprungen (Node 24.19.0). Browserprüfungen für Kantenfang, Asset-Stempel, Reihen und Radierer erfolgreich. Geprüft: bündiger Bordstein am Gehweg, Drehung, Alt ohne Mausbewegung, Schalter, Undo, Schutz bei Zieländerung; Geometrietests zusätzlich für Zoom, Hysterese, Alpharänder und andere Ebenen. Kein Live-Test in Foundry. Manueller GM-Test: Gehweg platzieren, Bordstein bei 90° an die Kante führen, daran entlangfahren, Enden ausrichten, Alt drücken/lösen und platzieren. Danach gedrehten Gehweg, ausgeschalteten Kantenfang und Rückgängig prüfen.
