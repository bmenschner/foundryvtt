# Karten und Icon-Bibliotheken

**Erweiterung:** 277 von 277 geplanten Icons vorhanden. Siehe `STATUS.md` für die offenen Dateien und den Prüfstand.

Die gerenderten Karten und die einzelnen Objekte liegen getrennt vor. „Ring aus Feuer“ wurde unverändert übernommen. Alle neuen Bilder wurden mit dem eingebauten Bildgenerator erzeugt; die vollständigen Vorgaben stehen in `render-jobs.json` und `icon-jobs.json`. Die Recherchequellen dienen als funktionale und gestalterische Referenzen; es wurden keine fremden Asset-Pakete übernommen.

## Karten importieren

1. Das fertige Paket auf dem Host unter `foundry/data/Data/modules/grimmes-erwachen/assets/rendered-v2/` ablegen. Dort müssen `Bibliotheken.json`, `karten/` und `bibliotheken/` liegen. Die zusätzlichen Dateien dürfen bestehende Modulordner nicht ersetzen.
2. In Foundry 14 als Spielleitung ein neues Makro des Typs **Script** anlegen.
3. Den Inhalt von `Import-Karten.js` in das Makro kopieren, speichern und ausführen.
4. Die neuen Szenen erscheinen im Ordner **Grimmes Erwachen – neue Karten zur Bearbeitung**. Ein erneuter Lauf überspringt bereits importierte Karten.
5. Eine neue Szene öffnen und Wände, Türen, Licht sowie Startpositionen passend zum gerenderten Grundriss einrichten. Anschließend bei Bedarf Tokensicht und Nebelerkundung aktivieren. Die neuen Arbeitskopien haben zunächst freie Sicht und keine Wände oder Tokens.

Das Makro lässt vorhandene Abenteuer-Szenen unverändert. „Ring aus Feuer“ bleibt in seiner bestehenden Szene; die unveränderte Bilddatei liegt zusätzlich im Paket.

## Maßstab und Auflösung

Das Szenenraster beträgt **100 Szenenpixel pro Kästchen und 1 Meter pro Kästchen**. Die Szenenbreite entspricht der vorgesehenen Kartenbreite in Metern. Die Höhe folgt dem tatsächlichen Bildseitenverhältnis, damit das Bild nicht verzerrt wird. Sie kann geringfügig von der ursprünglich geplanten Höhe abweichen. Die Bilddateien behalten ihre tatsächliche Generatorauflösung; die größeren Szenenmaße erzeugen keine zusätzlichen Bilddetails. Die Pixelabmessungen stehen im Katalogmanifest und Prüfbericht.

Die Einrichtung ist illustrativ. Objektgrößen, Sportplatzmarkierungen und mehrgeschossige Anschlüsse sind vor dem taktischen Einsatz am Bild zu prüfen; die Rastereinstellung allein garantiert keine maßgenaue Abbildung jedes generierten Gegenstands.

## Einzelne Elemente verwenden

1. `Katalog.html` lokal im Browser öffnen. Er zeigt die Bibliotheken und die empfohlenen Objektgrößen.
2. In Foundry die **Tile-Ebene** auswählen und über den Dateiauswahldialog ein PNG aus `bibliotheken/` platzieren. Alternativ die PNGs in einem Karteneditor verwenden.
3. Die Größe und Drehung des Tiles einstellen. Beispielsweise entspricht ein 1,6 Meter langer Tisch bei diesem Raster 160 Szenenpixeln für die sichtbare Tischkante.
4. Den transparenten Rand beachten: Die PNG-Fläche ist größer als das sichtbare Objekt. `Bibliotheken.json` enthält neben der Bildgröße das Rechteck `alphaBounds` des sichtbaren Inhalts. Für eine exakte Breite gilt: **Tilebreite = Objektbreite in Metern × Rastergröße × PNG-Breite ÷ sichtbare Pixelbreite**. Für die Höhe gilt die entsprechende Rechnung. Seitenverhältnis nach Möglichkeit beibehalten.
5. Für andere Karten mit einem 1-Meter-Raster deren tatsächliche Rastergröße statt 100 einsetzen. Ein 80-Pixel-Raster entspricht beispielsweise 80 Pixeln pro Meter.

Die Größen sind praktische Platzierungsvorschläge, keine Herstellermaße. Stühle, Tische und Dekoration sind einzeln nutzbar; Ausstattung, die im Kartenhintergrund sichtbar ist, bleibt dort Teil des Bildes und lässt sich nicht herauslösen.

## Bibliotheken

- Gastronomie: Möbel, Blumen, Kasse, Kaffee- und Küchenausstattung.
- Club: Bartresen, Lounge, Empfang, Garderobe und Audiotechnik.
- Sport: Umkleide, Sanitär, Training, Fußball und Physiotherapie.
- Wohnen: Betten, Schränke, Polstermöbel, Bad und Pflanzen.
- Büro / Medizin: Arbeitsplatz, Besprechung, Behandlung und Server.
- Industrie / Verkehr: Werkstatt, Produktion, Lager und Fahrzeuge.
- Sakral / Natur: Kirchenausstattung, Bäume, Felsen und Geländeobjekte.

Die Bibliotheken sind zusätzlich nach Kategorien als ZIP verfügbar. Die Veröffentlichung erfolgt nur über einen Pull Request; Installation und Bereitstellung auf dem Host werden dadurch nicht automatisch ausgelöst.
