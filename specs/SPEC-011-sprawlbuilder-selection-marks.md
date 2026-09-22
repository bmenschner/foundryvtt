# SPEC-011 — Dezente Auswahlmarkierung

Status: Review

## Scope

SprawlBuilder-Kachelbearbeitung, Manifest, README und zugehörige Tests. Keine Änderung an Platzierung, Greifflächen, Auswahlregeln, Kantenfang, Assets oder Deployment.

## Verhalten

Ausgewählte eigene Assets erhalten vier kurze rot-orange Eckmarkierungen. Bei einer sichtbaren kurzen Seite unter 24 Bildschirmpixeln erscheint stattdessen ein kleiner Mittelpunkt. Farbe #ff6b35, dünne Linien und kleine Markierungen bleiben beim Zoom konstant groß. Die Markierung folgt sichtbaren Assetgrenzen einschließlich Transparenz, Rotation, Skalierung und Verschiebung. Während des Ziehens wird nur die bewegte Vorschau markiert.

Markierungen sind rein optisch, fangen keine Mausereignisse ab und verschwinden bei Abwahl. Mehrfachauswahl markiert jedes gewählte Asset. Fremde Kacheln bleiben unverändert. Der native durchgehende Rahmen und Transformationsgriffe bleiben wie bisher ausgeblendet.

## Akzeptanz und Prüfung

Geometrie für Ecklinien/Mittelpunkt, Drehung, transparente Ränder und Zoom prüfen. Pixi-Browsertest muss sichtbare Markierungen und erhaltene Maustreffer über Straßenstempeln prüfen. Standard-Modulprüfung und dokumentierter manueller Foundry-Test vor PR-Abschluss.
