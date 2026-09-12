# Assets - Grimmes Erwachen

Version **1.0.0** ist ein eigenständiges Foundry-14-Modul für alle 277 generierten Kartenelemente. Das Abenteuerpaket und Shadowrun Eden sind nicht erforderlich. Vollständige Karten und NSC bleiben im Abenteuerpaket.

Nach Installation und Aktivierung: **Einstellungen → Einstellungen konfigurieren → Assets - Grimmes Erwachen → Bilderkatalog öffnen**. Alternativ das gleichnamige Startmakro verwenden. Im Katalog suchen, eine Kategorie wählen und das gewünschte Objekt anklicken. Nach Eingabe der sichtbaren Breite wird das Element als Tile in der Mitte der geöffneten Szene auf der ausgewählten Ebene platziert. Anschließend verschieben und drehen.

Rasterdistanz und transparenter Rand werden bei der Größenberechnung berücksichtigt. Bei 100 Pixeln pro Kästchen und 1 m Rasterdistanz entspricht ein Meter sichtbarer Objektbreite 100 Pixeln. Das Seitenverhältnis bleibt erhalten. Die angegebenen Größen sind Gestaltungsvorschläge.

Alle 277 PNG-Originale wurden verlustfrei in WebP umkodiert und nach dem Dekodieren pixelgenau einschließlich Transparenz verglichen. Rund 296 MB statt 439 MB Bilddaten; die ursprünglichen PNG-Pfade im Abenteuerpaket bleiben erhalten. Als Modulquelle und installierte Kopie benötigt das neue Paket auf dem Host insgesamt rund 592 MB zusätzlich, vor Backups.

Die vorhandene Deployment-Action erfasst das neue Modul automatisch. Manuell installierte Module und Welten bleiben erhalten. Der Pull Request löst kein Deployment aus; erst das Zusammenführen auf main.

Prüfung: Dateivollständigkeit und Prüfsummen, alle acht Kategorien, Suche, Tile-Maßstab einschließlich transparentem Rand und Maßeinheiten, Auswahl der Foundry-14-Ebene, Schutz vor fehlenden Bildern und Szenenwechsel, GM-Berechtigung und Startmenü. Browserbedienung wurde mit simuliertem Foundry-Kontext geprüft; kein Live-Test in einer Foundry-14-Welt.
