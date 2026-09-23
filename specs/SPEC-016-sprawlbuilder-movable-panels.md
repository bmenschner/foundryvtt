# SPEC-016: Verschiebbare SprawlBuilder-Fenster

Status: Review

## Ziel und Scope

Gelände bauen und Asset-Stempel/Reihe erhalten verschiebbare Titelleisten. Die native Asset-Galerie bleibt über Foundrys Fenstersteuerung verschiebbar. Alle Fenster merken sich ihre Position lokal pro Welt und Benutzer und bieten Position zurücksetzen.

Nur `modules/shadowrun-sprawlbuilder`: gemeinsamer Positionshelfer, brush.mjs, rows.mjs, catalog.mjs, CSS, Manifest und README. Direkte Unit-/Browserchecks mit vorhandener Foundry-Simulation.

## Akzeptanzkriterien

- [x] Ziehen der Titelleisten verschiebt Werkzeugfenster, auch bei aktivem Malen/Stempeln, ohne Tiles zu erzeugen oder die Karte zu bewegen.
- [x] Materialwechsel und Wiederöffnen erhalten die jeweilige Position; Speicherung getrennt pro Welt/Benutzer/Fenstertyp im Browser.
- [x] Titelleisten bleiben nach Verkleinern des Browserfensters erreichbar; Position zurücksetzen stellt einen sinnvollen Ausgangspunkt her.
- [x] Suchfelder, Bilder und Schaltflächen lösen kein Fensterziehen aus.
- [x] Native Asset-Galerie bleibt bedienbar und verwendet ihre bestehende Verschiebefunktion; Position wird gespeichert und ist zurücksetzbar.
- [x] Schließen, Abbruch und Szenenwechsel hinterlassen keine Zieh-Listener oder Mausaufnahme.

## Nicht-Ziele

Andere Module, Assets, Raster- und Platzierungsgeometrie, neue Skalierungsfunktionen, Migrationen oder Deployment.

## Validierung

Gezielter Browsercheck: aktive Werkzeuge verschieben, kein Tile beim Ziehen, danach platzieren, Materialwechsel, Wiederöffnen, Reset und schmaler Bildschirm. Native ApplicationV2-Anbindung isoliert testen; Foundry-Liveprüfung der Galerie dokumentieren. Vorgeschrieben: `node scripts/check-modules.mjs`.

Ergebnis: 104 Tests bestanden, ein Linux-Deployment-Test unter Windows übersprungen. `node scripts/check-sprawlbuilder-panels.cjs` erfolgreich mit simuliertem Foundry. Die native Galerie nutzt `setPosition`, `bringToFront` und das öffentliche `position`-Ereignis gemäß [Foundry ApplicationV2](https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html); diese Anbindung ist isoliert geprüft, kein Ersatz für einen Live-Test.

Manuell nach Deployment als GM: Gelände und Asset-Stempel an der Titelleiste ziehen, danach bewusst ein Tile platzieren. Asset wechseln, Werkzeug schließen/öffnen und Browser neu laden: Position bleibt erhalten. ↺ setzt das Werkzeug zurück. Native Asset-Galerie mit und ohne aktivem Werkzeug an der Titelleiste ziehen, danach Fensterposition zurücksetzen. Browser verkleinern und Szene wechseln: Fenster bleiben erreichbar, keine verwaiste Vorschau oder Mausaufnahme. Live-Test noch ausstehend.

## Risiko

Low: lokale UI-Positionen, fehlender Browserspeicher darf Bedienung nicht verhindern. Kein Merge/Deployment durch Codex.
