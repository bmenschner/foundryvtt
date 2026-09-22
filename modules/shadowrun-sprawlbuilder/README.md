# Shadowrun SprawlBuilder · 1.0.2

Eigenständige Asset-Bibliothek und Bauwerkzeuge für Foundry 14. Enthält **282 vorhandene Assets** in der Sammlung **Grimmes Erwachen**. Keine neuen Bilder generiert.

## Einstieg

1. Nach dem regulären Deployment unter **Module verwalten → Shadowrun SprawlBuilder** aktivieren und die Welt neu laden.
2. Eine Szene öffnen und die gewünschte Szenenebene auswählen. Für unser Kartenraster Distanz **1**, Einheit **m** einstellen.
3. Links **Shadowrun SprawlBuilder** wählen: **Gelände bauen** öffnet die Bodengalerie, **Assets** die Objektbibliothek. Alternativ öffnen Moduleinstellungen oder das gleichnamige Startmakro weiterhin die Assets.
4. Sammlung, Kategorie und Unterkategorie wählen. Die Suche berücksichtigt Namen, Kategorien und Suchbegriffe; der Elementtyp unterscheidet Einzelobjekte, Bauteile, Overlays und malbare Flächen.
5. Ein Element anklicken: Der Asset-Stempel startet direkt und die Bibliothek schließt. Die halbtransparente Vorschau folgt mit der sichtbaren Objektmitte der Maus. Im kleinen Werkzeugfenster die Breite einstellen; Linksklick setzt ein Exemplar. Weitere Klicks setzen weitere Exemplare. Auch nach Ziehen entsteht beim Loslassen nur ein Exemplar. Esc oder Rechtsklick beendet den Stempel. „Letzte Platzierung zurücknehmen“ entfernt die letzte eigene Einzelplatzierung auf der aktuellen Ebene. Anschließend auf der Tile-Ebene verschieben oder drehen.

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

**Shadowrun SprawlBuilder → Gelände bauen** öffnet ein eigenes kompaktes Werkzeugfenster mit einer kleinen Bodengalerie. Ein Vorschaubild anklicken: Der ausgewählte Boden wird umrandet und namentlich angezeigt. Verfügbar sind Gras, Asphalt und Gehwegplatten. Die Bodenauswahl aktiviert das Werkzeug sofort, ohne zusätzlichen Startknopf. Stempel oder Rechteck bestimmen die Form. Ein Bodenwechsel gilt für den nächsten Zug. Bordsteine werden über **Assets** als Einzelbauteile platziert. In der Asset-Galerie gibt es keinen zusätzlichen Gelände-bauen-Button mehr.

- Linksklick setzt ein 1 × 1 m großes Tile; Ziehen setzt zusammenhängende Rasterfelder. Die Vorschau folgt der Maus. Gespeichert wird beim Loslassen.
- Rechtecke rasten einschließlich Start- und Endfeld auf dasselbe 1-m-Raster wie Stempel ein. Vorschau und gespeicherte Kanten stimmen überein; mit demselben Material lassen sich Stempel ohne Lücke und mit passender Texturausrichtung ergänzen. Ziehen funktioniert in jede Richtung. Am Szenenrand werden nur vollständige Zellen berücksichtigt.
- Für große Flächen Rechtecke verwenden: Ein Rechteck bleibt ein einzelnes Flächen-Tile. Im Stempelmodus gelten maximal 512 einzelne Felder pro Zug. Freihand und Pinselbreite entfallen.
- Bestehende Flächen werden nicht automatisch eingerastet. Frei verschobene oder nachträglich skalierte Tiles können weiterhin außerhalb des Rasters liegen.
- **Boden löschen** aktiviert den Radierer mit roter Vorschau. Stempel löscht 1-m-Felder entlang des Mauswegs; Rechteck löscht den gewählten Rasterbereich. Größere Bodenflächen behalten die Textur außerhalb der Auswahl, vollständig leere Tiles werden entfernt. Alle überlappenden SprawlBuilder-Böden auf der aktuellen Ebene werden bearbeitet. Gesperrte und gedrehte Böden werden übersprungen und gemeldet; andere Objekte und Böden des alten Assets-Moduls bleiben erhalten.
- „Letzte Aktion zurücknehmen“ entfernt die letzte eigene Malgruppe oder stellt die letzte Radierung einschließlich gelöschter Tiles wieder her. Zwischenzeitlich veränderte Flächen werden dabei nicht überschrieben. Diese Historie gilt für die laufende Browsersitzung.
- „Ausgewählte Fläche erweitern“ bietet vier Kanten zum Ziehen für entsperrte, ungedrehte, mit SprawlBuilder erzeugte Flächen.
- Esc oder Rechtsklick pausiert das Werkzeug. Ein erneuter Klick auf Boden oder Radierer aktiviert es wieder. Gemalte Bilder liegen dauerhaft unter `worlds/<Welt-ID>/shadowrun-sprawlbuilder-painted/`; Rückgängig entfernt Tiles, nicht die erzeugten Dateien.

