# SPEC-002: Rechteck und Stempel auf demselben Raster

Status: Review

## Problem und Ziel

Rechtecke enden bisher an beliebigen Pixelkoordinaten. Nach Wechsel zum 1-m-Stempel entstehen dadurch Lücken oder Überlappungen. Rechtecke sollen vollständige Stempelzellen umfassen; Freihand wird nicht mehr benötigt.

## Zielmodul und Scope

`modules/shadowrun-sprawlbuilder/`: `brush.mjs`, `stamps.mjs`, Manifest und README. Zugehöriger Geometrietest und bestehender Browsercheck (`scripts/check-sprawlbuilder-ui.cjs`, `tests/browser/sprawlbuilder.html`) dürfen angepasst werden.

## Out of Scope

Altes Asset-Modul, neue Assets, Rasteränderungen an Szenen, Migration bestehender Flächen, freies nachträgliches Skalieren/Verschieben, CI/CD.

## Akzeptanzkriterien

- [x] Nur Stempel und Rechteck sind auswählbar; keine Freihand-/Pinselbreiten-Einstellung.
- [x] Rechtecke umfassen vom Start- bis zum Endfeld dieselben vollständigen 1-m-Zellen wie Stempel, auch bei umgekehrter Ziehrichtung und verschobenem Szenenursprung.
- [x] Vorschau und gespeicherte Fläche stimmen überein; an allen vier Kanten lassen sich Stempel lückenlos ergänzen.
- [x] Gleiche Materialskalierung und Texturphase in beiden Modi; Rechtecke bleiben effiziente einzelne Flächen-Tiles.
- [x] Nur vollständige Zellen innerhalb der Szene; Undo und Foundry-14-Texturanker bleiben erhalten.

## Validierung

`node scripts/check-modules.mjs` sowie bestehender Browsercheck mit Rechteck→Stempel, Zoom/Versatz und Vergleich der gerenderten Textur. Manuell in Foundry: Rechteck in beide Richtungen ziehen, an vier Kanten mit gleichem Material stempeln, Undo. Kein Live-Test im Auftrag zugesichert.

## Deployment-Risiko

Low. Modulversion 1.0.1, regulärer PR; keine automatische Verschiebung vorhandener Tiles.
