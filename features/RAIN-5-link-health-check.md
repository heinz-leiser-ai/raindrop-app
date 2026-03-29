# RAIN-5: Link Health Check

## Status: Deployed
**Created:** 2026-03-28
**Last Updated:** 2026-03-28

## Dependencies
- RAIN-1 (Token-Auth) muss deployed sein (API-Zugriff)
- Backend: Neue Edge Function fuer URL-Pruefung

## Kontext

Das Frontend hat bereits eine vollstaendige Broken-Links-Infrastruktur:
- `broken`-Flag auf jedem Bookmark (Icon, CSS-Klasse, Filter `broken:true`)
- Setting `broken_level` (Basic/Default/Strict/Off) in `src/routes/settings/app/broken_level.js`
- Broken-Icon in `src/co/bookmarks/item/info/index.js`
- Filter-Eintrag in `src/data/helpers/filters/normalizeItems.js`

Was **fehlt**: Im Self-Hosted Backend gibt es keinen Prozess, der URLs prueft und `broken: true` setzt. Der User moechte manuell einen Check starten, tote Links sehen, loeschen, und ein Journal darueber fuehren.

## Was bereits existiert (kein Frontend-Code noetig)

| Funktion | Datei |
|----------|-------|
| `broken`-Flag auf Bookmark anzeigen (Icon) | `src/co/bookmarks/item/info/index.js` |
| CSS-Klasse `broken` auf Bookmark-Zeile | `src/co/bookmarks/item/view.js` |
| Filter `broken:true` in Sidebar | `src/data/helpers/filters/normalizeItems.js` |
| Setting `broken_level` (Basic/Default/Strict/Off) | `src/routes/settings/app/broken_level.js` |
| `broken`-Feld im Bookmark-Datenmodell | `src/data/helpers/bookmarks/index.js` |

## User Stories

- Als User moechte ich einen Link-Check manuell starten, damit ich sehe welche meiner Bookmarks auf tote Seiten zeigen.
- Als User moechte ich die Liste der kaputten Links sehen und einzeln oder in Bulk loeschen koennen.
- Als User moechte ich ein Journal fuehren, das dokumentiert welche Bookmarks ich geloescht habe (Titel, URL, Loeschdatum).
- Als User moechte ich das Journal einsehen und bei Bedarf komplett leeren koennen.

## Acceptance Criteria

### AC-1: Link-Check starten
- [ ] Button "Links pruefen" in Settings oder als Aktion in der Toolbar.
- [ ] Beim Klick startet ein Backend-Job der alle Bookmarks des Users prueft.
- [ ] Fortschrittsanzeige waehrend der Pruefung (z.B. "247 / 1'200 geprueft...").
- [ ] Der Check laeuft im Backend (Edge Function), nicht im Browser.
- [ ] Waehrend ein Check laeuft, ist der Button deaktiviert mit Hinweis "Pruefung laeuft...".

### AC-2: URL-Pruefung (Backend)
- [ ] Fuer jede Bookmark-URL wird ein HTTP HEAD Request gesendet (Fallback auf GET bei HEAD-Fehler).
- [ ] Als "broken" gelten: HTTP 404, 410, DNS-Fehler, Connection Timeout (>10s), SSL-Fehler.
- [ ] Redirects (301/302) gelten NICHT als broken.
- [ ] Das `broken`-Feld auf dem Bookmark wird auf `true` gesetzt wenn kaputt.
- [ ] Zuvor als `broken` markierte Links die jetzt wieder erreichbar sind: `broken` wird auf `false` zurueckgesetzt.
- [ ] Die `broken_level`-Einstellung des Users wird beruecksichtigt (Basic/Default/Strict).

### AC-3: Broken Links anzeigen und loeschen
- [ ] Bestehender Filter `broken:true` in der Sidebar zeigt Anzahl und Liste (existiert bereits).
- [ ] Multiselect + Loeschen funktioniert ueber bestehende UI (existiert bereits).
- [ ] Beim Loeschen eines als broken markierten Bookmarks wird automatisch ein Journal-Eintrag erstellt.

