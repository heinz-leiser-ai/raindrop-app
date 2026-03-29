# RAIN-7: Move-Journal (Activity Log)

## Status: In Progress
**Created:** 2026-03-29
**Last Updated:** 2026-03-29

## Dependencies
- RAIN-1 (Token-Auth) muss deployed sein (API-Zugriff)
- Backend: Neue Tabelle + Edge Function Endpunkte

## Kontext

Aktuell gibt es kein Protokoll, wenn Bookmarks oder Collections verschoben werden. Der User moechte nachvollziehen koennen, welche Objekte wann wohin verschoben, geloescht, wiederhergestellt oder erstellt wurden — und im Fehlerfall eine Verschiebung rueckgaengig machen.

## User Stories

- Als User moechte ich sehen, welche Bookmarks ich in den letzten Tagen verschoben habe, damit ich versehentliche Verschiebungen erkennen kann.
- Als User moechte ich sehen, wenn ich eine Collection unter eine andere verschoben habe.
- Als User moechte ich sehen, wenn Bookmarks in den Papierkorb verschoben oder daraus wiederhergestellt wurden.
- Als User moechte ich sehen, wenn Bookmarks neu erstellt wurden.
- Als User moechte ich eine Verschiebung per Undo-Button rueckgaengig machen.
- Als User moechte ich das Journal in den Settings einsehen.
- Als User moechte ich, dass Eintraege nach 90 Tagen automatisch geloescht werden.

## Acceptance Criteria

### AC-1: Backend — Tabelle und API

- [ ] Tabelle `move_journal` existiert mit Feldern: `id`, `user_id`, `action` (move, trash, restore, create), `object_type` (bookmark, collection), `object_id`, `object_title`, `from_collection_id`, `from_collection_name`, `to_collection_id`, `to_collection_name`, `created_at`
- [ ] RLS: User sieht nur eigene Eintraege
- [ ] `GET /api/move-journal` liefert paginierte Eintraege (neueste zuerst)
- [ ] `POST /api/move-journal/undo/{id}` macht eine Verschiebung rueckgaengig (setzt `collectionId` bzw. `parentId` auf den alten Wert)
- [ ] `DELETE /api/move-journal` loescht alle Eintraege des Users
- [ ] Cron/Trigger: Eintraege aelter als 90 Tage werden automatisch geloescht

### AC-2: Backend — Journal-Eintraege schreiben

- [ ] Beim Verschieben eines Bookmarks (PUT raindrop/{id} mit collectionId-Aenderung) wird ein Journal-Eintrag mit `action=move`, `object_type=bookmark` geschrieben
- [ ] Beim Batch-Verschieben (PUT raindrops/{collectionId} mit collectionId) werden Journal-Eintraege pro Bookmark geschrieben
- [ ] Beim Loeschen (Move to Trash, collection_id → -99) wird `action=trash` geschrieben
- [ ] Beim Wiederherstellen aus Trash (collection_id von -99 → anderer Wert) wird `action=restore` geschrieben
- [ ] Beim Erstellen eines Bookmarks wird `action=create` geschrieben
- [ ] Beim Verschieben einer Collection (parentId-Aenderung, PUT collection/{id}) wird ein Journal-Eintrag mit `object_type=collection` geschrieben
- [ ] Collection-Namen (`from_collection_name`, `to_collection_name`) werden zum Zeitpunkt der Aktion aufgeloest und gespeichert (nicht als FK)

### AC-3: Frontend — Journal-Ansicht in Settings

- [ ] Neuer Bereich/Tab "Activity" in den Settings (`src/routes/settings/`)
- [ ] Liste zeigt Journal-Eintraege chronologisch (neueste oben)
- [ ] Jeder Eintrag zeigt: Icon (je nach action), Objekt-Titel, Von → Nach Collection, Zeitstempel
- [ ] Pagination oder "Mehr laden"-Button
- [ ] Leerzustand wenn keine Eintraege vorhanden

### AC-4: Frontend — Undo-Funktion

- [ ] Jeder Move/Trash-Eintrag hat einen Undo-Button
- [ ] Klick auf Undo ruft `POST /api/move-journal/undo/{id}` auf
- [ ] Nach erfolgreichem Undo verschwindet der Undo-Button (Eintrag bleibt mit Markierung "rueckgaengig gemacht")
- [ ] Create- und Restore-Eintraege haben keinen Undo-Button

### AC-5: Frontend — Eintraege loeschen

