# Roll20 Macro Compatibility · 0.2.0

Roll20-Makros in Foundry V14 verwenden, ohne den gespeicherten Text umzuwandeln.
Das Modul liest den unveränderten Makrotext bei jedem Aufruf, stellt die Abfragen
und führt die resultierenden Würfe und Nachrichten mit Foundrys APIs aus.

## Für Spieler

1. In Foundry ein Makro anlegen und **Typ: Chat** wählen.
2. Den kompletten Roll20-Makrotext in das Befehlsfeld einfügen und speichern.
3. Das Makro ausführen oder in die Schnellleiste ziehen.
4. Die Abfragen beantworten. Das Ergebnis erscheint als Chatkarte.

Kein JavaScript, kein vorangestellter Modulbefehl und kein Konvertieren erforderlich.
Die automatische Erkennung erfasst die drei mitgelieferten Spielerbeispiele.
Im Makrofenster kann „Makrosprache“ ausdrücklich auf **Roll20** oder auf
**Foundry (unverändert)** gesetzt werden. Script-Makros bleiben immer unverändert.
Für bestehende Foundry-Chat-Makros mit Foundry-spezifischer Syntax diese letzte
Option verwenden: Manche Würfelkürzel haben in Roll20 eine andere Bedeutung.

## Installation über dieses Repository

Nach dem Merge installiert die bestehende Server-Action das Modul aus
`modules/roll20-macro-compat`. Die Spielleitung aktiviert es einmalig unter
„Module verwalten“ und alle Spieler laden die Seite neu.
Alternativ den Modulordner aus dem ZIP nach `Data/modules/` kopieren und Foundry neu starten.
Das Modul benötigt keine weiteren Module und funktioniert neben den SR6-Schicksalswürfeln.

## Mit den Originalmakros geprüft

| Spielerbeispiel | Verhalten |
|---|---|
| Geist beschwören | default-Chatkarte, Stufe nur einmal abfragen, verschachtelte Würfelanzahl und Edge-Button |
| Entzug | Mehrzeilige Vorlage bleibt eine Karte; Erfolgszahl wird vom angegebenen Entzug abgezogen |
| Proben | Würfelpool nur einmal abfragen; fünf unabhängige Pools; zählen, wie viele den Schwellenwert erreichen |

Die unveränderten Beispiele liegen unter `tests/fixtures/`.
Wie in Roll20 bedeutet `d6>5`: **5 oder 6 sind Erfolge**.
`{…}>3` zählt auch ein Gruppenergebnis von genau 3.

### Der Edge-Button im Spielerbeispiel

`[Edge einsetzen](!&#13;/r …)` wird zu einem anklickbaren Button. Er führt den
angegebenen Wurf aus. Er verändert keine Edge-Ressource am Charakter, da das
Originalmakro dafür keinen Befehl enthält.

Die unkodierte Abfrage nach der Anzahl der Rerolls steht im Original bereits im
äußeren Makro. Entsprechend der Roll20-Verarbeitungsreihenfolge wird sie beim
Erstellen der Karte abgefragt; der Button verwendet anschließend diesen Wert.
Die Beschriftung des Buttons allein ist keine Anweisung, das ursprüngliche
Würfelergebnis zu ändern: Der Button erzeugt einen zusätzlichen Wurf.

## Unterstützte Syntax

| Syntax | Unterstützung |
|---|---|
| `?{Frage}`, `?{Frage|Vorgabe}` | Texteingabe; identische Fragetitel werden pro Ausführung einmal abgefragt |
| `?{Frage|A|B}`, `?{Frage|Label,Wert|Label,Wert}` | Auswahl; direkte und einfach HTML-kodierte verschachtelte Abfragen |
| `#Makroname` | Vorhandenes, ausführbares Foundry-Chat-Makro einfügen; rekursive Aufrufe werden abgefangen |
| `%{Charakter|Fähigkeit}` | Chat-Makro namens `Charakter|Fähigkeit` oder Zuordnung durch die Spielleitung |
| `@{Attribut}`, `@{selected|Attribut}`, `@{Charakter|Attribut|max}` | Lesbare Foundry-Charakterdaten; Namen werden ohne Beachtung der Großschreibung gesucht |
| `@{target|Attribut}`, `@{target|Zielname|Attribut|max}` | Gewähltes Ziel bzw. Auswahldialog; benannte Ziele werden wiederverwendet |
| `character_name`, `token_name`, `bar1`, `bar2` | Entsprechender Name bzw. zugeordneter Tokenbalken |
| `/r`, `/roll`, `/gr`, `/gmroll` | Öffentliche Würfe bzw. Würfe an Spielleitung und Absender |
| `/sr`, `/secretroll`, `/ssr`, `/supersecretroll` | Blinde Foundry-Würfe an die Spielleitung; keine separate Roll20-Bestätigungsnachricht |
| `/w`, `/whisper`, `/em`, `/me`, `/desc`, `/ooc`, `/as`, `/emas` | Chat und Flüstern; Sprechen als fremder Charakter erfordert Rechte |
| `/talktomyself on` / `off` | Private Ausgabe innerhalb dieser Makroausführung; kein dauerhafter Foundry-Modus |
| `[[…]]` | Inline-Würfe, auch verschachtelt; berechnete Würfelanzahl |
| `&{template:default} {{Name=Wert}}` | Mehrzeilige, lesbare Chatkarte mit beliebigen Feldern |
| `[Text](!&#13;/r …)`, `[Text](~Charakter|Fähigkeit)` | Chat-Buttons für Makrobefehle; bedienbar durch Autor und Spielleitung |
| `&{tracker}`, `&{tracker:+}`, `&{tracker:-}` | Initiative im vorhandenen Kampf setzen bzw. ändern, soweit berechtigt |
| `NdX`, `NdF`, `(N+Y)dX`, Grundrechenarten, `floor/ceil/round/abs` | Zahlen und Würfelausdrücke |
| `>`, `<`, `=`, `f`, `!`, `r`, `ro`, `k/kh/kl`, `d/dh/dl` | Inklusive Erfolgsbedingungen, Fehlerabzug, Explosion, Wiederholung und Keep/Drop |
| `{Ausdruck,Ausdruck}>Ziel`, `{…}kh1` | Vergleiche der Gruppensummen, auch bei Erfolgs-Pools wie im Spielerbeispiel |

