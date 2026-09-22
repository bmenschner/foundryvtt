# SPEC-013 — Stapelstufen und Bewegungsaktualisierung korrigieren

Status: Review

## Problem und Scope

Remote gemeldet: Gulli 1, Baum 20, Steinhaufen 19 und Hecke 18 auf Boden; Auto 0 auf Straße/Pfeil; keine Aktualisierung nach Bewegung. Code verwendet rohe Foundry-Sortiernummern als Stapelstufen und überspringt Untergründe mit anderer tatsächlicher Höhe oder ohne explizite Ebenenzuordnung. Der Speicherweg ist nur im Drag-Adapter abgesichert.

Nur SprawlBuilder-Stapelberechnung, Kachelbearbeitung, README, Manifest und gezielte Tests. Keine Änderung von Meterhöhe, Szenenebenen, vorhandenen Untergründen oder Deployment.

## Akzeptanz

- Logische Stapelstufen werden aus überlappenden, darunter einsortierten Kacheln abgeleitet, nicht aus der absoluten Foundry-Sortiernummer. Ein isolierter Rasen mit Sortiernummer 17 ist logisch Stufe 0; darauf liegende getrennte Objekte sind 1, Auto auf Pfeil 2.
- Native Sortierung bleibt für die Bildreihenfolge erhalten; automatisch platzierte/verschobene Assets bekommen eine Sortierung oberhalb ihres Untergrunds. UI zeigt die logische Stufe. Bestehende Kacheln werden nicht umsortiert.
- Gleiche Szenenebene entscheidet über die Stapelgruppe. Abweichende Meterhöhe blockiert die logische Berechnung nicht; Höhe wird nicht geändert und bleibt für Foundrys tatsächliche Darstellung separat relevant.
- Leere Ebenenzuordnung zählt entsprechend Foundry auf jeder Ebene. Verborgene Kacheln, andere explizite Ebenen und das bewegte Original zählen nicht als Untergrund.
- Ein synchroner preUpdateTile-Hook sichert eigene, ausgewählte Einzelverschiebungen des lokalen GM ab. Manuelle Stufen, Undo, Fremdkacheln, Änderungen anderer Nutzer und Mehrfachverschiebung bleiben erhalten.
- Regressionen für gemeldete Beispiele mit realistischen alten Sortiernummern, Meterhöhen, Ebenen sowie den tatsächlich gespeicherten Updates.

## Grenzen

Vorhandene gedrehte Alpha-Rechtecke bleiben Grundlage, keine neue Pixelmaskenerkennung. Überlappende doppelte Boden-Tiles zählen weiterhin als vorhandene Schichten; sie werden nicht automatisch gelöscht oder gleichgesetzt. Prüfung in der tatsächlichen Nutzerwelt steht ohne Szenendaten noch aus.
