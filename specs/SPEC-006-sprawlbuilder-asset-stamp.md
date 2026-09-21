# SPEC-006: Einzelassets als Stempel

Status: Review

## Ziel und Scope

Asset-Auswahl aktiviert unmittelbar einen Einzelstempel mit halbtransparenter Mausvorschau. Der Szenenmitte-Button entfällt. Zielmodul shadowrun-sprawlbuilder: catalog.mjs, rows.mjs (gemeinsame Vorschau/Platzierung), README und Manifest, zugehörige Tests. Die Reihenbeschränkung aus SPEC-005 entfällt für sämtliche Assets. Basiert auf SPEC-005; keine Verbindungsmechanik, neuen Assets, Migration oder Deployment-Änderungen. Bestehende placeAsset-API bleibt für Makros kompatibel.

## Akzeptanzkriterien

- Jede Assetkarte startet den Stempel ohne Bestätigung; Bibliothek schließt zugunsten eines kompakten Werkzeugfensters.
- Sichtbare Objektmitte folgt der Maus. Breite im Werkzeug einstellbar, Vorschau und Tile besitzen denselben Maßstab. Kein Rasterzwang.
- Pro Linksklick/Loslassen genau ein Exemplar, auch nach Ziehen; weitere Klicks wiederholen. Keine automatische Reihe durch Gedrückthalten.
- Rückgängig entfernt die letzte eigene Einzelplatzierung auf der aktuellen Ebene, keine Boden- oder Reihen-Tiles.
- Esc/Rechtsklick beendet das Werkzeug. Szene/Ebene/Berechtigung und Abbruch während Dateiprüfung verhindern ungewollte Platzierung.
- Alle Assets bieten ohne Kategorie-/Schlüsselbeschränkung „Reihe ziehen“ direkt im Werkzeugfenster. Boden-, Einzel- und Reihenwerkzeug schließen sich gegenseitig aus.

## Prüfung

Geometrie und getrenntes Undo in Dokumenttests; Browserprüfung für Auswahl, Mausvorschau, Klickfolge, Ziehen, Größe, Abbruch und Reihenwechsel. Bestehende Reihen-/Radiererprüfungen sowie node scripts/check-modules.mjs. Manueller Foundry-Test separat ausweisen.

## Auswirkung

Version 1.0.5, Browser nach Update neu laden. Kein Abenteuer-Neuimport. Nur PR, kein Merge oder Deployment.

## Ergebnis

81 Tests bestanden, ein Linux-Deployment-Test unter Windows übersprungen (Node 24.19.0). Alle 282 Katalogelemente unterstützen Reihen. Browserprüfungen für Asset-Stempel, Reihen und Radierer erfolgreich. Kein Live-Test in Foundry. Manueller Test: Asset wählen, Vorschau/Größe prüfen, mehrfach klicken, ziehen (nur ein Exemplar), rückgängig machen, auf Reihe wechseln, Esc/Rechtsklick und Szenenwechsel prüfen. PR #26 ist in main enthalten. PR #27 wurde nur in dessen Arbeitsbranch gemerged; die unveränderte Funktionalität wird deshalb mit einem korrigierenden PR direkt nach main übernommen.
