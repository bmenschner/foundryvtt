# Spec-Driven Development

[AGENTS.md](../AGENTS.md) enthält die kurzen permanenten Anweisungen. Dieses Dokument wird gezielt gelesen, wenn eine Spec erstellt, geändert oder implementiert wird. Die [Vorlage](./_TEMPLATE.md) nur bei Bedarf öffnen. Betrieb und Installation beschreibt bereits [Eigene Module verwalten](../docs/managed-modules.md); eine zweite Entwicklerdokumentation ist nicht nötig.

## Ablauf und Umfang

**Spec → Branch → Implementierung → Validierung → Pull Request → menschliches Review → menschliches Merge → gegebenenfalls automatisches Produktionsdeployment.**

Eine Spec entspricht einem logischen Change, einem Branch und einem PR. Empfohlen sind `SPEC-023-kurzer-titel.md`, Branch `spec/023-kurzer-titel` und PR-Titel `[SPEC-023] Kurzer Titel`. IDs sind Beispiele, keine Aufforderung, vorhandene Module oder Specs zu erfinden.

Die Spec beschreibt beobachtbares Verhalten, Zielmodul, Nicht-Ziele und konkrete Akzeptanzkriterien. Keine unnötige Festlegung der Implementierung, kein Chatprotokoll, Brainstorming, Entwicklungstagebuch oder Architekturhandbuch. Für kleine Änderungen genügt eine kurze Spec. Liegt bereits ein ausreichend konkreter, autorisierter Auftrag vor, diesen knapp als Spec festhalten; daraus keine zusätzliche Freigabeschleife machen. Fehlende entscheidende Anforderungen gezielt klären.

| Status | Bedeutung |
| --- | --- |
| Draft | Noch nicht implementieren; Anforderungen offen. |
| Ready | Ausreichend definiert und zur Umsetzung beauftragt. |
| In Progress | Implementierung läuft. |
| Review | PR ist bereit für menschliches Review. |
| Completed | Menschlich gemerged; erst nach bestätigtem Merge verwenden. |

Vor Implementierung einen kleinen Scope festlegen, ohne lange Planungsphase:

```text
Spec:
Zielmodul:
Primärer Scope:
Voraussichtlich betroffene Dateien:
Erlaubte Scope-Erweiterung:
Nicht Teil der Aufgabe:
```

Beispiel: `SPEC-023`, `shadowrun-sprawlbuilder`, `modules/shadowrun-sprawlbuilder/**`, konkret betroffene Katalogdatei und ihr Test; andere Module, globale Permissions und CI/CD ausgeschlossen. Bei einem Dokumentations- oder Infrastrukturauftrag statt eines Zielmoduls ausdrücklich die notwendigen Dateien nennen.

## Scope-Leiter

Nur zur nächsten nötigen Stufe wechseln, wenn der engere Scope nicht ausreicht. Die konkrete technische Begründung kurz nennen; dies allein erfordert keine Nutzerfreigabe. Eine erlaubte Lese-Erweiterung autorisiert keine fachfremden Änderungen.

### Stufe 0: Spec und Anweisungen

`AGENTS.md` und aktive Spec lesen; dieses Prozessdokument bei Spec-Arbeit hinzunehmen. Problem, Zielmodul, Akzeptanzkriterien und Nicht-Ziele bestimmen.

### Stufe 1: genau ein Zielmodul

Standard ist `modules/<module-id>/**`. Auch dort nicht sofort alles lesen. Priorität: Manifest, Entry-Point, betroffene JavaScript-Dateien, direkt zugehörige Templates/CSS und vorhandene Tests. Keine pauschalen Modulvergleiche; keine binären Assets ohne konkreten visuellen Prüfbedarf öffnen.

### Stufe 2: direkte Abhängigkeiten

Nur konkret importierte Dateien, referenzierte Templates/Styles, Helper und zugehörige Tests hinzunehmen. Jede Erweiterung muss aus einer benötigten technischen Abhängigkeit folgen.