## Magnetische Kanten

Im Asset-Stempel ist **Kanten einrasten** standardmäßig aktiv, für alle Assets. Nahe einer vorhandenen Tile-Außenkante rastet die Vorschau bündig ein; eine goldene Linie markiert das Ziel. Entlang der Kante bleibt das Element verschiebbar, nahe ihren Enden richtet es sich bündig aus. **Alt** unterdrückt das Einrasten vorübergehend; der Schalter deaktiviert es für das geöffnete Werkzeug. Der Fangbereich beträgt 12 Bildschirmpixel, zum Loslösen 20 Pixel, unabhängig vom Zoom.

**Drehwinkel (°)** richtet den Stempel aus, etwa 90° für einen senkrechten Bordstein. An gedrehten Zielen passt sich die Ausrichtung parallel zum Ziel in der nächstliegenden Vierteldrehung an. Die Ziel-Tiles bleiben unverändert; es entsteht keine dauerhafte Verbindung. Einrasten gilt beim Einzelstempel und beim nachträglichen Einzelverschieben eigener Assets über Kacheln. Beim Verschieben bleibt der Drehwinkel erhalten; beim Reihenwerkzeug erfolgt kein Kantenfang.

Bei bekannten SprawlBuilder-Assets zählen die sichtbaren Alpharechtecke einschließlich Skalierung, Anker und Rotation. Gemalte Flächen und unbekannte Bilder verwenden die Tile-Außenmaße. Innere Löcher, radierten Aussparungen und unregelmäßigen Pixelkonturen folgt das Werkzeug nicht. Es berücksichtigt ausschließlich nicht ausgeblendete Tiles der aktuellen Ebene; gesperrte Tiles können als Bezugskante dienen.

## Kacheln präzise bearbeiten

Der Kantenfang kann zwei Nachbarn gleichzeitig berücksichtigen: Die rechte Seite des Bordsteins liegt am Gehweg, während seine Oberkante am vorherigen Bordstein einrastet. Beide Bezugskanten werden hervorgehoben. Widersprüchliche zweite Ausrichtungen verdrängen die erste nicht.

Unter **Kacheln** ein einzelnes SprawlBuilder-Asset auswählen. Direktes Ziehen verwendet ebenfalls den Kantenfang; **Alt** oder der Schalter erlaubt freies Verschieben. Mehrfachauswahlen behalten Foundrys gemeinsamen Versatz ohne individuelle Magnetkorrektur. Abbruch und fremde Kacheln verwenden das native Verhalten.

Der dicke native Rahmen und die Transformationssymbole werden bei unseren ausgewählten Assets durch eine kompakte Werkzeugleiste ersetzt. **+ / −** skalieren um 1 %, mindestens einen sichtbaren Szenenpixel an der längeren Seite. **Breite/Höhe (px)** erlauben exakte Eingaben. Das **Schloss** hält das Seitenverhältnis; ausgeschaltet lassen sich beide Maße unabhängig ändern. **Linker/rechter Kreispfeil** dreht um jeweils 1° in die entsprechende Richtung, das Winkelfeld erlaubt direkte Eingabe. Änderungen über die Leiste halten die sichtbare Objektmitte fest.

