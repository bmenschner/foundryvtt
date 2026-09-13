# SR6 – Mehrere Schicksalswürfel

Ergänzung für Foundry V14 und **shadowrun6-eden 4.0.7**. Der normale Würfeldialog bekommt zwei Zahlenfelder: Schicksalswürfel im vorhandenen Pool verwenden und zusätzliche Schicksalswürfel hinzufügen. Die bestehende Chatkarte und Erfolgs-/Patzer-Auswertung des Systems werden verwendet. Keine Systemdateien werden geändert.

## Installation

1. ZIP entpacken.
2. Den Ordner `sr6-multiple-wild-dice` in den Benutzerdatenordner von Foundry unter `Data/modules/` kopieren. Direkt darin muss die `module.json` liegen.
3. Foundry neu starten und das Modul in der Welt unter „Module verwalten“ aktivieren.
4. Vom Charakterbogen eine normale Probe öffnen. Im bisherigen Schicksalswürfel-Feld die zu ersetzenden Würfel und darunter bei „Schicksalswürfel hinzufügen“ die zusätzlichen Würfel eintragen.

Unter der Beschriftung steht ein kleiner „(Hinweis)“-Link. Der Infotext erscheint beim Darüberfahren oder Tastaturfokus. Ein Klick hält ihn offen; ein weiterer Klick, Escape oder das Verlassen per Tastatur schließt ihn.

Version 1.0.2 korrigiert die Platzierung unter der Schicksalswürfel-Beschriftung. Die Darstellung ist direkt am Hinweis hinterlegt, damit auch bei fehlenden Modul-Styles ein kleiner Link und ein kontrastreiches Popup erscheinen. Das Popup liegt über dem scrollbaren Dialog und weicht am unteren Fensterrand nach oben aus.

## Pool und Auswertung

### Einzelgänger (ab Version 1.2.0)

Unter den Schicksalswürfel-Feldern steht die Checkbox **Einzelgänger (+1 W6)**. Sie ist in jedem neuen Dialog ausgeschaltet und erhöht bei Auswahl den Basis-Pool um einen normalen Würfel. Beispiel: Pool 12, verwenden 3, hinzufügen 2 und Einzelgänger ergibt 15 Würfel, davon 5 Schicksalswürfel. Der Bonus wird beim Absenden einmalig angewendet; die Pool-Vorschau des Systems enthält ihn vor dem Absenden noch nicht.

Die manuelle +1-Regel entspricht dem bisherigen Matrix-Makro der Spielrunde. Das Modul prüft weder den Vorteil am Charakter noch seine situationsabhängigen Voraussetzungen. Nur aktivieren, wenn der Bonus für diese Probe gelten soll, und nicht zusätzlich im Pool-Modifikator eintragen. Normale Abzüge und die Pool-Obergrenze des Systems gelten weiterhin.

Zum Prüfen: Pool 12 ohne Schicksalswürfel mit ausgeschalteter Checkbox ergibt 12 normale Würfel, eingeschaltet 13. Mehrfaches Ein-/Ausschalten darf den Bonus nicht aufsummieren; neu geöffnete Dialoge starten wieder ausgeschaltet.

Die beiden Felder haben unterschiedliche Funktionen und lassen sich kombinieren:

| Vorhandener Pool | Verwenden (ersetzen) | Hinzufügen | Ergebnis |
|---|---|---|---|
| 12 | 3 | 0 | 9 normale W6 + 3 Schicksalswürfel = 12 |
| 12 | 0 | 3 | 12 normale W6 + 3 Schicksalswürfel = 15 |
| 12 | 3 | 2 | 9 normale W6 + 5 Schicksalswürfel = 14 |

Zusätzliche Schicksalswürfel **nicht noch einmal im Pool-Modifikator eintragen**. Gewährt Ausrüstung 3 zusätzliche Schicksalswürfel, reicht der Wert 3 im neuen Feld.

Die zusätzlichen Würfel erhöhen den Basis-Pool vor den normalen Abzügen und der Pool-Obergrenze des Systems. Schicksalswürfel werden insgesamt auf den tatsächlich verfügbaren Pool begrenzt; das Ersetzen betrifft nur dessen verbleibenden ursprünglichen Anteil. Beide Felder erlauben ganze Zahlen von 0 bis 100. Die Auswahl gilt für den aktuellen Dialog und wird nicht dauerhaft am Charakter gespeichert.

Die Auswertung folgt Eden: Jeder erfolgreiche Schicksalswürfel zählt dreifach; eine Schicksals-1 annulliert die 5en im betreffenden Wurf, auch die 5 anderer Schicksalswürfel. Mehrere Einsen erhöhen diese Wirkung nicht weiter.

## Grenzen dieser Version

- Mehrere Schicksalswürfel mit explodierenden Sechsen sind gesperrt: Die aktuelle Eden-Auswertung unterscheidet Folgewürfel dafür nicht zuverlässig. Ein einzelner Schicksalswürfel verwendet weiterhin das unveränderte Systemverhalten.
- Ausgedehnte Proben mit mehreren Schicksalswürfeln bitte mit Schwellenwert 0 einzeln pro Intervall ausführen. Die automatische Intervallserie des Systems kann sonst negative normale Würfelzahlen erzeugen.
- Die Einschränkungen gelten für die Summe aus verwendeten und hinzugefügten Schicksalswürfeln. Vor „Erfolge kaufen“ beide Felder auf 0 setzen.
- Keine zusätzlichen Automationen für Turbolader-Schaden oder besondere Edge-Vorteile.
- Für 4.0.7 anhand des öffentlichen Quellcodes geprüft. Noch nicht in einer laufenden Foundry-V14-Welt getestet. Bei späteren Systemupdates kann eine Anpassung nötig sein.

## Kurzer Test in deiner Welt

Eine normale Probe mit Pool 8 und 3 Schicksalswürfeln ausführen: Die Chatkarte muss insgesamt 8 Würfel zeigen, davon 3 markierte Schicksalswürfel. Danach mit 0 und 1 testen. Einen Pool von 2 mit Auswahl 3 testen: Es dürfen insgesamt nur 2 Würfel erscheinen. Bei mehreren gleichzeitig geöffneten Charakterdialogen müssen die Auswahlen unabhängig bleiben.

Zusätzlich Pool 12, verwenden 0, hinzufügen 3 testen: Es müssen 15 Würfel erscheinen, davon 3 Schicksalswürfel. Mit verwenden 3 und hinzufügen 2 müssen es 14 Würfel sein, davon 5 Schicksalswürfel.

## Entfernen

Modul deaktivieren und Welt neu laden. Es werden keine Charakterdaten verändert.

Referenz: https://github.com/yjeroen/foundry-shadowrun6-eden (Systemstand 4.0.7).
