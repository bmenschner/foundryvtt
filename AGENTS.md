# Repository-Anweisungen

Spec first. One spec = one branch = one pull request.

- Vor Implementierung die aktive Spec lesen; bei Spec-Erstellung, -Änderung oder -Implementierung zusätzlich [specs/README.md](specs/README.md). Kleine Aufgaben brauchen nur eine kleine Spec.
- `main` ist die Produktionsgrenze: niemals direkt darauf arbeiten oder pushen, niemals selbst einen PR mergen oder deployen, niemals `workflow_dispatch` auslösen. Keine Branch Protection oder fehlgeschlagene Validierung umgehen.
- Standardscope: diese Datei, aktive Spec, `modules/<module-id>/**` und zugehörige Tests. Andere Module sind zunächst ausgeschlossen. Innerhalb des Zielmoduls nur benötigte Dateien lesen.
- Scope nur bei konkretem Bedarf stufenweise erweitern: **Spec → Zielmodul → direkte Abhängigkeiten → modulbezogene Tests/Validator → genau ein notwendiges Vergleichsmodul → repositoryweite Suche als letzte Stufe**. Erweiterungen kurz begründen.
- Konkrete Dateien, Hooks, Funktionen, Selektoren und gezielte `rg`-Suchen bevorzugen. Keine pauschale Repository-Analyse, kein Lesen aller Module/JavaScript-Dateien, keine Architekturübersicht und kein Wiederlesen unveränderter Dateien ohne Bedarf.
- Nur die kleinste vollständige Spec umsetzen. Keine ungefragten Refactorings, Upgrades, CI-/Permission-Änderungen, Modernisierungen, Verzeichnisumbauten oder Style-Cleanups. Unabhängige Probleme als Follow-up nennen.
- Module isolieren; öffentliche Foundry-APIs und dokumentierte Hooks nutzen, Render-/Event-Code wiederholbar halten und CSS, IDs, Settings und Flags mit dem Modul-Namespace abgrenzen. Kompatibilität, Weltmigrationen und globale Rechte nur gemäß ausdrücklicher Spec ändern.
- Deployment, SSH, Secrets, Produktionspfade und CI/CD benötigen eine ausdrücklich darauf gerichtete Spec. Keine Secrets, Schlüssel oder Credentials ausgeben oder committen; keine Repository-Einstellungen ungefragt ändern.
- Bei Änderungen an `modules/**`, `scripts/**`, `tests/**`, Deployment oder Validierung vor PR-Abschluss **`node scripts/check-modules.mjs`** ausführen. CI nutzt **Node.js 24**. Für reine Markdown-/Dokumentationsänderungen keine sachfremden Modultests.
- Vor Abschluss **`git status` und `git diff`** prüfen: nur beauftragte Dateien, gültige JSON-Dateien und Pfade, korrekte Modul-IDs, keine temporären Dateien oder Debug-Reste. Notwendige manuelle Foundry-Prüfung im PR dokumentieren; Tests nicht ohne Anlass wiederholen oder ausweiten.
- Für GitHub-Netzwerkzugriffe den vereinbarten WSL-`git`/`gh`-Ablauf verwenden. Fremde/uncommittete Änderungen erhalten.
- PR erstellen/aktualisieren, kurz Ergebnis und verbleibende Einschränkungen nennen, dann **STOP. Nicht mergen. Nicht deployen. Keine zusätzliche Optimierungsrunde.**
