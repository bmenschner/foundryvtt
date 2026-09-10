# Grimmes Erwachen: Bilder-Update 1.1.0

Dieses Update ergänzt die importierten Abenteuer um 71 individuelle NSC- und Kreaturenporträts sowie Bildseiten für die vier vorhandenen Illustrationen. Die Karten verwenden ausdrücklich die in Foundry 14 eingeführten Szenenebenen für das Hintergrundbild.

## Bestehende Welt aktualisieren

1. Nach erfolgreichem Deployment die Foundry-Seite neu laden. Das Modul muss Version **1.1.0** anzeigen und aktiviert sein.
2. Als Spielleitung **Spieleinstellungen → Einstellungen konfigurieren → Grimmes Erwachen → Abenteuer importieren** öffnen. Alternativ das vorhandene Startmakro ausführen.
3. **Alle drei Abenteuer** auswählen und **Bilder ergänzen / reparieren** anklicken.
4. Die Abschlussmeldung abwarten. Sie nennt die ergänzten Szenen, NSC, Tokens und Journalseiten.
5. Eine importierte Szene öffnen. Das Kartenbild liegt auf der Szene-Ebene **Spielplan** beziehungsweise auf der vorhandenen ersten Ebene. Die taktischen Karten behalten **1 m pro Kästchen**.
6. Im jeweiligen Hauptjournal die Seiten **Illustration** und **Porträt** öffnen. Die vier Hintergrundillustrationen liegen in **3840 × 2160 Pixeln, 16:9** vor. Charakterporträts sind quadratisch.

Die Bildkorrektur darf wiederholt werden. Sie erstellt keine zusätzlichen Actors oder Szenen und ersetzt keine Journaltexte. Bestehende eigene Hintergrundbilder, Porträts, Tokenpositionen, Wände und Spielwerte bleiben erhalten. Bei mehreren selbst angelegten Ebenen mit bereits vorhandenen Bildern erfolgt keine automatische Hintergrundänderung.

Bei einer neuen Welt genügt der normale Komplettimport; dabei sind die Bilder bereits zugeordnet.

## Bereitstellung und Prüfung

Das bestehende Deployment aktualisiert ausschließlich im Repository verwaltete Modulordner und sichert deren bisherige Version. Manuell installierte andere Module bleiben erhalten.

Die Bilder wurden mit dem integrierten Bildgenerator erstellt. Die Porträts sind eigene Interpretationen der Abenteuerfiguren; das Original-PDF wird nicht mitgeliefert. Die drei Kapitelillustrationen und das Titelbild stammen aus dem zuvor erstellten Paket.

Automatisierte Tests prüfen den Importablauf, die Bildkorrektur, Wiederholbarkeit, Erhalt eigener Inhalte und fehlende Dateien. Sie ersetzen keinen visuellen Test in der laufenden Foundry-Welt.

Referenz für die Hintergrundzuordnung: [Foundry 14 Level-Dokument](https://foundryvtt.com/api/v14/classes/foundry.documents.BaseLevel.html).
