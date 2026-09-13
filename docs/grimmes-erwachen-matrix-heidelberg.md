# Heidelberg: sechs Matrix-Hosts für Abenteuer 3

Modul **1.2.4** ergänzt sechs Host-Actors, 28 Software-IC, zwölf elektronische Geräteprofile und das achtseitige Journal **Matrix – Heidelberg: Hosts und Ermittlungen**. Die vier bisherigen Hosts und alle bestehenden Abenteuerdaten bleiben erhalten. Insgesamt enthält das Paket zehn Hosts und 45 IC-Profile.

| Host | Stufe | Angriff / Schleicher / Datenverarbeitung / Firewall | IC-Folge |
|---|---:|---|---|
| Uniklinik Heidelberg – Neurologie | 6 | 6 / 7 / 8 / 9 | Patrouille, Marker, Binder, Aufspüren, Störer, Killer |
| DFB-Camp Heidelberg – Turnierverwaltung | 4 | 4 / 5 / 7 / 6 | Patrouille, Marker, Aufspüren, Blaster |
| Cocktail Club – Altes Hallenbad | 3 | 3 / 4 / 6 / 5 | Patrouille, Marker, Blaster |
| Heiligenberg – Festspielgelände | 4 | 4 / 5 / 7 / 6 | Patrouille, Marker, Störer, Blaster |
| AGC Heidelberg – Standortverwaltung | 7 | 8 / 7 / 9 / 10 | Patrouille, Marker, Binder, Aufspüren, Störer, Killer |
| Sternschutz Heidelberg – Einsatz und Fallakten | 6 | 8 / 6 / 7 / 9 | Patrouille, Marker, Aufspüren, Binder, Killer |

## Quellen und Adaption

Die bereitgestellte Abenteuerquelle **Grimms Erwachen**, gedruckte S. 40–58, beschreibt die Schauplätze und Beinarbeit. Auf S. 55 überlässt sie der Spielleitung die Zuordnung zu öffentlichen Informationen, gesicherten Hosts und nicht digital zugänglichen Hinweisen. Sie enthält für diese sechs Standorte **keine vollständigen Hoststatblocks**. Sämtliche Hostwerte, IC-Folgen, Geräte und Datenfreigaben hier sind eigene SR6-Adaptionen, in den Daten entsprechend gekennzeichnet.

- **Klinik (S. 45–47, 56):** neurologische Behandlung, Fundprotokoll in der Akte und Sicherheitsdienst. Vertrauliche Akten als Rechercheweg; keine digitale Heilung oder Tatkamera.
- **DFB (S. 43–44, 50, 57):** verspätete Abwesenheitsmeldungen, Unterkünfte am Neckar und Zusammenhang mit Niederlagen. Die zusammengeführte Datenablage ist eine Ergänzung.
- **Cocktail Club (S. 41–43):** Treffpunkt im vierten Stock. Reservierungen und Servicezugriff als optionale Hilfen; keine Aufzeichnung des Auftrags. Lucas' toter Matrixbriefkasten gehört nicht zum Host.
- **Festspiele (S. 47–49, 56–57):** AR, Tickets und Hinweise auf Reinigungskraft und Wachmann. Ein ergänzter Dienstplan führt zu diesen Zeugen; ihre Aussagen werden nicht als vorhandene digitale Beweise erfunden.
- **AGC (S. 40–43, 56, 58):** lokaler Konzernstandort, Lucas' Position und Kultursponsoring. Sein Auftrag bleibt privat, Forschungsnetze bleiben separate Ziele.
- **Sternschutz (S. 40–41, 46–47, 56):** Fundmeldung, Rettungseinsatz, eingeschränkte Spurensicherung und Fallabschluss. Keine sichere Täterkenntnis oder automatische vollständige Sammlung der DFB-Fälle.

Die Kampagne bleibt in **2080**. Die Vorlage nennt 2081 und widersprüchliche Zeitangaben zum Fallabschluss. Das Journal verwendet deshalb eine relative Ereignisfolge statt ungeprüfter Kalenderdaten. Anzahl der Vermissten und Stand der Meldungen richten sich nach dem Spieltag.

Regel- und Systemabgleich: [offizielle SR6-FAQ, Matrix](https://shadowrunsixthworld.com/shadowrun-sixth-world-faq/) sowie die [Eden-Datenmodelle release-4.0.8](https://github.com/yjeroen/foundry-shadowrun6-eden/tree/release-4.0.8/module/datamodels). Die FAQ begrenzt die Bereitstellung auf ein zusätzliches IC pro Runde und IC auf ihren jeweiligen Host. Die alten SR5-Suchproben und Limits wurden nicht als SR6-Regeln übernommen.

## Import und Verwendung

Nach Merge und erfolgreicher Deploy-Action: Welt neu laden, **Grimmes Erwachen – Import starten → Abenteuer 3 → Inhalte aktualisieren**. Das ergänzt die sechs Hosts und das neue Journal. Kein UVTT-Neuimport und kein separates ZIP nötig. Hosts sind Actors und Journals sind Foundry-Dokumente; UVTT bleibt für Karten zuständig.

Actors und Journal befinden sich in **Grimmes Erwachen → 03 – Ring aus Feuer** in ihren jeweiligen Verzeichnissen. Host öffnen, bei Bedarf als verknüpften Token platzieren und IC/Geräte mit Edens Bereitstellungsfunktion einsetzen. Nur Patrouille startet aktiv. Die Ziffern geben die vorgesehene Alarmfolge an; sie starten nichts automatisch. Spinnen-Actors und zusätzliche Matrixbilder sind nicht Teil dieser Erweiterung.

Die vertraulichen Rechercheergebnisse liegen ausschließlich im GM-Journal, nicht in der Iconbeschreibung eines möglicherweise sichtbar gemachten Hosts. Die beschriebenen Rollen und Dateiablagen sind Spielleitungsinhalt, keine zusätzliche programmierte Zugriffsverwaltung. Beide Dokumentarten werden mit Standardberechtigung 0 importiert. Bestehende individuell veränderte Hosts und Journaltexte werden nicht überschrieben; das ältere Matrixjournal von Kapitel 1 bleibt deshalb unverändert und wird durch das neue ergänzt.

## Prüfung

- Upgrade einer simulierten bestehenden Welt: genau sechs Actors und ein Journal, keine neuen Szenen; erneuter Aufruf ohne Duplikate.
- Eigene Hostwerte, IC-Zustände, Journaltexte und Szenen bleiben erhalten. Ein Import ohne Actors entfernt Actor-Links aus dem neuen Journal.
- Host-/IC-Daten zusätzlich offline mit echten Eden-4.0.8-Datenmodellen geprüft. Die verfügbare lokale Foundry-Kernbibliothek ist 13.351: Dies ist **kein Live-Nachweis für Foundry 14**. Geräte verwenden das bereits etablierte Profilformat des Pakets.
- Deploy-Skripte, Workflow, Weltdatenbehandlung und Assets-Modul unverändert.
