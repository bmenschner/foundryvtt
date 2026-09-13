# Host-Icons korrigieren (1.2.6)

Alle zehn Hosts verwenden für Actorbild und Prototyp-Token jetzt den angegebenen Systempfad:

`systems/shadowrun6-eden/icons/compendium/black-chrome/ziggurat-city-database.svg`

Nach Merge und erfolgreicher Deploy-Action Welt neu laden. Im Abenteuerimport **Alle drei Abenteuer → Bilder ergänzen / reparieren** wählen. Alternativ führt **Inhalte aktualisieren** dieselbe Reparatur mit aus. Kein Neuimport nötig.

Die Reparatur ersetzt nur leere Bilder und den bisherigen Paketpfad `icons/svg/circuit.svg`. Eigene abweichende Bilder bleiben erhalten. Bereits platzierte Host-Tokens werden auch auf persönlichen Szenen korrigiert, sofern sie auf einen ausgewählten Paket-Host verweisen. Bereitgestellte IC-/Geräte-Tokens mit Edens `deployedItemUuid` werden ausgelassen. Werte, Positionen, Ausrüstung und andere Actors bleiben unverändert.

Der Pfad wird aus der installierten Eden-Version geladen; das Paket kopiert das System-Icon nicht. Import- und Reparaturtests prüfen die Korrektur, Wiederholbarkeit, Kapitelbegrenzung und den Erhalt eigener Bilder. Kein Live-Test auf dem VPS. Deployment und Schutz manuell installierter Module unverändert.
