# Assets - Grimmes Erwachen

Eigenständige Bibliothek für Foundry 14 mit **279 Elementen**: 277 transparente Ausstattungsobjekte und zwei deckende Bodentexturen. Zehn Kategorien einschließlich Boden und Straßen.

## Neue Grundtexturen in Version 1.1.0

- **Boden → Gras – einfache Rasenfläche:** 4 × 4 m pro Tile.
- **Straßen → Straße – einfacher Asphalt:** 6 × 6 m pro Tile. Mehrere Stücke hintereinander ergeben eine 6 m breite Straße ohne Markierungen.

Beide Bilder sind 1254 × 1254 Pixel groß, ohne eingebranntes Raster. Bei Rasterdistanz 1 m belegt Gras 4 × 4 Kästchen und Asphalt 6 × 6 Kästchen. Zum Verlängern Tiles duplizieren und direkt aneinanderlegen; bloßes Vergrößern streckt die Textur. Die Straße besteht zunächst aus der Asphaltoberfläche. Gehwege, Bordsteine und Übergangsränder sind noch nicht enthalten.

Für eine gezeichnete Grasfläche: Rechteck oder Polygon mit Foundrys Zeichenwerkzeug anlegen, dessen Konfiguration öffnen und als Fülltyp **Pattern/Muster** den Bildpfad `modules/assets-grimmes-erwachen/assets/boden/gras-einfach.webp` verwenden. Foundry wiederholt die Textur; die automatische 4-m-Skalierung des Katalogs gilt für Tiles, nicht für diese native Musterfüllung. Diese Version ergänzt Texturen, keinen eigenen Malpinsel. Die Reihenfolge von Zeichnungen und Tiles muss in der jeweiligen Szene geprüft werden.

Die Texturen wurden eigenständig mit dem integrierten Bildgenerator erstellt. Gestalterische Referenz: [Tom Cartos, Suburban Street Simple](https://www.tomcartos.com/tc-modern-preview). Keine Bildausschnitte der Quelle sind enthalten. Eine 3 × 3 Wiederholung wurde im Browser visuell geprüft; gegenüberliegende Randpixel sind nicht mathematisch identisch, leichte Wiederholungsmuster bleiben möglich. `terrain-prompts.json` enthält die Prompts, `terrain-report.json` die Bild- und Randprüfwerte. Der ältere Umkodierungsbericht bezieht sich weiterhin auf die ursprünglichen 277 Objekte.

## Verwendung

1. Das Modul unter `Data/modules/assets-grimmes-erwachen/` installieren und in der Welt aktivieren. Das Abenteuerpaket und Shadowrun Eden werden nicht benötigt.
2. **Einstellungen → Einstellungen konfigurieren → Assets - Grimmes Erwachen → Bilderkatalog öffnen** wählen. Alternativ das automatisch angelegte Makro **Assets - Grimmes Erwachen** ausführen oder auf die Hotbar ziehen.
3. Eine Szene und deren gewünschte Ebene öffnen. Im Katalog suchen oder eine Kategorie wählen und ein Element anklicken.
4. Die gewünschte **sichtbare Breite in Metern** einstellen und **In Szenenmitte platzieren** wählen. Das Tile anschließend auf der Tile-Ebene verschieben oder drehen.

Der Katalog berücksichtigt die Rastergröße und Rasterdistanz der Szene; bei 100 Pixeln und 1 m entspricht ein Meter 100 Szenenpixeln. Auch cm, km, ft und yd werden umgerechnet. Der transparente Rand wird aus der Größenberechnung herausgerechnet, das Bildseitenverhältnis bleibt erhalten. Die empfohlene Breite ist ein Gestaltungsvorschlag; es sind keine vermessenen Herstellermaße. Die Höhe folgt proportional aus dem Bild und kann von der früheren separaten Höhenempfehlung abweichen.

Die Bilder liegen unter `modules/assets-grimmes-erwachen/assets/<kategorie>/` und können auch über den normalen Foundry-Dateidialog gewählt werden. Der Katalog zeigt den kopierbaren Bildpfad. Nach dem Platzieren muss der Modulordner auf dem Server verfügbar bleiben, da die Szenen die Dateien referenzieren.

## Format und Unabhängigkeit

Die Dateien wurden aus den vorhandenen PNG-Originalen **verlustfrei** nach WebP umkodiert. Für jedes Element wurden sämtliche RGBA-Pixel nach erneutem Öffnen mit dem Original verglichen; Transparenz und Auflösung sind identisch. `catalog.json` enthält Maße, transparente Begrenzungen und Prüfsummen. `conversion-report.json` dokumentiert Anzahl und Speicherbedarf.

Die Bibliothek enthält die einzelnen Ausstattungsobjekte, keine kompletten Abenteuerkarten, NSC oder Journals. Aktivieren importiert keine Abenteuer und platziert keine Tiles automatisch. Alle Platzierungsaktionen sind der Spielleitung vorbehalten.

Die bisherigen PNG-Dateien des Abenteuerpakets bleiben zur Kompatibilität erhalten. Dieses eigenständige Modul belegt daher zusätzlichen Speicher; es benötigt das Abenteuerpaket selbst nicht. Die Bilder wurden für dieses private Abenteuerprojekt mit dem integrierten Bildgenerator erstellt.

Die WebP-Bilder belegen zusammen rund **296 MB**. Bei der bestehenden Bereitstellung liegen sie einmal als Modulquelle und einmal installiert vor, zusammen rund **592 MB** zusätzlich vor späteren Backups. Die Umkodierung spart gegenüber einer zusätzlichen PNG-Bibliothek rund 33 Prozent bei identischen Bildpixeln.
