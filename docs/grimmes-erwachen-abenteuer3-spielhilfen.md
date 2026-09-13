# Abenteuer 3 – Beschreibungen und Spielhilfen (1.2.5)

Nur Kapitel 3 wird erweitert. Die 28 vorhandenen NSC-/Geister-Actors erhalten ausführlichere Beschreibungen von Erscheinung und Auftreten. Die Texte sind sinngemäße Aufbereitungen des bereitgestellten Abenteuerbandes mit gedruckten Seitenangaben. Nicht beschriebene äußere Merkmale werden ausdrücklich offengelassen. Porträts, Werte, Ausrüstung und sämtliche Matrix-Hosts bleiben unverändert.

Neue Journals im Ordner **Grimmes Erwachen → 03 – Ring aus Feuer**:

- **Hauptdarsteller – Heidelberg (GM)**: Übersicht und 28 Figurenseiten mit Porträt, Actor-Link, Erscheinung, Hintergrund, Wissen und Quellen. Der eigentliche Hauptdarsteller-Abschnitt des Bands (S. 58) behandelt Lucas und die Walküren; die übrigen Figuren wurden aus den Szenen ergänzt. Enthält Täterwissen und Auflösung, nicht pauschal an Spieler freigeben.
- **Beinarbeit – Heidelberg (GM)**: acht Seiten, darunter sechs Tabellen zu Marlon, Celine, den Ermittlungen, Walküren, Heiligenberg und DFB-Camp. Mit Zugangswegen, Quellenrängen, Quellenzeiten und einer Seite zu magischen Spuren. Die SR5-Ränge sind ausdrücklich keine neuen SR6-Schwellenwerte. Die Spielleitung wickelt Proben nach dem genutzten SR6-Regelstand ab.
- **Handout – Krankenakte Celine (ausführlich)**: eigenständiger, bei Bedarf teilbarer Aktenauszug nach S. 59; keine Täter- oder Alchera-Auflösung. Die bereits vorhandene Kurzfassung bleibt erhalten.

Alle Journals starten mit Standardberechtigung 0 und vererbten Seitenrechten. Die Krankenakte bei passender Gelegenheit gezielt zeigen. Die Jahr- und Wochentagswidersprüche der Vorlage werden nicht in die 2080-Kampagne übertragen.

## Heute in der bestehenden Welt verwenden

Nach Merge und erfolgreicher Deploy-Action Welt neu laden. **Grimmes Erwachen – Import starten → Abenteuer 3 → Inhalte aktualisieren** ergänzt die drei Journals und aktualisiert die Beschreibungen.

Der bisherige Import überspringt vorhandene Actors. Deshalb gibt es nun eine eng begrenzte Ergänzung: Nur ein leeres Beschreibungsfeld oder der exakt bekannte alte Kurztext des betreffenden Kapitel-3-Actors wird ersetzt. Jede abweichende eigene Beschreibung bleibt erhalten. In diesem Fall findet ihr den vollständigen neuen Text trotzdem im Hauptdarsteller-Journal. Die Abschlussmeldung nennt aktualisierte und geschützte Beschreibungen. Eine wiederholte Aktualisierung erzeugt keine Duplikate und verändert eigene Texte nicht.

Nur das Feld `system.description` wird bei diesen bestehenden Actors geändert. Notizen, Bilder, Werte, Ausrüstung, Tokens und fremde Actors bleiben erhalten. Die Auswahl von Kapitel 1 oder 2 verändert Kapitel-3-Beschreibungen nicht. Die neuen Journals sind separate Dokumente; eigene vorhandene Journaltexte bleiben unverändert.

## Quellen und Prüfung

Bereitgestelltes PDF **Grimms Erwachen**, Ring aus Feuer, S. 40–59: Szenen für Nebenfiguren, Beinarbeit S. 55–57, Hauptdarsteller S. 58, Krankenakte S. 59. Die Finale-Hilfe stellt die zwei vom Band angebotenen Ausgänge für die Vermissten nebeneinander, ohne einen davon vorzugeben. Das Heidenloch und die später auf einem Nachbargipfel erscheinende Alchera werden unterschieden.

Importtests prüfen das Upgrade aus 1.2.4, eigene Beschreibungen und Notizen, unveränderte Werte/Bilder, Wiederholung ohne Duplikate und Kapitelbegrenzung. Inhaltsprüfungen prüfen vollständige Figurenabdeckung, Journalrechte und Verweise. Kein Live-Test in Foundry 14. Deploy-Skripte, GitHub Action und Behandlung manuell installierter Module bleiben unverändert.
