# SPEC-001: Codex-Projektanweisungen und Spec-Driven Development

Status: Review

## Problem

Es fehlen gemeinsame Codex-Anweisungen, Spec-Konventionen und eine PR-Vorlage. Dadurch können Aufgaben unnötig viel Kontext benötigen oder über das beauftragte Modul hinausgehen.

## Ziel

Ein kurzer permanenter Einstieg und gezielt geladene Detailregeln begrenzen Kontext, Änderungen und Produktionszugriff.

## Zielmodul

Keines: einmalige Repository-Dokumentation gemäß `CODEX_SETUP_ARBEITSAUFTRAG.md` des Nutzers.

## Scope

`AGENTS.md`, `specs/README.md`, `specs/_TEMPLATE.md`, diese Spec, `.github/PULL_REQUEST_TEMPLATE.md` und ein Verweis im bestehenden `README.md`.

## Out of Scope

Modulcode, Assets, Tests, Scripts, Workflow-Dateien, Repository-Einstellungen, Branch Protection, Merge und Deployment. Keine zusätzliche `docs/DEVELOPMENT.md`, da bereits ein Einstieg vorhanden ist.

## Akzeptanzkriterien

- [x] Kurze AGENTS.md verweist auf ausführliche SDD-Regeln, statt diese zu duplizieren.
- [x] Spec-Vorlage und PR-Vorlage bilden Scope, Akzeptanzkriterien, Prüfung und Produktionsgrenze ab.
- [x] Sechsstufige Scope-Leiter und Foundry-Regeln sind dokumentiert.
- [x] Dokumentierte CI-/Deployment-Auslöser und Node-Version stimmen mit den vorhandenen Workflows überein.
- [x] Ausschließlich die genannten Markdown-Dateien sind geändert; kein Merge oder Deployment ausgelöst.

## Technische Einschränkungen

Bestehende Betriebsdokumentation nur verlinken. Die frühere unvollständige AGENTS-Vorlage wird durch diesen vollständigen Setup-Auftrag ersetzt; keine parallelen Regeldateien.

## Validierung

### Automatisiert

`git diff --check`; Dateiumfang und lokale Markdown-Verweise prüfen. Kein Modulvalidator für diesen reinen Dokumentations-Change.

### Manueller Foundry-Test

Nicht erforderlich; keine Laufzeitänderung. Texte auf Widersprüche, unnötige Duplikate und korrekte Workflow-Beschreibung prüfen; `git status` und `git diff` vor Abschluss ansehen.

## Deployment-Risiko

Low. Markdown-Dateien sind vom automatischen Push-Deployment ausgenommen. Workflow und Branch Protection bleiben unverändert.

## Hinweise

Follow-up candidate: Historische Deployment-Beispiele in README und `.github/github-deploy.md` mit dem heutigen Transfer ohne Server-Git abgleichen. Nicht Bestandteil dieser Spec.
