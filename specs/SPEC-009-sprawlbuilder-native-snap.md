# SPEC-009 — Kachel-Einrasten und vereinfachte Bearbeitung

Status: Review

## Ziel und Scope

Zielmodul: `modules/shadowrun-sprawlbuilder`. Betroffen: Kachelbearbeitung, zugehöriges CSS, Manifest, README und gezielte Tests. Native Foundry-Implementierung zum Abgleich des Drag-Ablaufs ausschließlich lesen. Andere Module, Assets, Weltdaten und Deployment bleiben außerhalb des Scopes.

## Verhalten und Akzeptanz

- Kein zusätzlicher Plus-Griff am Asset; Größenänderungen bleiben über die Menübuttons und Pixel-Felder möglich.
- Im Menü sind Links- und Rechtsdrehung mit erkennbaren Pfeilsymbolen verfügbar, jeweils in 1°-Schritten und mit korrektem Winkelumlauf.
- Beim Verschieben einer einzelnen eigenen Kachel über Foundrys Kachelwerkzeug greifen sichtbare Nachbarkanten. Der Bordstein kann gleichzeitig am rechten Gehweg und am oberen Bordstein einrasten.
- Vorschau und gespeicherte Position stimmen überein. Alt bzw. deaktiviertes Einrasten erlauben freie Platzierung. Abbruch speichert nichts.
- Fremde Kacheln, gesperrte Kacheln und Mehrfachauswahl behalten ihr bisheriges Verhalten.

## Prüfung

Regression für den tatsächlichen Foundry-Drag-Ablauf statt ausschließlich des bisherigen Preview-Mocks; Browserprüfung der Menübuttons und fehlenden Eckgriffe; vorgeschriebene Modulprüfung. Nicht durchgeführte Live-Tests ausdrücklich im PR ausweisen.

## Ergebnis

Version 1.0.8 entfernt den Eckgriff und ergänzt Linksdrehung. Foundry 14 verschiebt zunächst eine Shape mit Rasterfang; der bisherige `getSnappedPosition`-Override greift dabei nicht. Die Vorschau erhält jetzt vor der Delta-Berechnung die freie Mausposition. Kantenfang verwendet die Drag-Klone aus den Interaktionsdaten und wird beim Loslassen inklusive Alt-Zustand erneut berechnet.

Die gezielte Regression prüft diesen Ablauf zusätzlich mit den drei unveränderten Drag-Methoden aus dem öffentlich ausgelieferten Client der [offiziellen Foundry-Demo](https://demo.foundryvtt.com/scripts/foundry.mjs). Der optionale Test liest die lokal gespeicherte Datei über `FOUNDRY_CLIENT_SOURCE`; Foundry-Code wird nicht mitgeliefert. Dokumente, Shape und Canvas sind dabei Testobjekte. Dies ist kein Live-Test einer vollständigen Foundry-Welt.
