# Geländestempel – Version 1.4.0

Im Bilderkatalog „Boden malen“ öffnen, Material auswählen und „Malen starten“ anklicken. Standard ist „Stempel · 1 × 1 m“.

- Linksklick und Loslassen setzt ein separates Tile mit 1 m Kantenlänge.
- Gedrückt halten und ziehen zeigt die belegten Felder; Loslassen speichert alle Felder als gemeinsame Gruppe einzelner Tiles. Übersprungene Felder zwischen Mausereignissen werden ergänzt.
- Der Mausrahmen rastet auf einem 1-m-Raster am Szenenursprung ein, auch bei anderer Rasterdistanz durch Umrechnung in Meter. Vollständige Felder bleiben innerhalb der Szene.
- Derselbe Zug belegt ein Feld nur einmal. Frühere Züge werden nicht automatisch überschrieben oder übersprungen.
- „Letzten Strich zurücknehmen“ entfernt sämtliche Tiles des letzten eigenen Zuges auf dieser Ebene. Vorhandene andere Tiles bleiben erhalten.
- Esc oder „Malen pausieren“ gibt die normale Bedienung frei. Zum Zoomen oder Verschieben pausieren. Rechteck und Freihand bleiben verfügbar.

Die Originaltextur behält ihren Maßstab: 4 m für Gras und Gehweg, 6 m für Asphalt je Wiederholung. Die Stempel zeigen passende 1-m-Ausschnitte. PNGs werden im Weltordner gespeichert; identische Ausschnitte werden innerhalb der Sitzung wiederverwendet. Ein Uploadfehler vor dem Erstellen erzeugt keine Teilgruppe von Tiles. Bereits hochgeladene Dateien können erhalten bleiben.

Maximal 512 Felder pro Zug. Die dauerhaften Tiles erscheinen nach dem Loslassen und dem Speichern; während des Ziehens ist die Vorschau sichtbar. Große Flächen können viele Tile-Dokumente erzeugen, dafür bleibt der Rechteckmodus eine Alternative. Rückgängig gilt für die aktuelle Browsersitzung und löscht keine Bilddateien.

## Validierung

52 automatisierte Modulprüfungen bestanden, einschließlich Rasterfang, Szenengrenzen, diagonaler Wege, Wiederbesuchen, gemeinsamer Erstellung, Textur-Cache, Gruppen-Rückgängig, Uploadfehler sowie Szene-/Ebenenwechsel während des Uploads.

Browser-Harness tests/browser/stamps.html vom Repository-Stamm über einen lokalen HTTP-Server öffnen. Simulierte Foundry-Dokumente, reale Canvas-Texturverarbeitung und DOM-Bedienung. Geprüft: Einzelklick, sieben Felder per Zug, passende Vorschau, Rückgängig dieser sieben Felder mit Erhalt des vorherigen Feldes, veränderte Kamera, wiederverwendete Texturausschnitte. Noch kein Live-Test in einer laufenden Foundry-Welt; Serverlatenz wurde damit nicht gemessen.
