# SPEC-010 — Ausgewählte Assets über Straßen greifen

Status: Review

## Scope und Problem

Nur `modules/shadowrun-sprawlbuilder/tile-editing.mjs`, Manifest und zugehörige Tests. Foundry 14 verwendet `Tile.frame` als unsichtbaren Container mit der Greiffläche. Die bisherige Rahmenausblendung deaktiviert diesen Container nach der Auswahl. Dadurch treffen weitere Mauszüge eine darunterliegende Straße.

## Akzeptanz

- Die native Greiffläche bleibt bei Auswahl und Vorschau unverändert aktiv.
- Sichtbare Rahmen, Transformationsgriffe und das zusätzliche Kontrollsymbol bleiben ausgeblendet wie bisher.
- Ein ausgewählter Bordstein, Bürgersteig oder beliebiges Asset über Straßenstempeln bleibt beim erneuten Greifen das Ziel; die darunterliegenden Stempel werden nicht bewegt.
- Platzierung, Auswahl, Kantenfang, Sortierung, Sperren und Mehrfachauswahl werden nicht verändert. Fremde Module und Weltdaten sind nicht betroffen.

## Prüfung

Gezielte Regression für Auswahl, Vorschau, Abwahl und fremde Kacheln. Zusätzlich tatsächliche Pixi-Maustreffer bei überlappenden Containern mit Foundrys Frame-HitArea-Aufbau prüfen. Keine Foundry-/Pixi-Quelldateien mitliefern. Standard-Modulprüfung ausführen; verbleibenden Live-Test in Foundry dokumentieren.