Ausgewählte Assets zeigen vier kurze rot-orange Eckmarkierungen. Bei einer kurzen Seite unter 24 Bildschirmpixeln erscheint stattdessen ein kleiner Mittelpunkt. Die Markierungen folgen Drehung und sichtbarer Bildfläche; ihre Strichstärke bleibt beim Zoom konstant. Beim Ziehen wird nur die bewegte Vorschau markiert. Sie fangen keine Mausklicks ab und verschwinden bei Abwahl.

Am Asset selbst gibt es keinen zusätzlichen Skalierungsgriff. Ein Bewegungsbutton ist nicht nötig: Asset direkt greifen und ziehen. Pixelmaße sind Szenenpixel, unabhängig vom Zoom.

## Gerade Reihen ziehen

In **Assets** ein beliebiges Element auswählen; im daraufhin geöffneten Stempelwerkzeug bei Bedarf die sichtbare Breite pro Segment einstellen und **Reihe ziehen** anklicken. Linksklick und Ziehen zeigen eine gerade Reihe in Zugrichtung; Loslassen setzt alle Segmente gemeinsam auf der aktuellen Ebene. Ein Klick setzt ein Segment. Die Vorschau zeigt Bilder, Stückzahl und tatsächliche Länge. Angefangene Endsegmente werden zu ganzen Stücken aufgerundet. Transparente Bildränder zählen nicht zum Abstand, das Bild wird nicht verzerrt.

Die Reihenfunktion steht für alle Assets zur Verfügung, ohne Einschränkung nach Kategorie oder Bildinhalt. Gehwegplatten werden zunächst als ganze quadratische Segmente wiederholt. Unregelmäßige Bildenden werden nicht automatisch retuschiert oder ineinander verblendet.

**Letzte Reihe zurücknehmen** entfernt die letzte eigene Reihe auf der aktuellen Ebene; die Historie gilt für die Browsersitzung. Einzelne Tiles bleiben danach mit Foundrys Tile-Werkzeug bearbeitbar. Esc, Rechtsklick oder Schließen beendet das Werkzeug. Beim Öffnen des Bodenwerkzeugs wird das Reihenwerkzeug geschlossen und umgekehrt. Maximal 128 Segmente pro Zug; die gesamte sichtbare Reihe muss innerhalb der Szene liegen.

Diese erste Erweiterung erstellt gerade Reihen. Das Reihenwerkzeug rastet noch nicht ein; dauerhafte Verbindungen, Kurven und automatische Eckstücke folgen separat. Es entstehen keine Foundry-Wände und keine dauerhaften Baugruppen.

## Unabhängigkeit und Updates

**Assets – Grimmes Erwachen bleibt unverändert.** Beide Module können installiert und aktiviert bleiben. SprawlBuilder hat eigene Bilddateien, IDs, Menüs, Makros, CSS-Klassen, Tile-Markierungen und Weltordner. Es benötigt weder das alte Asset-Modul noch das Abenteuer-Modul oder ein bestimmtes Spielsystem. Bereits gebaute Szenen werden nicht migriert. Verwende jeweils nur ein Gelände-Malwerkzeug zur selben Zeit und schließe das andere vor dem Wechsel.

Die zusätzlichen Bilddateien benötigen ungefähr 300 MB auf dem Server. Vorhandene Bilder wurden unverändert kopiert; Git kann identische Bildinhalte intern gemeinsam speichern.

Die bestehende GitHub Action erkennt das Modul automatisch. Änderungen kommen über Pull Request; nach Merge in `main` wird regulär verteilt. Kein Abenteuer-Neuimport nötig. Manuell installierte Module und Welten werden durch diesen PR nicht verändert.

## Herkunft und Prüfung

Die Bilder stammen aus unserer generierten Sammlung. Die Gestaltungsreferenzen sind in `docs/grimmes-erwachen-kartenrecherche.md` dokumentiert, insbesondere Tom Cartos Modern Preview und Modern Asset Gallery. Es wurden keine Original-Assetbibliotheken dieser Anbieter übernommen.

Automatisierte Prüfungen vergleichen alle 282 Bildprüfsummen und Maße mit dem bisherigen Modul und prüfen Kategorien, Suche, Koexistenz, Skalierung und getrenntes Rückgängig. Ein Browser-Test prüft die Bibliothek mit simulierten Foundry-Dokumenten. Dies ersetzt keinen vollständigen Test in der laufenden Foundry-Welt.
