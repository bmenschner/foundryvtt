# SPEC-015: 100 neue Bodentexturen

Status: Review

## Ziel und Scope

Mindestens 100 eigenständig generierte Bodentexturen für Shadowrun SprawlBuilder, inspiriert durch die Materialtypen der [TC Modern Preview](https://www.tomcartos.com/tc-modern-preview). Zehn Varianten je Asphalt, Beton, Gehwegplatten, Pflaster, Sand, Erde, Kies, Gras, Waldboden und Industrieboden. Keine Übernahme fremder Bilddateien.

Zielmodul: `modules/shadowrun-sprawlbuilder`. Neue Assets, Katalog, Taxonomie, Manifest, README und nachvollziehbares Generierungsmanifest. Bei 103 Böden benötigt die bestehende Bodengalerie eine einfache Suche/Materialfilter. Direkt betroffene Katalogtests und Browsercheck dürfen angepasst werden.

## Akzeptanzkriterien

- [x] 100 neue individuelle Bilder, keine bloßen Dateikopien, getrennt gespeichert und sinnvoll benannt.
- [x] Quadratische Draufsicht, ohne Kartenraster oder Beschriftung; Maßstab 4 × 4 m pro Textur.
- [x] Als malbare Böden im bestehenden Stempel-/Rechteckwerkzeug verfügbar und nach Material auffindbar.
- [x] Bestehende 282 Assets, Weltdaten und andere Module bleiben erhalten.
- [x] Quellenbezug, vollständige Prompts und tatsächliche Generierung sind dokumentiert. Bildqualität und Wiederholung werden kontrolliert; nicht bestandene Bilder werden nicht als fertig ausgegeben.

## Nicht-Ziele

Neue Karten, Straßenmarkierungen, Wand-/Bordsteinbausätze, Änderungen der Baugeometrie oder CI/CD. Keine Vorschauen im Chat, kein Merge oder Deployment.

## Prüfung

Bildanzahl, individuelle Prüfsummen, Maße, Katalogpfade; Kontaktbögen und Wiederholungskanten prüfen. `node scripts/check-modules.mjs` sowie angepasster vorhandener Browsercheck. Manueller Foundry-Test: Bodengruppe suchen, Textur auswählen, Rechteck und angrenzende 1-m-Stempel platzieren.

Ergebnis: 100 unterschiedliche Originale und WebP-Dateien, quadratisch und deckend, insgesamt 66,6 MiB zusätzliche WebP-Bilder. Alle 100 Bilder über Kontaktbögen gesichtet; zusätzlich Gehweg/Pflaster in 2×2-Wiederholung geprüft. Der heuristische Vergleich von Rand- und Binnenunterschieden meldet keine auffälligen Kanten. Keine Garantie mathematisch identischer Randpixel.

Modulvalidator: 102 bestanden, ein Linux-Deployment-Test unter Windows übersprungen. Gezielter Browsercheck `node scripts/check-sprawlbuilder-floors.cjs` mit vorhandener Foundry-Simulation erfolgreich: 103 Böden, Materialfilter, Suche, neuer Sandstempel, Industrierechteck und schmale Ansicht. Kein Live-Test in Foundry.

## Risiko

Low: zusätzliche Bilder/Katalogeinträge und Filter, keine Migration. Komprimierte WebP-Dateien im Modul; generierte Originale im lokalen Ausgabeordner erhalten.