- [ ] Button "Journal leeren" in der Journal-Ansicht
- [ ] Bestaetigung via Dialog ("Bist du sicher?")
- [ ] Ruft `DELETE /api/move-journal` auf

## Edge Cases

- **Bookmark wurde bereits permanent geloescht:** Undo schlaegt fehl → Fehlermeldung anzeigen ("Bookmark existiert nicht mehr")
- **Ziel-Collection wurde geloescht:** Undo schlaegt fehl → Fehlermeldung ("Collection existiert nicht mehr")
- **Batch-Move mit 100+ Bookmarks:** Journal-Eintraege werden in einem Batch geschrieben. In der Anzeige gruppieren ("50 Bookmarks verschoben nach X")
- **Collection-Verschiebung (parentId):** Wird als eigener Eintrag geloggt. `from_collection_name` = alter Parent-Name (oder "Root"), `to_collection_name` = neuer Parent-Name
- **Doppelter Undo:** Server prueft ob bereits rueckgaengig gemacht → ignoriert zweiten Versuch
- **90-Tage-Cleanup:** pg_cron Job oder Supabase Scheduled Function

## Betroffene Bereiche

### Backend (raindrop-api)

| Datei / Bereich | Aenderung |
|-----------------|-----------|
| Migration: `move_journal` | Neue Tabelle + RLS + 90-Tage-Cleanup |
| `supabase/functions/api/routes/raindrops.ts` | Journal-Eintraege bei Move/Trash/Restore/Create schreiben |
| `supabase/functions/api/routes/collections.ts` | Journal-Eintrag bei parentId-Aenderung schreiben |
| `supabase/functions/api/routes/moveJournal.ts` (neu) | GET (Liste), POST undo, DELETE (clear) |
| `supabase/functions/api/index.ts` | Neue Route registrieren |

### Frontend (raindrop-app)

| Datei / Bereich | Aenderung |
|-----------------|-----------|
| `src/routes/settings/` | Neuer "Activity"-Bereich |
| `src/data/actions/` | Neue Actions fuer Journal (load, undo, clear) |
| `src/data/reducers/` | Neuer Reducer fuer Journal-State |
| `src/data/sagas/` | Neue Saga fuer API-Calls |

## Tech Design (Solution Architect)

### Komponentenstruktur

```
Settings Layout (bestehend)
+-- Sidebar
|   +-- "Activity" Link (neu, neben "Loeschjournal")
|
+-- Main (Outlet)
    +-- PageSettingsActivity (neue Route /settings/activity)
        +-- Header + Title "Activity"
        +-- Toolbar
        |   +-- "Journal leeren" Button (mit Confirm-Dialog)
        |
        +-- Journal-Liste
        |   +-- JournalEntry (pro Eintrag)
        |   |   +-- Action-Icon (move/trash/restore/create)
        |   |   +-- Objekt-Titel + Typ-Badge (Bookmark/Collection)
        |   |   +-- "Von [Collection] → Nach [Collection]"
        |   |   +-- Zeitstempel (relativ, z.B. "vor 2 Stunden")
        |   |   +-- Undo-Button (nur bei move/trash, nicht bei undone)
        |   |   +-- "Rueckgaengig gemacht" Badge (nach Undo)
        |   |
        |   +-- Gruppierung: Batch-Moves als zusammengeklappte Gruppe
        |       ("50 Bookmarks verschoben nach X" + aufklappbar)
        |
        +-- Footer
        |   +-- "Mehr laden" Button (Pagination)
        |   +-- Leerzustand ("Keine Aktivitaeten")
        |
        +-- Fehler-Handling
            +-- Undo-Fehlermeldung ("Bookmark existiert nicht mehr")
```

### Datenmodell

**Tabelle `move_journal` (PostgreSQL/Supabase)**

Jeder Eintrag hat:
- Eindeutige ID (automatisch)
- User-ID (Zuordnung zum Besitzer, mit RLS geschuetzt)
- Aktion: "move", "trash", "restore" oder "create"
- Objekt-Typ: "bookmark" oder "collection"
- Objekt-ID (Referenz auf das verschobene Objekt)
- Objekt-Titel (Snapshot zum Zeitpunkt der Aktion)
- Quell-Collection: ID + Name (Snapshot)
- Ziel-Collection: ID + Name (Snapshot)
- Undone-Flag: Ob der Eintrag rueckgaengig gemacht wurde
- Batch-ID: Optionale Gruppen-ID fuer zusammengehoerige Batch-Verschiebungen
- Zeitstempel (automatisch)