## Grenzen dieser Version

Dies ist **kein vollständiger Nachbau aller Roll20-Funktionen**. Nicht unterstützt
sind Roll20-API-Skripte (`!power`, `!token-mod` usw.), fremde Sheet-Templates,
Rolltabellen (`t[...]`), Treffer-Matching, Sortiermodifikatoren, Kritisch-Markierungen
`cs/cf`, zusammengezählte/penetrierende Explosionen `!!/!p`, Ergebnisreferenzen
`$[[n]]`, `&{noerror}` sowie automatische Zuordnung von Roll20-Repeating-Sections.
Einzelgruppen mit per-Würfel-Rechenmodifikatoren wie `{3d6+1}>3` benötigen einen
eigenen Adapter. Mehrfach HTML-kodierte Sonderkonstruktionen sind nicht vollständig abgedeckt.
Solche Würfel-/Befehlskonstruktionen melden einen Fehler; es wird keine vermeintlich
äquivalente Erfolgszahl erfunden. Normale Roll20-Erfolgswürfe erhalten keine automatische
SR6-Edge-, Patzer-, Entzugs- oder Schicksalswürfel-Sonderbehandlung.

Bei Abbruch einer Abfrage oder einem Fehler vor der Ausgabe wird kein Teilmakro
in den Chat geschrieben. Umfang, Verschachtelung und Würfelanzahl sind begrenzt.
Fehlende Flüsterempfänger führen zu einem Fehler, niemals zu öffentlicher Ausgabe.

## Unterschiedliche Charakterbögen

Roll20- und Foundry-Bögen haben unterschiedliche Attribut- und Fähigkeitsnamen.
Der Makrotext bleibt trotzdem gleich. Direkte Foundry-Systempfade und gängige
deutsche/englische Attributnamen werden erkannt, soweit im System vorhanden.
Für abweichende Namen hinterlegt die Spielleitung eine Zuordnung in den
Moduleinstellungen, beispielsweise:

```json
{"MAG":"attributes.magic", "WIL":"attributes.willpower"}
```

Ein vorhandenes Chat-Makro kann einer Roll20-Fähigkeit zugeordnet werden:

```json
{"Runner|Beschwören":"Geist beschwören"}
```

Nur bereits lesbare Charakterdaten werden verwendet. Fehlende Zuordnungen werden
angezeigt; Werte werden nicht stillschweigend durch 0 ersetzt. Aus einem Chat-Makro
werden keine Foundry-Script-Makros oder JavaScript-Ausdrücke gestartet.

## Prüfstand und Quellen

Automatisierte Syntax-, Abnahme- und Berechtigungsprüfungen sowie ein Browser-Test
mit nachgebildeten Foundry-Schnittstellen. Noch kein vollständiger Live-Test in einer
Foundry-Welt. Das Manifest behauptet deshalb keine live verifizierte Foundry-Buildnummer.

- Ausgangspunkt: bereitgestellter ZIP-Entwurf `roll20-macro-compat-v0.1.1.zip`.
- [Roll20-Makros](https://wiki.roll20.net/Macros) und [erreichbare Wiki-Alias-Seite](https://wiki.roll20.net/Macro).
- [Roll20 Dice Reference](https://help.roll20.net/hc/en-us/articles/360037773133-Dice-Reference), insbesondere Reihenfolge, inklusive Vergleiche und Gruppen.
- [Foundry V14 Macro API](https://foundryvtt.com/api/v14/classes/foundry.documents.Macro.html), [Roll API](https://foundryvtt.com/api/v14/classes/foundry.dice.Roll.html) und [Würfelmodifikatoren](https://foundryvtt.com/article/dice-modifiers/).

Repository-Prüfung: `node scripts/check-modules.mjs`.