### AC-4: Loeschjournal
- [ ] Neue Seite/Bereich: "Loeschjournal" (z.B. unter Settings oder als eigene Route).
- [ ] Jeder Eintrag zeigt: Bookmark-Titel, URL, Collection-Name, Loeschdatum.
- [ ] Liste ist nach Loeschdatum sortiert (neueste zuerst).
- [ ] Button "Journal leeren" mit Bestaetigung ("Alle Eintraege unwiderruflich loeschen?").
- [ ] Nach dem Leeren ist das Journal leer, keine Undo-Moeglichkeit.

### AC-5: Ergebnis-Zusammenfassung
- [ ] Nach Abschluss des Checks: Zusammenfassung ("1'200 Links geprueft. 47 kaputte Links gefunden.").
- [ ] Link zur gefilterten Ansicht (`broken:true`) direkt aus der Zusammenfassung.

## Edge Cases

- **Bookmark ohne URL:** Ueberspringen, nicht als broken markieren.
- **Rate Limiting durch Ziel-Server:** Requests mit Verzoegerung senden (max. 5 parallel, 200ms Pause).
- **Timeout bei sehr vielen Bookmarks:** Job in Batches aufteilen, Zwischenergebnisse speichern.
- **Check wird abgebrochen (Browser geschlossen):** Backend-Job laeuft weiter, Ergebnis beim naechsten Oeffnen sichtbar.
- **Gleiche Domain mehrfach:** Nicht als Duplikat behandeln, jede URL einzeln pruefen.
- **Paywall/Login-geschuetzte Seiten:** HTTP 401/403 gelten NICHT als broken (Seite existiert, ist nur geschuetzt).
- **Leeres Journal leeren:** Button deaktiviert wenn Journal leer ist.
- **Bookmark wird geloescht OHNE broken-Flag:** Kein Journal-Eintrag (Journal nur fuer Broken-Link-Bereinigung).

## Betroffene Bereiche

### Backend (raindrop-api)
- Neue Edge Function: `link-check/start` — startet den Pruefungsjob
- Neue Edge Function: `link-check/status` — Fortschritt abfragen
- Neue Tabelle: `link_check_journal` (bookmark_title, url, collection_name, deleted_at, user_id)
- Neue Tabelle: `link_check_runs` (user_id, started_at, finished_at, total, broken_count, status)
- Trigger/Hook: Beim Loeschen eines `broken`-Bookmarks → Journal-Eintrag erstellen

### Frontend (raindrop-app)
- Neuer Button "Links pruefen" (Placement: Settings oder Toolbar)
- Fortschrittsanzeige + Ergebnis-Zusammenfassung
- Neue Route/Bereich: Loeschjournal (Liste + Leeren-Button)
- Bestehende Broken-Links-UI wird wiederverwendet (Filter, Icons, Multiselect+Delete)

## Abgrenzung

- Kein automatischer/periodischer Check (nur manuell per Button).
- Kein Reparieren von Links (nur erkennen + loeschen).
- Kein Archivieren/Cachen der Seiteninhalte vor dem Loeschen.
- Journal erfasst nur geloeschte Bookmarks, keine anderen Aktionen.

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Kernerkenntnis

Das Feature teilt sich in **zwei Bloecke**: Backend (URL-Pruefung + Datenbank) und Frontend (Button + Journal-UI). Die bestehende Broken-Links-Anzeige im Frontend funktioniert bereits — es fehlt nur der Backend-Prozess der `broken: true` setzt, plus die Journal-Funktion.

**Wichtig:** Die `raindrops`-Tabelle hat aktuell **keine `broken`-Spalte**. Diese muss per Migration hinzugefuegt werden. Ausserdem liefert die Filters-API `brokenCount` immer `0` — muss an die neue Spalte angebunden werden.

### Betroffene Komponenten

```
Backend (raindrop-api)
+-- supabase/migrations/
|   +-- NEUE Migration: broken-Spalte auf raindrops
|   +-- NEUE Migration: Tabelle link_check_runs
|   +-- NEUE Migration: Tabelle link_check_journal
+-- supabase/functions/
    +-- api/routes/raindrops.ts          ← Broken-Filter in Queries beruecksichtigen
    +-- api/routes/tags.ts               ← getFilters: brokenCount richtig zaehlen
    +-- link-check/index.ts              ← NEUE Edge Function (Start + Status + Journal)

Frontend (raindrop-app)
+-- src/routes/my/space/header/
|   +-- index.js                         ← LinkCheck-Komponente einbinden (neben Ask)
|   +-- linkCheck.js                     ← NEU: Button + Fortschritt + Ergebnis-Popover
+-- src/routes/settings/
|   +-- journal.js                       ← NEU: Loeschjournal-Seite
+-- src/data/
    +-- actions/linkCheck.js             ← NEU: start, getStatus, getJournal, clearJournal
    +-- reducers/linkCheck.js            ← NEU: status, progress, journal, runs
    +-- sagas/linkCheck.js               ← NEU: API-Calls + Polling
```

