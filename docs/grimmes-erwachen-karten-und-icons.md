# Karten und Icon-Bibliotheken

**Erweiterung:** 277 von 277 geplanten Icons vorhanden. Siehe `STATUS.md` für die offenen Dateien und den Prüfstand.

Die gerenderten Karten und die einzelnen Objekte liegen getrennt vor. „Ring aus Feuer“ wurde unverändert übernommen. Alle neuen Bilder wurden mit dem eingebauten Bildgenerator erzeugt; die vollständigen Vorgaben stehen in `render-jobs.json` und `icon-jobs.json`. Die Recherchequellen dienen als funktionale und gestalterische Referenzen; es wurden keine fremden Asset-Pakete übernommen.

## Karten importieren

1. Modulversion **1.2.1** samt Bildern installieren und die Foundry-Welt neu laden.
2. Als Spielleitung **Einstellungen → Einstellungen konfigurieren → Grimmes Erwachen → Abenteuer importieren** öffnen. Alternativ das vorhandene Startmakro nutzen.
3. Abenteuer auswählen und **Inhalte aktualisieren** anklicken. Ein eigenes Script-Makro ist nicht mehr erforderlich.
4. Die neuen Szenen erscheinen in den Kapitelordnern unter **Grimmes Erwachen**, mit dem Zusatz **– neue Karte**. Bereits mit `Import-Karten.js` angelegte Szenen bleiben an ihrem bisherigen Ort und werden erkannt.
5. Wände, Türen, Licht und Tokenpositionen für die neuen Grundrisse einrichten. Die neuen Arbeitskopien haben zunächst freie Sicht und keine Wände oder Tokens.

Die Aktualisierung ergänzt fehlende Einträge des Grundpakets (NSC, Matrix-Hosts, Journals und ursprüngliche Szenen) und die 31 neuen Karten. Sie repariert fehlende Bildzuordnungen und ersetzt alte Modul-Monogramme. Eigene Bilder, vorhandene Spielwerte, Journaltexte und bestehende Szenengeometrie bleiben erhalten. Wiederholtes Ausführen erzeugt keine Duplikate; bei einem Abbruch kann es erneut gestartet werden. Die Bilder werden vor dem Anlegen geprüft. Es gibt keine automatische Rücknahme bereits erfolgreicher Teilschritte.

„Ring aus Feuer“ bleibt in seiner bestehenden Szene. Ein Austausch von Bilddateien am gleichen Pfad über die GitHub Action wird nach einem Neuladen sichtbar; das allein legt keine neuen Foundry-Dokumente an. Für neue Szenen und NSC ist der Update-Knopf erforderlich. Ein Pull Request löst keine Bereitstellung aus. Unverwaltete Module bleiben beim bestehenden Deployment erhalten.

Der Icon-Katalog bleibt vorerst die vorhandene HTML-Datei; ein integrierter Foundry-Bilderbrowser ist nicht Teil dieser Aktualisierung.

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