### Stufe 3: modulbezogene Repository-Infrastruktur

Nur konkret zugehörige Dateien aus `tests/` bzw. `scripts/check-modules.mjs` lesen, etwa um einen betroffenen Test anzupassen oder einen relevanten Validatorfehler zu verstehen. Nicht pauschal `scripts/**` lesen. Die vorgeschriebene Standardprüfung darf alle registrierten Tests ausführen; das ist keine Erlaubnis, deren gesamten Quelltext zu analysieren.

### Stufe 4: genau ein relevantes anderes Modul

Nur bei ausdrücklich spezifiziertem Cross-Module-Verhalten, konkreter gemeinsamer API, bekanntem benötigtem Repository-Pattern oder einem für die sichere lokale Umsetzung unverzichtbaren Vergleich. Den Vergleich auf das benötigte Pattern beschränken: „Prüfe in Modul X ausschließlich Pattern Y, weil die Spec dieses benötigt.“ Nicht alle Module nach einer vermeintlich besseren Architektur durchsuchen.

### Stufe 5: repositoryweite Suche

Letzte Stufe, wenn die benötigte Implementierung unbekannt ist, eine Referenz repositoryweit aufgelöst werden muss, die Spec bewusst mehrere Module umfasst oder der engere Scope nachweislich nicht reicht. Auch dann konkrete Suchbegriffe und möglichst enge Pfade:

```bash
rg "konkreterHookName" modules/<module-id>
rg "konkreteSettingId" modules
rg "konkreterFunktionsname" .
```

Keine blinde rekursive Lektüre, keine pauschale Suche durch sämtliche JavaScript-Dateien und keine vorgeschaltete vollständige Architekturübersicht.

## Implementierungsregeln für Foundry

- Eine Modul-Spec autorisiert nur ihr Zielmodul und ausdrücklich benannte Tests/Abhängigkeiten. Cross-Module-Änderungen müssen im Spec-Scope stehen. Unbeteiligte Module, manuell installierte Pakete, Welten und fremde Änderungen erhalten.
- Öffentliche Foundry-APIs, dokumentierte Hooks, Application-/Document-Mechanismen und vorhandene Patterns des Zielmoduls bevorzugen. Kein unnötiges Monkey-Patching, keine Foundry-Core-Änderungen, fragilen globalen DOM-Hacks oder Polling, wenn geeignete Hooks existieren.
- Wiederholtes Rendern darf keine doppelten Buttons, Listener, Observer, Container oder Styles erzeugen. DOM-Zugriff auf Application Root → konkreten Container → konkreten Selektor begrenzen; globale Suche nur bei technischer Notwendigkeit.
- CSS modulbezogen kapseln. Keine globalen Regeln für `button`, `img` oder `.application`, die fremde UIs beeinflussen. Settings, Flags, DOM-IDs, CSS-Klassen, Events, Socket-Nachrichten und persistente Daten wo sinnvoll mit der Modul-ID namespacen; keine globalen Variablenlecks.
- Bei Permission-Änderungen GM, Spieler, gegebenenfalls Assistant GM/Trusted Player, Document Ownership und Foundry Permission Levels getrennt betrachten. Ein lokales Problem nicht durch globale Rechteausweitung lösen. Globale Permissions brauchen ausdrücklichen Spec-Scope.
- Deklarierte Foundry-Kompatibilität im Manifest ist maßgeblich. Mindestversion, APIs, Welt-/Datenmigrationen und ältere kompatible Implementierungen nicht ohne Spec-Anforderung ändern.
- Unabhängige Fehler oder Verbesserungen nur als `Follow-up candidate: <Beschreibung>` festhalten. Später gegebenenfalls eigene Spec; keine Nebenarbeiten im aktuellen PR.

## Validierung und Review

