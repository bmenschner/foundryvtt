# Grimmes Erwachen – Abenteuerpaket für Foundry 14

Version 1.1.0 ergänzt Szenenhintergründe auf nativen Foundry-14-Ebenen, 71 individuelle Porträts und Bildseiten in den Hauptjournals. Bereits importierte Welten über **Abenteuer importieren → Bilder ergänzen / reparieren** aktualisieren. Die [Schritt-für-Schritt-Anleitung](grimmes-erwachen-bilder.md) beschreibt die Bildkorrektur. Dieses Update wird zunächst als Pull Request bereitgestellt; es wird nicht automatisch auf den Server übertragen.

Ziel: **Foundry VTT 14.367 (Stable)** und **Shadowrun 6 Eden 4.0.8**, System-ID `shadowrun6-eden`. Stand: 8. September 2026.

Enthalten sind die drei Abenteuer **Spuk in der Wolfsburg**, **Zucker für die Kinder** und **Ring aus Feuer**, aufbereitet nach der bereitgestellten PDF *Grimms Erwachen*. Der Paket- und Bildtitel folgt deinem gewünschten Wortlaut „Grimmes Erwachen“.

## Inhalt

| Inhalt | Umfang |
|---|---:|
| Taktische Karten als UVTT und Foundry-Szenen | 30 |
| Hintergrundszenen, jeweils 3840 × 2160 Pixel / 16:9 | 4 |
| NSC, Gegner und Kreaturen mit eigenen SR6-Arbeitswerten | 71 |
| Matrix-Hosts für die Eden-4-Integration | 4 |
| Eingebettete IC-Profile | 17 |
| Journals, einschließlich Kartenhilfen und Handouts | 39 / 143 Seiten |
| Individuelle Porträts für NSC, Geister und Kreaturen | 71 |

Alle taktischen Szenen verwenden **1 Kästchen = 1 Meter**. Sie enthalten Wände, Türen, Lichtquellen, vorbereitete Tokens und Journalnotizen. Die Hintergrundszenen sind rasterlos. Das Titelbild trägt unten „Grimmes Erwachen“.

## Empfohlener Import: gesamtes Abenteuerpaket

1. ZIP vollständig entpacken. Im entpackten Paket befindet sich der Ordner **grimmes-erwachen** mit `module.json`, `importer.mjs`, `assets` und `data`.
2. Diesen ganzen Ordner in den **Benutzerdatenordner eurer Foundry-14-Installation unter `Data/modules/`** kopieren. Die resultierende Datei muss `Data/modules/grimmes-erwachen/module.json` heißen. Der Benutzerdatenordner eurer tatsächlichen Installation zählt; die auf diesem Rechner zusätzlich gefundene Foundry-13-Installation ist nicht das Ziel.
3. Foundry neu starten, eure SR6-Welt öffnen und unter **Module verwalten** „Grimmes Erwachen – drei Abenteuer für SR6“ aktivieren.
4. **Spieleinstellungen → Einstellungen konfigurieren → Grimmes Erwachen → Abenteuer importieren** öffnen. Alternativ im Makroverzeichnis **„Grimmes Erwachen – Import starten“** ausführen. Aktivieren des Moduls allein importiert noch keine Abenteuer.
5. Alle drei Abenteuer oder ein einzelnes Kapitel auswählen und **Komplettpaket importieren** anklicken.
6. Die Ordner **Grimmes Erwachen** im Szenen-, Actor- und Journalverzeichnis öffnen. Zum Einstieg das Kapiteljournal und die gewünschte Hintergrundszene verwenden.

Falls das Startmakro nicht automatisch erscheint: Ein Script-Makro anlegen und diesen Inhalt ausführen:

```js
await game.modules.get("grimmes-erwachen").api.showImporter();
```

Das Begleitmodul erledigt den gesamten Import; zusätzliches Importieren derselben UVTT-Karten ist dabei nicht erforderlich. Bilder bleiben im Modulordner und müssen dort verfügbar bleiben.

Der Import prüft die Daten mit den Klassen eurer laufenden Foundry-14-/Eden-Installation und überführt ältere Szenenfelder in die aktuelle Ebenenstruktur. Anschließend legt er Inhalte kapitelweise an. Bereits importierte Dokumente werden übersprungen und eigene Änderungen daran erhalten. Nach einem abgebrochenen Import lässt sich das Makro erneut ausführen. **„Nur Szenen und Journals“** legt keine Tokens an; späteres Komplettimportieren ergänzt bei bereits angelegten Szenen nicht automatisch die fehlenden Tokens. Für diese Option die gewünschten NSC anschließend aus dem Actorverzeichnis aufziehen.