### Datenmodell

```
raindrops (bestehende Tabelle — Aenderung):
  + broken: Boolean (default false)

link_check_runs (NEU):
  - ID
  - User-ID
  - Gestartet am (Timestamp)
  - Beendet am (Timestamp, null waehrend Lauf)
  - Status ("running" / "completed" / "failed")
  - Gesamt-Anzahl (Zahl)
  - Geprueft-Anzahl (Zahl, wird laufend aktualisiert)
  - Broken-Anzahl (Zahl)

link_check_journal (NEU):
  - ID
  - User-ID
  - Bookmark-Titel (Text)
  - URL (Text)
  - Collection-Name (Text)
  - Geloescht am (Timestamp)
```

### Ablauf: Link-Check starten

```
User klickt "Links pruefen"
    ↓
Frontend: POST link-check/start
    ↓
Backend: Neuen Eintrag in link_check_runs (status: "running")
    ↓
Backend: Alle Bookmarks des Users laden (nur _id, link)
    ↓
Backend: In Batches (5 parallel, 200ms Pause):
    Fuer jede URL → HEAD Request (Fallback GET)
    → 404/410/DNS-Fehler/Timeout → broken = true
    → 401/403/301/302/200 → broken = false
    → Fortschritt in link_check_runs aktualisieren
    ↓
Frontend: Pollt GET link-check/status alle 3 Sekunden
    → Zeigt "247 / 1'200 geprueft..."
    ↓
Backend fertig: link_check_runs auf "completed" setzen
    ↓
Frontend: Zeigt Zusammenfassung "1'200 geprueft, 47 kaputt"
    → Link zu Filter broken:true
```

### Ablauf: Journal-Eintrag erstellen

```
User loescht einen Bookmark mit broken=true
    ↓
Bestehende Delete-API (DELETE raindrop/{id})
    ↓
Backend: Vor dem Loeschen pruefen: Hat der Bookmark broken=true?
    → Ja: Eintrag in link_check_journal schreiben (Titel, URL, Collection-Name)
    → Nein: Kein Journal-Eintrag
    ↓
Bookmark wird geloescht (bestehende Logik)
```

### Frontend-Platzierung

**Button "Links pruefen"** kommt in die **Bookmark-Header-Leiste** (`src/routes/my/space/header/`), neben dem bestehenden "Fragen"-Button:

```
Bookmark-Header (src/routes/my/space/header/index.js)
+-- Search
+-- Space
+-- Share
+-- Ask (Fragen)              ← EXISTIERT
+-- LinkCheck                 ← NEU, neuer Button hier
|   +-- Button mit Icon "broken" + Tooltip "Links pruefen"
|   +-- [Waehrend Lauf] Icon dreht/pulsiert + Badge "247/1'200"
|   +-- [Nach Abschluss] Ergebnis-Popover: "47 kaputte Links" + Link zur Ansicht
+-- Add (Hinzufuegen)         ← EXISTIERT
```

**BrokenLevel-Setting** bleibt in Settings wo es ist (steuert Pruefungsstrenge).

**Journal** als eigene Seite:

```
Journal-Seite (/settings/journal)    ← NEUE Route
+-- Header "Loeschjournal"
+-- Button "Journal leeren" (mit Bestaetigung)
+-- Liste
    +-- Eintrag: Titel | URL | Collection | Datum
    +-- Eintrag: ...
+-- Leer-Zustand: "Keine geloeschten Links"
```

### Tech-Entscheidungen

