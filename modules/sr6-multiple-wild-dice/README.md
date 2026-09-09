# SR6 – Mehrere Schicksalswürfel

Ergänzung für Foundry V14 und **shadowrun6-eden 4.0.7**. Der normale Würfeldialog bekommt anstelle des Schicksalswürfel-Kästchens ein Zahlenfeld. Die bestehende Chatkarte und Erfolgs-/Patzer-Auswertung des Systems werden verwendet. Keine Systemdateien werden geändert.

## Installation

1. ZIP entpacken.
2. Den Ordner `sr6-multiple-wild-dice` in den Benutzerdatenordner von Foundry unter `Data/modules/` kopieren. Direkt darin muss die `module.json` liegen.
3. Foundry neu starten und das Modul in der Welt unter „Module verwalten“ aktivieren.
4. Vom Charakterbogen eine normale Probe öffnen und bei „Schicksalswürfel“ die gewünschte Anzahl eintragen.

Unter der Beschriftung steht ein kleiner „(Hinweis)“-Link. Der Infotext erscheint beim Darüberfahren oder Tastaturfokus. Ein Klick hält ihn offen; ein weiterer Klick, Escape oder das Verlassen per Tastatur schließt ihn.

Version 1.0.2 korrigiert die Platzierung unter der Schicksalswürfel-Beschriftung. Die Darstellung ist direkt am Hinweis hinterlegt, damit auch bei fehlenden Modul-Styles ein kleiner Link und ein kontrastreiches Popup erscheinen. Das Popup liegt über dem scrollbaren Dialog und weicht am unteren Fensterrand nach oben aus.

## Pool und Auswertung

Die Anzahl ist **Teil des Gesamtpools**. Beispiel: Gesamtpool 12, Schicksalswürfel 3 ergibt 9 normale W6 und 3 Schicksalswürfel. Gewährt Ausrüstung 3 zusätzliche Schicksalswürfel auf einen bisherigen Pool von 12, zuerst den Modifikator um 3 erhöhen und dann 3 Schicksalswürfel auswählen: insgesamt 15 Würfel.

Die Anzahl wird nach Pool-Abzügen auf den tatsächlich verfügbaren Pool begrenzt. Die Auswahl gilt für den aktuellen Dialog und wird nicht dauerhaft am Charakter gespeichert.

Die Auswertung folgt Eden: Jeder erfolgreiche Schicksalswürfel zählt dreifach; eine Schicksals-1 annulliert die 5en im betreffenden Wurf, auch die 5 anderer Schicksalswürfel. Mehrere Einsen erhöhen diese Wirkung nicht weiter.

## Grenzen dieser Version

- Mehrere Schicksalswürfel mit explodierenden Sechsen sind gesperrt: Die aktuelle Eden-Auswertung unterscheidet Folgewürfel dafür nicht zuverlässig. Ein einzelner Schicksalswürfel verwendet weiterhin das unveränderte Systemverhalten.
- Ausgedehnte Proben mit mehreren Schicksalswürfeln bitte mit Schwellenwert 0 einzeln pro Intervall ausführen. Die automatische Intervallserie des Systems kann sonst negative normale Würfelzahlen erzeugen.
- Vor „Erfolge kaufen“ die Anzahl auf 0 setzen.
- Keine zusätzlichen Automationen für Turbolader-Schaden oder besondere Edge-Vorteile.
- Für 4.0.7 anhand des öffentlichen Quellcodes geprüft. Noch nicht in einer laufenden Foundry-V14-Welt getestet. Bei späteren Systemupdates kann eine Anpassung nötig sein.

## Kurzer Test in deiner Welt

Eine normale Probe mit Pool 8 und 3 Schicksalswürfeln ausführen: Die Chatkarte muss insgesamt 8 Würfel zeigen, davon 3 markierte Schicksalswürfel. Danach mit 0 und 1 testen. Einen Pool von 2 mit Auswahl 3 testen: Es dürfen insgesamt nur 2 Würfel erscheinen. Bei mehreren gleichzeitig geöffneten Charakterdialogen müssen die Auswahlen unabhängig bleiben.

## Entfernen

Modul deaktivieren und Welt neu laden. Es werden keine Charakterdaten verändert.

Referenz: https://github.com/yjeroen/foundry-shadowrun6-eden (Systemstand 4.0.7).