## Matrix-Integration

Vier Actors vom nativen Typ **host** sind vorbereitet:

| Host | Stufe | Angriff / Schleicher / Datenverarbeitung / Firewall |
|---|---:|---|
| Rathaus Wolfsburg | 6 | 6 / 7 / 9 / 8 |
| Sanders – Wohnhaus | 4 | 4 / 5 / 7 / 6 |
| Sanders – Sternschutz | 7 | 9 / 7 / 8 / 10 |
| Schloss Wolfsburg | 3 | 3 / 4 / 6 / 5 |

Die Hosts enthalten native Software-Items vom Typ IC und elektronische Geräte. Hosts bei Bedarf auf eine Szene ziehen und IC beziehungsweise Geräte über die Bereitstellungsfunktion des Hostbogens einsetzen. Die nummerierten IC-Namen beschreiben die Alarmfolge; sie starten keinen selbsttätigen Alarmablauf. Zugriffsrechte und Matrix-Aktionen verwaltet das SR6-System. Die Detailanleitung steht im Journal **„Matrix – Hosts und Zugriff“**.

Die lokale Trennung wichtiger Datenspeicher bleibt erhalten: Praxisakten, Amtsunterlagen und Walthers Arbeitsterminal sind nicht einfach nach einem Host-Hack verfügbar. Für die verlassene Fabrik wurde kein zusätzlicher aktiver Host erfunden. Vollständig ausgerüstete Decker-Personas und individuelle PANs für alle NSC sind nicht enthalten.

## Alternativ: ausschließlich UVTT-Karten

UVTT überträgt Kartenbild, Raster, Sichtwände, Türen und Lichtquellen. **NSC, Journals und Matrix-Hosts gehören nicht zum UVTT-Standard** und liegen deshalb im Begleitmodul.

Die 30 Dateien befinden sich im Ordner `uvtt`. Mit einer für Foundry 14 geeigneten Version des **Universal Battlemap Importer** importieren. Bildversatz 0 / 0 beibehalten und die in jeder Datei gespeicherten Pixel je Kästchen verwenden. Anschließend in der Szene **Rasterabstand 1, Einheit m** prüfen. UVTT selbst definiert keine universell ausgewertete physische Maßeinheit.

Das optionale Script-Makro `UVTT-auf-1m.js` stellt erkannte Karten dieses Pakets auf ihre Rastergröße und 1 m um. Dazu muss der Begleitmodulordner bereits vorhanden sein. Es ist für frische Imports mit unveränderten Abmessungen und Namen vorgesehen. Bei zuvor manuell geänderten Lichtradien diese anschließend kontrollieren. Transparente Fenster aus dem Begleitmodul sind in den UVTT-Dateien als gewöhnliche Sichtwände vereinfacht. Türen sind im Import zunächst geschlossen; ein im Abenteuer offenes Tor bei Szenenbeginn öffnen.

## Karten, Bilder und Spielwerte

