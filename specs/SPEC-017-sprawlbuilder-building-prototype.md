# SPEC-017: Gebäude-Prototyp im SprawlBuilder

Status: Review

## Ziel und Scope

Im Modul `shadowrun-sprawlbuilder` kann die Spielleitung ein Dach auf einem 1-m-Raster als rechteckige oder L-förmige Grundfläche setzen. Vorhandene Texturen liefern verschiedene Dachmaterialien. Dachrand, Innen- und Außenecken sowie ein optionaler Balkon werden passend zur gewählten Form gerendert. Das Werkzeug funktioniert am oberen und unteren Szenenrand sowie mittig.

Betroffen: Modul-Einstieg, neues Gebäude-Werkzeug und Renderer, CSS, Manifest, Modul-README und gezielte Tests. Andere Module und vorhandene Weltdaten bleiben unberührt.

## Akzeptanzkriterien

- [x] Eigenes verschiebbares Werkzeug „Gebäude bauen“ mit Material, Rechteck/L-Form, Balkonseite und Vorschau.
- [x] Platzierung richtet sich am selben 1-m-Raster wie der Bodenstempel aus; Ecken und Dachrand schließen ohne Lücken.
- [x] Eine Platzierung speichert ein transparentes Gebäude-Tile in der aktiven Foundry-14-Szene und -Ebene; Rückgängig betrifft nur eigene Gebäude dieses Werkzeugs.
- [x] Szenen-/Ebenenwechsel beendet oder blockiert eine laufende Platzierung; Öffnen konkurrierender Werkzeuge räumt Vorschau und Listener auf.
- [x] Manuelle Prüfung für oberen/unteren Rand und mittige Gebäude sowie Balkon ist beschrieben.

## Nicht-Ziele

Spielbare weitere Stockwerke, automatische Foundry-Surfaces/Regions, Sichtwände, Gebäudeeingänge, neue Texturen oder Änderungen an Adventure-/Asset-Modulen. Die gewählte aktive Ebene und deren Höhe werden am Tile gespeichert; vollständige mehrstöckige Begehbarkeit ist ein späterer Schritt.

## Validierung

`node scripts/check-sprawlbuilder-buildings.cjs`: Rastergeometrie, L-Aussparung, Balkonpixel, Level/Tile, Rückgängig, Rechteck und Szenenabbau bestanden. `node scripts/check-modules.mjs`: 104 bestanden, ein Linux-Deployment-Test unter Windows übersprungen.

Nach Deployment in Foundry 14 als GM: Eine Szene mit Raster 1 m öffnen, oben und unten je ein rechteckiges Dach, mittig ein L-Dach mit Balkon aufziehen. Prüfen, dass Umriss und Balkon mit der Vorschau übereinstimmen, Südseiten/Dachränder geschlossen aussehen und die Tiles auf der gewählten Ebene liegen. Auf eine andere Ebene wechseln und das Werkzeug erneut öffnen; Rückgängig darf nur das letzte Gebäude auf dieser Ebene entfernen. Live-Test steht noch aus.
