# SPEC-012 — Automatische Zeichenreihenfolge

Status: Review

## Scope

SprawlBuilder: neue Stapelberechnung, Einzel-/Reihenplatzierung, Gelände-Stempel und Rechtecke, native Einzelverschiebung, Bedienung, Manifest/README und zugehörige Tests. Keine Änderungen an tatsächlicher Höhe, Szenenebenen, fremden Modulen, Deployment oder bestehenden Szenen beim Laden.

## Verhalten

- Ohne überlappenden Untergrund: Stufe 0. Bei echter Flächenüberschneidung: höchste darunterliegende Stufe +1. Nur Kantenkontakt zählt nicht. Straße und Gehweg nebeneinander bleiben 0; Bordstein, Pfeil oder Gullideckel darauf werden 1, Auto auf Pfeil 2.
- Alle Assets nutzen dieselbe Regel, ohne Kategorie-/Namenslisten. Drehung und die vorhandenen sichtbaren Alpha-Grenzen werden berücksichtigt. Innenliegende transparente Löcher sind in diesen rechteckigen Kataloggrenzen nicht abgebildet.
- Nur sichtbare Kacheln derselben Szenenebene und tatsächlichen Höhe werden berücksichtigt. Alte negative Boden-Sortierungen gelten als Grundstufe 0. Bestehende höhere Sortierungen werden respektiert.
- Foundrys `sort` trägt die Stufe; `elevation` und Ebenenzuordnung bleiben unverändert. Keine Migration vorhandener Tiles.
- Automatik ist bei neuen Platzierungen standardmäßig an. Die Werkzeuge bieten einen Schalter und eine manuelle nichtnegative ganze Stufe. Die Wahl wird am Tile gespeichert.
- Vorschau zeigt die berechnete Stufe. Beim nativen Einzelverschieben wird sie nach der Kantenkorrektur neu berechnet und in der Vorschau sortiert; das bewegte Original wird ausgeschlossen. Mehrfachverschieben behält den bestehenden gemeinsamen Ablauf.
- Beim Speichern wird gegen den aktuellen Szenenstand neu gerechnet. Reihen-/Stempelsegmente desselben Vorgangs zählen als nebeneinander liegende neue Teile, nicht gegenseitig als Untergrund. Vorhandene andere Tiles werden niemals umsortiert.

## Prüfung

Grundbeispiele, Kantenkontakt, Rotation, Alpha-Ränder, Ebenen/Höhe, Eigen-Ausschluss, manuelle Stufen, Alt/freie Bewegung, Speicherwege und Browserbedienung prüfen. Standard-Modulprüfung; manueller Foundry-Test im PR dokumentiert.
