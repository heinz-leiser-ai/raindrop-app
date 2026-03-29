# RAIN-6: Bookmarks verschieben aus Suchergebnissen

## Status: In Progress
**Created:** 2026-03-29
**Last Updated:** 2026-03-29

## Dependencies
- RAIN-3 (Drag & Drop) muss deployed sein

## Kontext

In der normalen Collection-Ansicht funktioniert Drag & Drop auf die Sidebar-Collections (RAIN-3). In den **Suchergebnissen** (globale Suche, spaceId=0) funktioniert DnD nicht korrekt, weil die Source-Collection (spaceId) als `0` statt der echten `item.collectionId` uebergeben wird.

Zusaetzlich fehlt eine explizite **"Verschieben nach..."**-Aktion (ohne DnD), bei der man eine Ziel-Collection aus einem Picker waehlen kann — wie es im Select-Mode bereits existiert, aber fuer Einzelitems fehlt.

## Was bereits existiert

| Funktion | Datei |
|----------|-------|
| DnD Drag auf jedem Bookmark-Item | `src/co/bookmarks/dnd/drag/item.js` |
| DnD Drop auf Sidebar-Collections | `src/co/collections/item/index.js` |
| `oneMove` Action (einzelnes Bookmark) | `src/data/actions/bookmarks/single.js` |
| `moveSelected` im Select-Mode | `src/data/actions/bookmarks/selectMode.js` |
| Select-Mode Move-Button mit Picker | `src/co/bookmarks/header/selectMode/move.js` |
| CollectionsPicker (Baum-Auswahl) | `src/co/collections/picker/index.js` |

## User Stories

- Als User moechte ich aus den Suchergebnissen einzelne Bookmarks per DnD in eine Collection in der Sidebar ziehen koennen.
- Als User moechte ich auf einem Bookmark (Kontextmenue oder Aktionsleiste) "Verschieben nach..." klicken und eine Ziel-Collection aus einem Picker waehlen koennen.
- Als User moechte ich im Select-Mode aus den Suchergebnissen mehrere Bookmarks auf einmal verschieben koennen (funktioniert bereits via Select-Mode Move).

## Acceptance Criteria

### AC-1: DnD aus Suchergebnissen fixen
- [ ] Bookmark in Suchergebnissen per DnD auf Sidebar-Collection ziehen funktioniert.
- [ ] Die Source-Collection ist die echte `item.collectionId`, nicht der Such-spaceId (0).
- [ ] Same-Collection-Drop-Schutz funktioniert korrekt (wie in RAIN-3).

### AC-2: "Verschieben nach..." Aktion (Einzelitem)
- [ ] Im Kontextmenue eines Bookmarks gibt es den Eintrag "Verschieben nach...".
- [ ] Beim Klick oeffnet sich der CollectionsPicker (Baum-Auswahl).
- [ ] Nach Auswahl einer Collection wird das Bookmark dorthin verschoben.
- [ ] Der Picker schliesst sich nach der Auswahl.
- [ ] Das Bookmark verschwindet aus der aktuellen Ansicht (bei Suche: bleibt sichtbar, da globaler Scope).

### AC-3: "Verschieben nach..." in Hover-Actions
- [ ] In der Hover-Aktionsleiste eines Bookmarks gibt es ein "Verschieben"-Icon.
- [ ] Gleiche Funktionalitaet wie AC-2 (Picker oeffnet sich).

## Edge Cases

- **Bookmark in Unsortiert (-1):** Verschieben moeglich, kein Spezialfall.
- **Bookmark in Trash (-99):** Kein Verschieben-Button anzeigen (bereits geloescht).
- **Read-Only Collection als Ziel:** Nur beschreibbare Collections im Picker anzeigen.
- **Gleiche Collection als Ziel:** Picker erlaubt es, aber keine Aktion (Bookmark ist schon dort).
- **Suche innerhalb einer Collection:** spaceId ist die Collection-ID, DnD sollte bereits funktionieren.

## Betroffene Bereiche

### Frontend (raindrop-app)
- `src/co/bookmarks/dnd/drag/item.js` — spaceId aus `item.collectionId` statt Route-spaceId
- `src/co/bookmarks/item/contextmenu.js` — "Verschieben nach..." Eintrag
- `src/co/bookmarks/item/actions.js` — Move-Icon in Hover-Actions
- Evtl. neue Wrapper-Komponente fuer Picker-Trigger

### Backend
- Kein Backend noetig — `oneMove` API existiert bereits.

## Tech Design (Solution Architect)

### Komponentenstruktur

```
BookmarkItemView (view.js)
+-- DragItem (dnd/drag/item.js)
|   Fix: collectionId statt spaceId als Source-Collection verwenden
|
+-- Actions (item/actions.js)
|   +-- NEU: Move-Button → oeffnet CollectionsPicker
|
+-- Contextmenu (item/contextmenu.js)
    +-- NEU: "Verschieben nach..." → oeffnet CollectionsPicker
```