**Warum Snapshots statt Foreign Keys fuer Collection-Namen:**
Collections koennen umbenannt oder geloescht werden. Der Journal-Eintrag soll den Zustand ZUM ZEITPUNKT der Aktion zeigen.

**Speicherung:** Supabase PostgreSQL (gleich wie `link_check_journal`)
**Retention:** 90 Tage, automatischer Cleanup per Supabase Scheduled Function oder pg_cron

### Redux State (Frontend)

```
state.moveJournal
+-- status: "idle" | "loading" | "loaded" | "error"
+-- items: [ ...Journal-Eintraege ]
+-- hasMore: true/false (fuer Pagination)
+-- page: aktuelle Seite
```

Gleiches Pattern wie `state.linkCheck`: Kein eigenes Selectors-Modul, Views greifen direkt auf `state.moveJournal` zu.

### API-Endpunkte

| Methode | Pfad | Zweck |
|---------|------|-------|
| GET | `move-journal?page=0&perpage=50` | Paginierte Liste (neueste zuerst) |
| POST | `move-journal/undo/{id}` | Verschiebung rueckgaengig machen |
| DELETE | `move-journal` | Alle Eintraege des Users loeschen |

Routing: Neuer Prefix `move-journal/` in `api/index.ts`, eigene Route-Datei `routes/moveJournal.ts`.

### Journal-Eintraege schreiben

Eintraege werden SERVERSEITIG geschrieben (nicht vom Frontend):

| Trigger | Wo (Backend) | Action | Object Type |
|---------|--------------|--------|-------------|
| Bookmark verschoben (collectionId aendert sich) | `raindrops.ts` → `updateRaindrop` | move | bookmark |
| Bookmark in Trash (collection_id → -99) | `raindrops.ts` → `deleteRaindrop` | trash | bookmark |
| Bookmark aus Trash wiederhergestellt | `raindrops.ts` → `updateRaindrop` | restore | bookmark |
| Bookmark erstellt | `raindrops.ts` → `createRaindrop` | create | bookmark |
| Batch-Move (PUT raindrops/{id}) | `raindrops.ts` → `batchUpdateRaindrops` | move | bookmark |
| Collection verschoben (parentId aendert sich) | `collections.ts` → `updateCollection` | move | collection |

**Batch-Logik:** Bei Batch-Moves wird eine gemeinsame `batch_id` (UUID) generiert. Alle Eintraege im Batch teilen diese ID. Das Frontend gruppiert nach `batch_id`.

### Undo-Mechanismus

1. Frontend ruft `POST move-journal/undo/{id}` auf
2. Backend liest den Journal-Eintrag
3. Je nach `object_type`:
   - **bookmark:** Setzt `collection_id` auf `from_collection_id` zurueck
   - **collection:** Setzt `parent_id` auf `from_collection_id` zurueck
4. Markiert den Eintrag als `undone = true`
5. Schreibt einen NEUEN Journal-Eintrag fuer die Rueckverschiebung

**Fehlerfall:** Wenn das Objekt nicht mehr existiert, gibt der Server einen Fehler zurueck. Frontend zeigt Fehlermeldung.

### Abhaengigkeiten

- Keine neuen NPM-Packages noetig
- Nutzt bestehende UI-Bausteine: `~co/common/list`, `~co/common/form`, `~co/overlay/dialog`, `~co/screen/splitview/main`
- Nutzt bestehende Redux-Infrastruktur: `seamless-immutable`, `redux-saga`, `~data/modules/api`
- Nutzt bestehendes Settings-Layout und Sidebar-Navigation

### Bestehendes Pattern als Vorlage

Die Implementierung folgt exakt dem Pattern von RAIN-5 (Link Health Check Journal):
- **Backend:** `link_check_journal` Tabelle + `linkCheck.ts` Route → analog `move_journal` Tabelle + `moveJournal.ts` Route
- **Frontend:** `src/routes/settings/journal/` → analog `src/routes/settings/activity/`
- **Redux:** `src/data/*/linkCheck.*` → analog `src/data/*/moveJournal.*`

## Abgrenzung

- Kein Echtzeit-Feed (kein WebSocket/Polling)
- Keine Filterung nach Aktion oder Objekt-Typ (MVP)
- Kein Export der Journal-Daten
- Keine Benachrichtigungen
