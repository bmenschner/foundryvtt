# SPEC-003: Getrennte Werkzeuge und Bodengalerie

Status: Review

## Problem und Ziel

Die Asset-Galerie und Gelände-Werkzeuge sollen eigene Unterpunkte erhalten. Eine kleine Bodengalerie ersetzt die Materialauswahl als Dropdown und zeigt die ausgewählte Textur eindeutig.

## Scope

Zielmodul: `modules/shadowrun-sprawlbuilder`. Betroffen: catalog.mjs, brush.mjs, catalog.css, module.json und README.md. Der vorhandene Browsercheck und seine Foundry-Simulation werden für die neuen Einstiegspunkte angepasst.

## Out of Scope

Andere Module, neue Bilder, Änderungen am Raster, Migrationen, CI/CD und Deployment.

## Akzeptanzkriterien

- [x] Ein Hauptmenü Shadowrun SprawlBuilder mit Gelände bauen und Assets; der Hauptpunkt öffnet nicht automatisch die Asset-Galerie.
- [x] Die Asset-Galerie enthält keinen Gelände-bauen-Button mehr.
- [x] Gelände bauen zeigt eine kleine Galerie aller vorhandenen malbaren Böden mit Bild, Name und eindeutig markierter Auswahl.
- [x] Materialwechsel wirkt auf den nächsten Stempel oder das nächste Rechteck; das gemeinsame 1-m-Raster bleibt erhalten.
- [x] Wiederholtes Öffnen erzeugt keine doppelten Gelände-Fenster; Schließen und Szenenwechsel räumen das Werkzeug auf.
- [x] Galerie bleibt bei kleiner Fensterbreite bedienbar; vorhandene Szenen und Assets bleiben erhalten.

## Technische Einschränkungen

Foundry 14, nur Spielleitung. Vorhandene API-Namen und Makros bleiben kompatibel. Bestehendes Gelände-Panel wird erweitert, kein neuer Fenstertyp benötigt.

## Validierung

`node scripts/check-modules.mjs` und vorhandener Browsercheck mit simulierter Foundry-Umgebung. Manuell in Foundry als GM: Hauptpunkt und beide Unterpunkte öffnen, Gras/Asphalt/Gehweg wechseln, Stempel und angrenzendes Rechteck setzen, schließen und erneut öffnen, Szene wechseln. Erwartet: richtige Textur und Rasterposition, jeweils nur ein Gelände-Fenster, keine verbleibende Vorschau.

Ergebnis: Modulprüfung erfolgreich (72 bestanden, ein Linux-Deployment-Test unter Windows übersprungen). Browsercheck erfolgreich, einschließlich Bildladen, eindeutiger Materialauswahl, Materialwechsel beim Stempeln, angrenzender Rechteckkanten und schmaler Ansicht. Kein Live-Test in Foundry; Szenenwechsel nutzt die vorhandenen Aufräum-Hooks.

## Deployment-Risiko

Low: lokale UI-Änderung, keine Datenmigration. Nach regulärem Deployment Browser neu laden. Kein selbstständiger Merge oder Deployment.

## Follow-up

Unabhängiger bestehender Fehler: Der Zurück-Button der Asset-Paginierung verwendet `pssb--` statt `page--` in catalog.mjs. Nicht Teil dieser UI-Trennung.