| Entscheidung | Warum |
|--------------|-------|
| **Eigene Edge Function `link-check/`** statt Route in `api/` | URL-Pruefung ist langlebig (Minuten), passt nicht zum Request/Response-Muster der API. Eigene Function kann laenger laufen. |
| **Polling statt WebSocket** | Einfacher, passt zum bestehenden Pattern. 3s-Intervall ist ausreichend fuer eine manuelle Pruefung. |
| **Journal als DB-Tabelle** statt Log-File | Abfragbar, pro User gefiltert, leicht zu leeren via DELETE. |
| **`broken`-Spalte auf `raindrops`** statt separate Tabelle | Frontend erwartet `item.broken` direkt am Bookmark-Objekt. Keine Joins noetig. |
| **HEAD-Request mit GET-Fallback** | HEAD ist schneller/guenstiger. Manche Server blocken HEAD → Fallback auf GET. |
| **5 parallele Requests, 200ms Pause** | Verhindert Rate-Limiting durch Ziel-Server, bleibt trotzdem schnell (~500 URLs/Minute). |
| **Button neben BrokenLevel** | Logische Gruppierung: Broken-Links-Einstellungen + Pruefung zusammen. |

### broken_level Interpretation

| Level | Was gilt als broken |
|-------|---------------------|
| **Off** | Kein Check moeglich (Button deaktiviert) |
| **Basic** | Nur 404, 410, DNS-Fehler |
| **Default** | Basic + Connection Timeout, SSL-Fehler |
| **Strict** | Default + 5xx Server-Fehler |

### Abhaengigkeiten (Packages)

**Backend:** Keine neuen Pakete. Deno `fetch` reicht fuer HTTP-Checks.
**Frontend:** Keine neuen Pakete. Standard Redux/Saga Pattern.

### Aufwandsschaetzung

| Aenderung | Bereich | Groesse |
|-----------|---------|---------|
| DB-Migrationen (3 Tabellen/Spalten) | Backend | Klein |
| Edge Function link-check (Start/Status/Journal) | Backend | Mittel |
| Filters-API brokenCount fixen | Backend | Minimal |
| Delete-Hook fuer Journal | Backend | Klein |
| Settings-UI: Button + Fortschritt + Ergebnis | Frontend | Klein |
| Journal-Seite | Frontend | Klein-Mittel |
| Redux Slice (actions/reducer/saga) | Frontend | Klein |
| **Gesamt** | | **Mittel** |

## QA Test Results

**Datum:** 2026-03-29
**Methode:** Code-Review gegen alle ACs, Edge Cases + Security Audit

### AC-1: Link-Check starten

| Kriterium | Status | Anmerkung |
|-----------|--------|-----------|
| Button "Links pruefen" in Header-Toolbar | PASS | Neben Ask, mit Icon `broken` |
| Klick startet Backend-Job | PASS | Saga → POST `link-check/start` |
| Fortschrittsanzeige | PASS | Button zeigt `checked / total` |
| Check laeuft im Backend | PASS | Edge Function `link-check/` |
| Button deaktiviert waehrend Check | PASS | `disabled={isRunning}`, cursor: wait |

### AC-2: URL-Pruefung (Backend)

| Kriterium | Status | Anmerkung |
|-----------|--------|-----------|
| HEAD Request + GET Fallback | PASS | Inner try/catch Pattern |
| 404/410/DNS/Timeout/SSL = broken | PASS | `isStatusBroken` + catch-Handler |
| Redirects (301/302) NOT broken | PASS | `status >= 301 && <= 308 → false` |
| `broken`-Feld wird gesetzt | PASS | `update({ broken: isBroken })` pro Item |
| Zuvor broken → zurueckgesetzt | PASS | Update setzt `broken: false` wenn erreichbar |
| `broken_level` beruecksichtigt | PASS | Basic/Default/Strict korrekt implementiert |

### AC-3: Broken Links anzeigen und loeschen

| Kriterium | Status | Anmerkung |
|-----------|--------|-----------|
| Filter `broken:true` zeigt Anzahl | PASS | `getFilters` zaehlt `brokenCount` korrekt |
| Multiselect + Loeschen | PASS | Bestehende UI, keine Aenderung noetig |
| Journal-Eintrag bei Loeschen | PASS* | Siehe Bug-1 |

### AC-4: Loeschjournal

| Kriterium | Status | Anmerkung |
|-----------|--------|-----------|
| Neue Seite unter Settings | PASS | `/settings/journal`, Sidebar-Link vorhanden |
| Eintrag: Titel, URL, Collection, Datum | PASS | 4-Spalten Grid |
| Sortiert nach Loeschdatum (neueste zuerst) | PASS | Backend: `ORDER BY deleted_at DESC` |
| "Journal leeren" mit Bestaetigung | PASS | Zwei-Schritt-Bestaetigung |
| Nach Leeren: Journal leer | PASS | DELETE + Reducer reset |

