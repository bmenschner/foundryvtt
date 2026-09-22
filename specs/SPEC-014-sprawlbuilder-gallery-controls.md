# SPEC-014 — Stapelbuttons und offene Galerie

Status: Review

## Scope
Nur shadowrun-sprawlbuilder: Stapelbedienung, Asset-/Bodenwerkzeuge, Galerielebenszyklus, CSS, README, Manifest und zugehörige Browsertests. Keine Stapelalgorithmus-, Asset-, Höhen-, Deployment- oder Weltmigrationen.

## Akzeptanz
- Stufe hat Minus/Plus für Schritte um 1, mindestens 0. Klick übernimmt den angezeigten Wert und wechselt auf manuell. Automatisch stapeln lässt sich wieder aktivieren. Gilt für Platzierung, Böden und Kachelbearbeitung; während Speicherung deaktiviert.
- Assetauswahl startet weiter direkt den Stempel, lässt die Galerie mit Suche und Filtern offen. Rechtsklick beendet Stempel/Reihe und verwirft ungespeicherte Züge; Auswahl eines anderen Assets startet wieder direkt.
- Bei Böden deaktiviert Rechtsklick Boden/Radierer und verwirft ungespeicherte Züge; Bodengalerie bleibt offen und erneute Auswahl aktiviert direkt.
- Escape schließt Werkzeug und Galerie vollständig, auch aus einem Eingabefeld. Explizites Schließen der Assetgalerie räumt ihre aktiven Werkzeuge auf.
- Kontextmenü/Escape werden beim Bearbeiten nicht an Foundry weitergereicht. Keine zusätzlichen Listener nach wiederholtem Öffnen/Schließen.

## Validierung
Standard-Modulprüfung und Browserregressionen für Stapelbuttons, Werkzeugwechsel, Rechtsklick während Ziehen, Escape und erneutes Öffnen. Echtes Foundry bleibt manuell zu prüfen.