Bei relevanten Änderungen an `modules/**`, `scripts/**`, `tests/**`, Deployment oder Validierungslogik vor Abschluss ausführen:

```bash
node scripts/check-modules.mjs
```

CI verwendet Node.js 24. Für reine Markdown-/Dokumentationsänderungen keine sachfremden Modultests. Prüfungen passend zum Change wählen; nach Erfolg nur bei neuen Änderungen, Fehlern oder offenen Risiken wiederholen bzw. erweitern. Keine unnötige vollständige Regressionstest-Liste erstellen.

Vor Abschluss `git status` und `git diff` prüfen (bei bereits gestagten/committeten Änderungen auch den entsprechenden Diff). Prüfen: ausschließlich erwartete Dateien, keine temporären Dateien/Debug-Ausgaben/Secrets/Credentials, betroffene JSON-Dateien gültig, Referenzen vorhanden, Modul-IDs korrekt, Akzeptanzkriterien erfüllt. Nicht ausgeführte Checks mit Grund nennen.

Nicht automatisiert prüfbares UI-Verhalten im PR mit konkreten manuellen Foundry-Schritten und erwartetem Ergebnis dokumentieren. Simulationen nicht als Live-Test darstellen. Den PR gemäß [Vorlage](../.github/PULL_REQUEST_TEMPLATE.md) erstellen oder aktualisieren und Spec auf `Review` setzen. Menschliches Review entscheidet über Merge; Codex stoppt nach dem PR ohne weitere Optimierungsrunde.

## Vorhandene Actions und Produktionsgrenze

Maßgeblich sind die tatsächlichen Workflow-Dateien, nicht historische Betriebsbeispiele:

- [check-modules.yml](../.github/workflows/check-modules.yml): Pull Requests mit Änderungen an `modules/**`, `scripts/**`, `tests/**` oder `.github/workflows/**` werden mit Node.js 24 und `node scripts/check-modules.mjs` geprüft. Der zusätzliche Pfad `scripts/check-modules.mjs` ist redundant, aber harmlos. Der Workflow bietet außerdem `workflow_dispatch`; Codex startet keine manuellen Workflows.
- [deploy.yml](../.github/workflows/deploy.yml): Push auf `main` kann produktiv deployen. Reine Markdown-/Dokumentationsänderungen sind gemäß `paths-ignore` ausgenommen. Die Action führt ebenfalls `node scripts/check-modules.mjs` unter Node.js 24 und anschließend `bash scripts/publish-deployment.sh` aus. Das vorhandene `workflow_dispatch` ist ein zusätzlicher **manueller Produktionszugriff**, keine Ausnahme vom Deployment-Verbot für Codex.

Niemals direkt auf `main` arbeiten/pushen, selbst mergen, deployen, manuelle Workflows starten, Branch Protection oder fehlgeschlagene Prüfungen umgehen. Secrets, SSH-Schlüssel und Credentials weder ausgeben noch committen; Deployment-Secrets und Repository-Einstellungen nicht ungefragt ändern.

**High Risk:** `.github/workflows/**`, `scripts/publish-deployment.sh`, sonstige Deployment-Logik/-Konfiguration, SSH-Konfiguration, Secret-Handling und Produktionspfade benötigen eine ausdrücklich darauf gerichtete Spec. Normale Modul-Specs autorisieren dies nicht. Auch eine solche Spec hebt das Verbot eigenständigen Mergens oder Deployens nicht auf.

Branch Protection nur als Empfehlung dokumentieren: PR vor Merge, Approval, keine direkten Pushes nach `main`, Force-Pushes und Branch-Löschung sperren. Nicht selbst konfigurieren. Soll ein Check verpflichtend werden, vorher menschlich klären: Ein mit `pull_request.paths` gefilterter Workflow kann bei nicht passenden Pfaden ausbleiben und einen verpflichtenden Statuscheck auf „Pending“ halten. Keine ungefragte Workflow-Anpassung daraus ableiten.
