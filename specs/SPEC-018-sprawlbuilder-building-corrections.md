# SPEC-018: Gebäude-Prototyp korrigieren

Status: Review

## Scope und Ziel

Korrekturen aus dem Review von SPEC-017 im Modul shadowrun-sprawlbuilder, zugehörige Geometrie-/Browserchecks und Dokumentation. Pausieren gibt die Karte frei. Kantenfang und Größenanzeige verwenden die Dachgrundfläche statt transparentem Bildrand, auch nach Verschieben, Skalieren und Drehen. Am Balkon entsteht eine 1 m breite Öffnung mit abgeschlossenen Dachrand-Enden. Ausrichtung der sichtbaren Fassade kann oben, unten oder ohne Fassade gewählt werden; Schattenrichtung bleibt gleich.

## Akzeptanz

- Pausieren/Fortsetzen und Fensterfokus verhindern unerwünschte Platzierungen und geben Kartenklicks frei.
- Neue Gebäude speichern normierte Grundflächen für Kantenfang; andere Assets bleiben unverändert. Alte PNG-Tiles ohne diese Angaben müssen für den korrigierten Kantenfang neu erzeugt werden.
- Balkonzugang unterbricht Dachrand und Fassade an derselben Stelle; Vorschau zeigt den Zugang.
- Fassade oben/unten/keine ist auswählbar, die Textur und Beleuchtung drehen sich dabei nicht.
- README beschreibt Grenzen und den fehlenden automatischen Innenausbau ausdrücklich.

## Nicht-Ziele

Getrennte Gebäudeteile, automatischer Innenraum, Ebenenerstellung oder Surfaces. Diese Erweiterungen benötigen einen eigenen Gebäudedaten-/Bearbeitungsablauf. Bestehende PNGs werden nicht automatisch neu gerendert. Kein Deployment.

## Validierung

Gezielter Browsercheck für Pause/Klickdurchleitung und Renderer, Geometrietest für verschobene/gedrehte/skalierten Gebäude. Vorgeschrieben: node scripts/check-modules.mjs. Live-Test in Foundry als GM nach Deployment noch ausstehend.

Ergebnis: Browsercheck bestanden (Pause gibt Trefferfläche frei, Fortsetzen aktiviert Overlay, Balkonzugang unterscheidet sich vom geschlossenen Rand, Fassadenwahl gespeichert). Modulcheck: 106 Tests bestanden, ein Linux-Deployment-Test unter Windows übersprungen. Geometrie berücksichtigt normale Fließkomma-Rundungen.

Manuell: Gebäude-Werkzeug öffnen, pausieren und ein vorhandenes Tile per Rechtsklick bedienen. Neues Gebäude mit Balkon setzen; 1-m-Zugang, Fassadenwahl und Kantenfang prüfen. Anschließend Gebäude skalieren/drehen und benachbartes Asset ansetzen. Alte Tiles bleiben unverändert und benötigen Neuerstellung für die neuen Grundflächenangaben. Diese Korrektur stellt keinen abgeschlossenen Innenraum-/Stockwerk-Editor dar.