- **Kartenatlas:** `dokumentation/Kartenatlas.html` im Browser öffnen. Er zeigt alle 30 nummerierten Spielleitungsvorschauen samt Raumlisten. Die eigentlichen Spielerbilder unter `assets/maps` enthalten keine Raumnummern und kein eingebranntes Raster.
- Die Karten sind eigens ausgearbeitete, schematische Grundrisse. Bekannte Maße aus der Vorlage sind berücksichtigt, darunter das 80 × 100 m große Sanders-Grundstück, die 4 × 4 m große Turmstube und der Feuerring mit 5 m Durchmesser. Andere Außenmaße und viele Einrichtungsdetails sind ergänzte Spielleitungsannahmen und im Kartenjournal gekennzeichnet. Es sind keine originalgetreuen Vermessungen aller Schauplätze.
- Das Schloss ist als spielbarer Ausschnitt mit Hof und Flügeln angelegt; seine über 80 Räume sind nicht sämtlich rekonstruiert. Das 56 m tiefe Heidenloch ist auf der Karte als Schachtöffnung dargestellt; Höhen und Abstieg stehen im Journal. Das Trainingscamp zeigt einen Unterkunftsausschnitt.
- Begegnungen sind überwiegend für vier Runner vorbereitet. Gruppenabhängige Gegnerzahlen vor dem Spiel anpassen. Verborgene Gegner-Tokens erst zur passenden Szene aufdecken. Einige alternative Waldgegner sind gleichzeitig als verborgene Aufstellungsvorschläge vorhanden; nicht alle müssen in derselben Begegnung auftreten.
- NSC-Werte sind eine **eigene SR6-Arbeitsadaption der SR5-Vorlage**, keine offizielle Konvertierung. Rollenprofile und vereinfachte Waffenwerte wurden ergänzt. Geister und Kreaturen verwenden bewusst den flexiblen NPC-Bogen, um individuelle Werte beizubehalten; Sonderkräfte sind Referenzeinträge und teilweise manuell abzuwickeln. Die 71 NSC und Kreaturen erhalten individuelle Porträts; die Bildkorrektur ersetzt die alten Monogramme und erhält selbst gewählte Bilder.
- Die vier atmosphärischen Bilder wurden generiert und auf tatsächliche **3840 × 2160 Pixel** hochskaliert. Perspektivische Stimmungsbilder besitzen keinen metrischen Kartenmaßstab. Die taktischen Karten behalten ihr zum Grundriss passendes Seitenverhältnis.
- Journals enthalten eigene Zusammenfassungen, Ablaufhilfen und kurze Handouts. Für vollständige Originaltexte und besondere Regeldetails die bereitgestellte PDF verwenden. Das Paket ist keine vollständige Reproduktion der Publikation.

## Prüfung

Bildabmessungen und eingebettete UVTT-Bilder, Maßstab, Wand-/Türüberlagerungen, Token-Grenzen, eindeutige IDs, Bildpfade und Journalverknüpfungen wurden automatisch geprüft. Alle vier Hintergrundbilder sind 16:9 in UHD. Die Kartenübersicht und Titelvorschau wurden visuell kontrolliert.

Die ursprünglichen Dokumentdaten wurden offline mit der lokal verfügbaren Foundry-13.351-Datenbibliothek und den Host-/Software-Datenmodellen von Eden 4.0.8 geprüft. Dieser ältere Test deckt die neuen Foundry-14-Ebenen nicht ab. Aktuelle Tests mit simulierten Dokumentklassen prüfen Vollimport, Wiederholung, ID-Kollisionen, Kapitelwahl, Bildkorrektur und Abbruch bei fehlenden oder verworfenen Hintergründen. Zusätzliche Pakettests prüfen die Zuordnung sämtlicher Porträts, Bildseiten und Szenenebenen. **Dies ersetzt keinen Live-Importtest in Foundry 14.367.** Das Modul ist daher nicht als live „verified“ deklariert; die Vorprüfung beim Import erfolgt gegen eure tatsächliche Zielinstallation.

Maschinenlesbare Ergebnisse: `dokumentation/Pruefbericht.json`, `dokumentation/Importtest.json`, `dokumentation/Schematest.json`. Der Schematest umfasst 360 Dokumente einschließlich eingebetteter Items.

## Quellen

- Bereitgestellte PDF: `Shadowrun 5D - Grimmes Erwachen.pdf`, Publikationstitel *Grimms Erwachen*: Spuk in der Wolfsburg S. 5–24, Zucker für die Kinder S. 25–37, Ring aus Feuer S. 38–59; Handouts im Anhang. Seitenverweise im Paket beziehen sich auf gedruckte Seiten.
- [Foundry 14.367 Stable](https://foundryvtt.com/releases/14.367)
- [Shadowrun 6 Eden – Paket und Versionen](https://foundryvtt.com/packages/shadowrun6-eden)
- [Eden 4.0.8 – Originalquellcode](https://github.com/yjeroen/foundry-shadowrun6-eden/tree/release-4.0.8)
- [Universal VTT – Format](https://arkenforge.com/universal-vtt-files/)
- [Universal Battlemap Importer](https://github.com/moo-man/FVTT-DD-Import)
- [Foundry 14 – Szenen-Datenmodell](https://foundryvtt.com/api/v14/classes/foundry.documents.BaseScene.html)

Private Aufbereitung für deine Spielrunde; kein offizielles Pegasus-/Catalyst-Produkt.
