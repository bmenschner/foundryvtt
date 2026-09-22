# SPEC-008: Doppelter Kantenfang und präzise Kachelbearbeitung

Status: Review

## Scope

shadowrun-sprawlbuilder: snapping.mjs, rows.mjs, neues tile-editing.mjs, Katalog-Registrierung, CSS, README/Manifest und passende Tests. Alle Assetarten sind zugelassen; eigene Kachelbedienung nur für Tiles mit SprawlBuilder-Markierung. Keine Änderungen anderer Module, globaler Rechte oder Deployment-Logik.

## Verhalten

- Primäre Kante bleibt stabil; eine kompatible zweite, senkrechte Kante eines anderen Nachbarn richtet gleichzeitig die zweite Achse aus. Beispiel: rechter Gehweg und oberer Bordstein. Beide Linien werden markiert; Alt löst beide.
- Native Einzelbewegung über Kacheln verwendet Kantenfang in Vorschau und Drop. Bewegtes Tile ist kein Ziel. Ebenen, GM-Rechte, Sperre und Abbruch berücksichtigen. Mehrfachauswahlen behalten den nativen gemeinsamen Versatz ohne individuelle Magnetkorrektur.
- Über CONFIG.Tile.objectClass wird die bestehende Klasse erweitert; fremde Tiles delegieren vollständig. Dokumentierte Erweiterungspunkte: _updateDragPreviews, _prepareDragLeftDropUpdates, _refreshState / _applyRenderFlags. Keine Core-Dateien oder Prototypen patchen.
- Bei eigener Auswahl werden der native Rahmen und die Transformationsgriffe verborgen und durch eine kleine Werkzeugleiste ersetzt: +/− (1 %, mindestens ein sichtbarer Szenenpixel an der längeren Seite), Breite/Höhe in Pixeln, Winkel/Circle-Arrow, Seitenverhältnis-Schloss und freier Eckgriff. Kein Bewegungsbutton; natives Ziehen bleibt.
- Größe/Rotation erhalten die sichtbare Objektmitte; freies Ziehen hält die gegenüberliegende Ecke fest. Keine Rasterpflicht. Native Controls fremder Tiles bleiben erhalten, Aufräumen bei Abwahl/Szenenwechsel.

## Prüfung

Geometrie- und Adaptertests für doppelten Kontakt, Konflikte, native Preview/Drop, Alt, Mehrfachauswahl, Fremdtiles und Rechte. Browserprüfung für Bedienelemente und feine Größenanpassung. Bestehende Stempel-/Reihen-/Radiererprüfungen und node scripts/check-modules.mjs. Live-Foundry-Test gesondert ausweisen.

## Auswirkung

Version 1.0.7. Keine Migration, Browser neu laden. PR ausdrücklich nach main; kein automatischer Merge/Deployment.

API-Referenzen: https://foundryvtt.com/api/classes/foundry.canvas.placeables.Tile.html und https://foundryvtt.com/api/v14/classes/foundry.default-2.html (Tile-Controls border/handles).

## Ergebnis

91 Tests bestanden, ein Linux-Deployment-Test unter Windows übersprungen (Node 24.19.0). Fünf Browserprüfungen erfolgreich: neue Kachelwerkzeuge sowie Kantenfang, Asset-Stempel, Reihen und Radierer. Adaptertests simulieren die Foundry-14-Preview-/Drop-Aufrufe, Mehrfachauswahl, fremde Tiles, Alt und Frame-Wiederherstellung. Kein Live-Test in Foundry; der native Drag-/Render-Ablauf muss in der Zielwelt bestätigt werden.

Manueller GM-Test: Gehweg und oberen Bordstein setzen, weiteren Bordstein gleichzeitig rechts/oben einrasten lassen. Anschließend über Kacheln wegziehen und wieder an beide Kanten führen, Alt und Abbruch testen. Eigenes Asset auswählen: kein orangefarbener Rahmen; +/−, Pixelmaße, Schloss, Kreispfeil und Eckgriff testen. Fremdes Tile und Mehrfachauswahl behalten native Bedienung/relative Positionen. Szene wechseln: Leiste/Griff/Vorschau verschwinden.