### Datenfluss

- `DragItem` bekommt `collectionId` vom Bookmark-Objekt (via `{...item}` spread)
- `spaceId` bleibt fuer Select-Mode relevant (unveraendert)
- `oneMove(_id, targetCollectionId)` Redux Action wird wiederverwendet
- `CollectionsPicker` wird als Modal geoeffnet (gleich wie in Select-Mode Move)

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/co/bookmarks/dnd/drag/item.js` | `collectionId \|\| spaceId` statt nur `spaceId` |
| `src/co/bookmarks/item/contextmenu.js` | "Verschieben nach..." MenuItem + Picker |
| `src/co/bookmarks/item/actions.js` | Move-Button + Picker |

### Abhaengigkeiten

- Keine neuen Packages noetig
- Nutzt bestehenden `CollectionsPicker` (`~co/collections/picker`)
- Nutzt bestehende `oneMove` Action (`~data/actions/bookmarks/single`)

## Abgrenzung

- Kein Kopieren (nur Verschieben).
- Kein neuer Select-Mode-Move (existiert bereits).
- Kein Batch-Move ausserhalb Select-Mode.
- Kein neues Backend noetig.

## QA Test Results

**Datum:** 2026-03-29
**Tester:** QA Agent

### Acceptance Criteria

| AC | Kriterium | Status |
|----|-----------|--------|
| AC-1.1 | DnD aus Suchergebnissen auf Sidebar-Collection | PASS |
| AC-1.2 | Source-Collection ist echte `item.collectionId` | PASS |
| AC-1.3 | Same-Collection-Drop-Schutz | PASS |
| AC-2.1 | Kontextmenue zeigt "Verschieben..." | PASS |
| AC-2.2 | Picker oeffnet sich bei Klick | PASS |
| AC-2.3 | Bookmark wird verschoben nach Auswahl | PASS |
| AC-2.4 | Picker schliesst sich nach Auswahl | PASS |
| AC-2.5 | Bookmark bleibt sichtbar in Suche (globaler Scope) | PASS |
| AC-3.1 | Move-Icon in Hover-Actions | PASS |
| AC-3.2 | Picker-Funktionalitaet identisch zu AC-2 | PASS |

### Edge Cases

| Edge Case | Status | Anmerkung |
|-----------|--------|-----------|
| Unsortiert (-1) | PASS | `collectionId=-1` ist truthy, `sourceId=-1` korrekt |
| Trash (-99) | FAIL | Move-Button sichtbar fuer Trash-Items (siehe Bug-1) |
| Gleiche Collection als Ziel | PASS | `targetId != collectionId` verhindert Aktion |
| Suche innerhalb Collection | PASS | `collectionId` hat echten Wert, spaceId ebenfalls |

### Bugs

**Bug-1 (Medium): Move-Button sichtbar fuer Trash-Items**
- Schritte: Papierkorb oeffnen → Bookmark hovern / Rechtsklick
- Erwartet: Kein "Verschieben"-Button (Spec: "Kein Verschieben-Button anzeigen, bereits geloescht")
- Tatsaechlich: Button ist sichtbar, weil `access.level >= 3` fuer Trash-Items gilt
- Betrifft: `contextmenu.js` (Zeile 77) und `actions.js` (Zeile 91)
- Fix: Zusaetzliche Bedingung `collectionId != -99`

**Bug-2 (Low): Picker-Close im Kontextmenue oeffnet Menue erneut**
- Schritte: Rechtsklick → "Verschieben..." → Picker schliesst ohne Auswahl (Escape/Klick daneben)
- Erwartet: Alles schliesst sich
- Tatsaechlich: Kontextmenue erscheint erneut (da `showPicker=false`, aber `menu=true` im Parent)
- Betrifft: `contextmenu.js` Zeile 21
- Fix: `onPickerClose` soll auch `onContextMenuClose()` aufrufen

### Security Audit

- Kein neuer API-Endpoint — `oneMove` existiert bereits mit Auth-Check: OK
- Keine User-Eingabe ausser Collection-Auswahl aus Picker (kein Injektionsvektor): OK
- `parseInt()` auf IDs in DragItem: OK
- Kein Zugriff auf fremde Daten moeglich (Backend prueft Owner): OK

### Regression

| Feature | Status |
|---------|--------|
| RAIN-3 (DnD in Collection) | PASS — `sourceId = collectionId \|\| spaceId`, in normaler Ansicht identisch |
| RAIN-5 (Link Health Check) | PASS — kein Code-Overlap |
| Select-Mode Move | PASS — nicht modifiziert |

### Empfehlung

**PRODUCTION-READY: JA** (nach Fix von Bug-1)

- Bug-1 (Medium): Sollte vor Deploy gefixt werden
- Bug-2 (Low): Kann spaeter gefixt werden, minimale UX-Beeintraechtigung