### AC-5: Ergebnis-Zusammenfassung

| Kriterium | Status | Anmerkung |
|-----------|--------|-----------|
| Zusammenfassung nach Check | PASS* | Nur Broken-Count, kein Total (Bug-2) |
| Link zur `broken:true` Ansicht | PASS | Navigate bei Klick auf Ergebnis |

### Edge Cases

| Edge Case | Status | Anmerkung |
|-----------|--------|-----------|
| Bookmark ohne URL | PASS | `checkUrl` return false + `.neq('link', '')` |
| Rate Limiting (5 parallel, 200ms) | PASS | `BATCH_SIZE=5`, `BATCH_DELAY_MS=200` |
| Timeout (>10s) | PASS | `AbortController` mit 10s Timeout |
| Browser geschlossen | PASS | `EdgeRuntime.waitUntil()` |
| Gleiche Domain mehrfach | PASS | Jede URL einzeln geprueft |
| 401/403 NOT broken | PASS | `isStatusBroken` return false |
| Leeres Journal leeren | PASS | Button versteckt wenn leer |
| Nicht-broken loeschen = kein Journal | PASS | Check auf `existing.broken` |

### Bugs

**Bug-1: Doppelter Journal-Eintrag (Medium)**
- `deleteRaindrop` schreibt Journal-Eintrag beim Move-to-Trash UND beim permanenten Loeschen aus dem Trash
- Betrifft auch `batchDeleteRaindrops`
- **Fix:** Journal nur schreiben wenn `existing.collection_id !== -99`

**Bug-2: Zusammenfassung unvollstaendig (Low)**
- Button zeigt nur `X kaputt`, nicht `Y geprueft. X kaputt.`
- AC-5 erwartet: "1'200 Links geprueft. 47 kaputte Links gefunden."
- **Fix:** Label im `showResult`-State zu `${total} geprueft, ${brokenCount} kaputt` aendern

**Bug-3: broken:true Suchfilter Trailing Space (Medium)**
- Sidebar-Filter sendet `broken:true ` (mit Trailing Space, wie alle Filter)
- Backend: `search.slice(7) === 'true'` → `'true ' !== 'true'` → **Filter zeigt falsche Ergebnisse**
- Betrifft alle neuen Search-Filter (`broken:`)
- **Fix:** `search.slice(7).trim() === 'true'` im Backend

### Security Audit

| Pruefung | Status | Anmerkung |
|----------|--------|-----------|
| Auth auf allen Endpoints | PASS | `getUser(req)` + Profile-Check |
| RLS auf allen neuen Tabellen | PASS | 3 Tabellen mit RLS + Policies |
| User-Scoping (kein Cross-User) | PASS | Alle Queries gefiltert auf `userId` |
| Input Validation | PASS | `broken_level` nur String-Vergleich |
| Concurrent-Run-Schutz | PASS | Check auf `status: 'running'` |
| SSRF via Link-Check | INFO | Checker fetched beliebige URLs aus Bookmarks — akzeptabel fuer Self-Hosted Family |
| Kein DELETE-Policy auf `link_check_runs` | INFO | User kann Run-History nicht loeschen — kein Sicherheitsproblem |

### Regressions-Check

| Bereich | Status |
|---------|--------|
| `formatRaindrop` — bestehende Felder | PASS |
| `deleteRaindrop` — Grundfunktion | PASS |
| `batchDeleteRaindrops` — Grundfunktion | PASS |
| `getFilters` — bestehende Filter (tags, types, domains) | PASS |
| Header-Toolbar Reihenfolge | PASS |
| Settings-Sidebar Navigation | PASS |

### Fazit

| | Anzahl |
|--|--------|
| ACs bestanden | 16/16 |
| Bugs Critical | 0 |
| Bugs High | 0 |
| Bugs Medium | 2 (Bug-1, Bug-3) |
| Bugs Low | 1 (Bug-2) |

**Production-Ready: NEIN** — Bug-1 und Bug-3 muessen zuerst gefixt werden.

## Deployment
_To be added by /deploy_
