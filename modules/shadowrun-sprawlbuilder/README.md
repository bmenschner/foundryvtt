# Shadowrun SprawlBuilder · 1.0.2

Eigenständige Asset-Bibliothek und Bauwerkzeuge für Foundry 14. Enthält **282 vorhandene Assets** in der Sammlung **Grimmes Erwachen**. Keine neuen Bilder generiert.

## Einstieg

1. Nach dem regulären Deployment unter **Module verwalten → Shadowrun SprawlBuilder** aktivieren und die Welt neu laden.
2. Eine Szene öffnen und die gewünschte Szenenebene auswählen. Für unser Kartenraster Distanz **1**, Einheit **m** einstellen.
3. Links **Shadowrun SprawlBuilder** wählen: **Gelände bauen** öffnet die Bodengalerie, **Assets** die Objektbibliothek. Alternativ öffnen Moduleinstellungen oder das gleichnamige Startmakro weiterhin die Assets.
4. Sammlung, Kategorie und Unterkategorie wählen. Die Suche berücksichtigt Namen, Kategorien und Suchbegriffe; der Elementtyp unterscheidet Einzelobjekte, Bauteile, Overlays und malbare Flächen.
5. Ein Element auswählen, seine sichtbare Breite in Metern einstellen und platzieren. Anschließend auf der Tile-Ebene verschieben oder drehen.

## Bibliothek

| Hauptkategorie | Inhalt aus dem vorhandenen Bestand |
| --- | --- |
| Straßen & Infrastruktur | Asphalt, Gehwege und Bordsteine, Verkehr und Haltestellen, Kanalisation, Stadtmobiliar, Fahrzeuge |
| Innenböden | Einzelner Teppich und Tanzflächenmodul |
| Natur & Gelände | Rasen, Untergrund, Bäume, Hecken, Pflanzen, Felsen, Wasser, Gartenpflege, Lager |
| Wände & Gebäudeteile | Grundmauersegment, Türen, Fenster, Dächer, Tragwerk, Treppen und Beschläge |
| Mauern & Zäune | Mauerreste, Zäune, Tore, Geländer, Gitter, Schranken und Absperrungen |
| Möbel & Einrichtung | Sitzen, Tische, Schränke, Betten, Sanitär, Dekoration und Beleuchtung |
| Ausstattung & Details | Küche, Geschirr, Bar, Empfang, Forschung und Labor, Medizin, Büro, Sicherheit, Bühne, Sport, Industrie, Versorgung, Lager, Haushalt, Persönliches, Sakrales und Spuren |

Sammlung und Verwendung sind getrennt. Alle aktuellen Elemente gehören zur Sammlung Grimmes Erwachen; spätere Sammlungen können dieselben Kategorien verwenden. Dateinamen und ehemalige Kategorien bleiben als Herkunftsinformation erhalten. Die Auswahl zeigt ausschließlich belegte Kategorien mit Anzahl; Unterkategorien werden nach Auswahl der Hauptkategorie angeboten. Filter lassen sich gemeinsam zurücksetzen. Die Treffer erscheinen alphabetisch und in Seiten zu 24 Elementen.

Noch keine flächigen Innenbodenmaterialien für Holz, Fliesen oder Auslegware, keine Sand-/Erdtextur und kein vollständiger modularer Wand- oder Straßenbausatz. Vorhandene Bauteile sind **Bild-Tiles**, keine Foundry-Wände: Sicht- und Bewegungssperren setzt die Spielleitung separat.

## Gelände bauen

**Shadowrun SprawlBuilder → Gelände bauen** öffnet ein eigenes kompaktes Werkzeugfenster mit einer kleinen Bodengalerie. Ein Vorschaubild anklicken: Der ausgewählte Boden wird umrandet und namentlich angezeigt. Verfügbar sind Gras, Asphalt und Gehwegplatten. Anschließend Stempel oder Rechteck wählen und **Malen starten**. Ein Bodenwechsel gilt für den nächsten Zug. Bordsteine werden über **Assets** als Einzelbauteile platziert. In der Asset-Galerie gibt es keinen zusätzlichen Gelände-bauen-Button mehr.

- Linksklick setzt ein 1 × 1 m großes Tile; Ziehen setzt zusammenhängende Rasterfelder. Die Vorschau folgt der Maus. Gespeichert wird beim Loslassen.
- Rechtecke rasten einschließlich Start- und Endfeld auf dasselbe 1-m-Raster wie Stempel ein. Vorschau und gespeicherte Kanten stimmen überein; mit demselben Material lassen sich Stempel ohne Lücke und mit passender Texturausrichtung ergänzen. Ziehen funktioniert in jede Richtung. Am Szenenrand werden nur vollständige Zellen berücksichtigt.
- Für große Flächen Rechtecke verwenden: Ein Rechteck bleibt ein einzelnes Flächen-Tile. Im Stempelmodus gelten maximal 512 einzelne Felder pro Zug. Freihand und Pinselbreite entfallen.
- Bestehende Flächen werden nicht automatisch eingerastet. Frei verschobene oder nachträglich skalierte Tiles können weiterhin außerhalb des Rasters liegen.
- „Letzten Strich zurücknehmen“ entfernt die letzte eigene Gruppe auf der aktuellen Ebene. Diese Historie gilt für die laufende Browsersitzung.
- „Ausgewählte Fläche erweitern“ bietet vier Kanten zum Ziehen für entsperrte, ungedrehte, mit SprawlBuilder erzeugte Flächen.
- Esc pausiert den Malmodus. Gemalte Bilder liegen dauerhaft unter `worlds/<Welt-ID>/shadowrun-sprawlbuilder-painted/`; Rückgängig entfernt Tiles, nicht die erzeugten Dateien.

## Unabhängigkeit und Updates

**Assets – Grimmes Erwachen bleibt unverändert.** Beide Module können installiert und aktiviert bleiben. SprawlBuilder hat eigene Bilddateien, IDs, Menüs, Makros, CSS-Klassen, Tile-Markierungen und Weltordner. Es benötigt weder das alte Asset-Modul noch das Abenteuer-Modul oder ein bestimmtes Spielsystem. Bereits gebaute Szenen werden nicht migriert. Verwende jeweils nur ein Gelände-Malwerkzeug zur selben Zeit und schließe das andere vor dem Wechsel.

Die zusätzlichen Bilddateien benötigen ungefähr 300 MB auf dem Server. Vorhandene Bilder wurden unverändert kopiert; Git kann identische Bildinhalte intern gemeinsam speichern.

Die bestehende GitHub Action erkennt das Modul automatisch. Änderungen kommen über Pull Request; nach Merge in `main` wird regulär verteilt. Kein Abenteuer-Neuimport nötig. Manuell installierte Module und Welten werden durch diesen PR nicht verändert.

## Herkunft und Prüfung

Die Bilder stammen aus unserer generierten Sammlung. Die Gestaltungsreferenzen sind in `docs/grimmes-erwachen-kartenrecherche.md` dokumentiert, insbesondere Tom Cartos Modern Preview und Modern Asset Gallery. Es wurden keine Original-Assetbibliotheken dieser Anbieter übernommen.

Automatisierte Prüfungen vergleichen alle 282 Bildprüfsummen und Maße mit dem bisherigen Modul und prüfen Kategorien, Suche, Koexistenz, Skalierung und getrenntes Rückgängig. Ein Browser-Test prüft die Bibliothek mit simulierten Foundry-Dokumenten. Dies ersetzt keinen vollständigen Test in der laufenden Foundry-Welt.
