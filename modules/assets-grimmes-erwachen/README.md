# Assets - Grimmes Erwachen

Eigenständige Bibliothek für Foundry 14 mit **281 Elementen**: 277 Ausstattungsobjekte, zwei transparente Bordsteine und zwei deckende Bodentexturen. Zehn Kategorien einschließlich Boden und Straßen.

## Neue Grundtexturen in Version 1.1.0

- **Boden → Gras – einfache Rasenfläche:** 4 × 4 m pro Tile.
- **Straßen → Straße – einfacher Asphalt:** 6 × 6 m pro Tile. Mehrere Stücke hintereinander ergeben eine 6 m breite Straße ohne Markierungen.

Beide Bilder sind 1254 × 1254 Pixel groß, ohne eingebranntes Raster. Bei Rasterdistanz 1 m belegt Gras 4 × 4 Kästchen und Asphalt 6 × 6 Kästchen. Zum Verlängern Tiles duplizieren und direkt aneinanderlegen; bloßes Vergrößern streckt die Textur. Die Straße besteht zunächst aus der Asphaltoberfläche. Gehwege und weiche Übergangsränder sind noch nicht enthalten; Bordsteine werden separat platziert.

Für eine gezeichnete Grasfläche: Rechteck oder Polygon mit Foundrys Zeichenwerkzeug anlegen, dessen Konfiguration öffnen und als Fülltyp **Pattern/Muster** den Bildpfad `modules/assets-grimmes-erwachen/assets/boden/gras-einfach.webp` verwenden. Foundry wiederholt die Textur; die automatische 4-m-Skalierung des Katalogs gilt für Tiles, nicht für diese native Musterfüllung. Für eine maßstabsgerechte Füllung ist der neue Malpinsel vorzuziehen. Die Reihenfolge von Zeichnungen und Tiles muss in der jeweiligen Szene geprüft werden.

Die Texturen wurden eigenständig mit dem integrierten Bildgenerator erstellt. Gestalterische Referenz: [Tom Cartos, Suburban Street Simple](https://www.tomcartos.com/tc-modern-preview). Keine Bildausschnitte der Quelle sind enthalten. Eine 3 × 3 Wiederholung wurde im Browser visuell geprüft; gegenüberliegende Randpixel sind nicht mathematisch identisch, leichte Wiederholungsmuster bleiben möglich. `terrain-prompts.json` enthält die Prompts, `terrain-report.json` die Bild- und Randprüfwerte. Der ältere Umkodierungsbericht bezieht sich weiterhin auf die ursprünglichen 277 Objekte.

## Verwendung

### Boden malen und Bordsteine setzen (Version 1.2.0)

1. Szene öffnen; Rasterdistanz **1 m** einstellen und die gewünschte Ebene wählen.
2. Bilderkatalog öffnen und **Boden malen** anklicken. Der Katalog schließt sich, das kleine Pinselwerkzeug bleibt offen.
3. **Gras** oder **Asphalt**, **Freihand** oder **Rechteck** auswählen. Im Freihandmodus ist die Pinselbreite von 0,25 bis 20 m einstellbar.
4. **Malen starten** anklicken und mit gedrückter linker Maustaste zeichnen. Loslassen speichert die Fläche als Tile. Zuerst Gras malen, danach Asphalt darüber. Die Texturgröße bleibt unabhängig von der gemalten Fläche erhalten (Gras 4 m, Asphalt 6 m pro Wiederholung).
5. **Letzten Strich zurücknehmen** entfernt den eigenen letzten Strich auf der aktuellen Ebene. **Esc**, Rechtsklick oder **Malen pausieren** gibt die normale Szenenbedienung frei. **Schließen** beendet das Werkzeug.
6. Im Katalog unter **Straßen** nach **Bordstein** suchen: gerades Stück und 90°-Ecke wählen, platzieren, auf der Tile-Ebene drehen und duplizieren. Die sichtbare Breite ist auf 1 m voreingestellt; das gerade Stück ist etwa 0,19 m tief, die Ecke etwa 0,95 m hoch. Die Maße folgen den erzeugten Bildproportionen. Nahezu unsichtbare Alphapixel unter 16/255 zählen bei diesen beiden Elementen nicht zum Maßstab; die Bildpixel selbst sind unverändert.

Gemalte Bilder werden in `Data/worlds/<welt-id>/assets-grimmes-erwachen-painted/` gespeichert und überstehen Modulupdates. Jedes Loslassen erstellt ein eigenes, verschiebbares und löschbares Tile. Die Striche liegen vor dem Szenenhintergrund und unter regulären Tiles derselben Ebene; bei bereits manuell sortierten Flächen kann eine Anpassung der Tile-Reihenfolge nötig sein. Bestehende Tiles werden nicht verändert.

Rückgängig gilt für eigene Striche seit dem letzten Browser-Neuladen. Die PNG-Dateien bleiben beim Zurücknehmen erhalten, damit keine möglicherweise anderweitig verwendeten Dateien gelöscht werden. Große Flächen in Abschnitten malen: höchstens 4096 Pixel je Bildkante bei bis zu 100 Pixeln pro Meter. Für Zoomen/Verschieben den Pinsel pausieren. Bei Szenenwechsel schließt er sich; bei Ebenenwechsel verhindert die Prüfung das Speichern in einer falschen Ebene. Ein nach dem Upload abgebrochener Vorgang kann eine unreferenzierte PNG-Datei hinterlassen.

Geprüft mit automatisierten Modulprüfungen und einem Browser-Test mit simulierten Foundry-Dokumenten: Texturgröße/Phasenlage, transparente Freihandstriche, deckende Rechtecke, Speicherung, Rückgängig und Esc. Noch kein Test gegen eine laufende Foundry-Welt.

### Einzelne Elemente platzieren

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
