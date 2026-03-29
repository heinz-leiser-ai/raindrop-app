# RAIN-4: AI Bookmark Reorganisation

## Status: Planned
**Created:** 2026-03-28
**Last Updated:** 2026-03-28

## Dependencies
- Backend: Supabase Edge Function mit Zugriff auf Bookmarks + Collections
- LLM-Provider: Konfigurierbar (OpenAI, Anthropic, Self-hosted/Ollama)
- RAIN-1 (Token-Auth) muss deployed sein (API-Zugriff)

## Kontext

Der User hat ~500-2'000 Bookmarks, die ueber die Zeit unstrukturiert gewachsen sind: Duplikate unter verschiedenen Titeln, inkonsistente Collection-Struktur, Bookmarks in falschen Ordnern. Eine KI soll die gesamte Sammlung analysieren und einen konkreten Reorganisations-Plan vorschlagen, den der User reviewen und ausfuehren kann.

Das Feature besteht aus **drei Phasen**, die nacheinander gebaut werden:
- **Phase 1:** Backend-Analyse (Duplikate erkennen + LLM-Strukturvorschlag)
- **Phase 2:** Review-UI (Vorschlaege anzeigen, akzeptieren/ablehnen)
- **Phase 3:** Bulk-Ausfuehrung (Collections anlegen, Bookmarks verschieben, Duplikate loeschen)

---

## Phase 1: Backend-Analyse

### User Stories

- Als User moechte ich eine Analyse meiner Bookmarks starten, damit ich sehe welche Duplikate existieren und wie meine Sammlung besser organisiert werden koennte.
- Als User moechte ich waehlen koennen, ob alle Bookmarks oder nur bestimmte Collections analysiert werden.
- Als User moechte ich den LLM-Provider in den Settings konfigurieren koennen (API-Key, Modell).

### Acceptance Criteria

#### AC-1: Analyse starten
- [ ] In Settings oder ueber einen Button in der Sidebar kann der User eine Reorganisations-Analyse starten.
- [ ] Der User kann waehlen: "Alle Bookmarks" oder bestimmte Collections auswaehlen.
- [ ] Waehrend der Analyse wird ein Fortschrittsbalken angezeigt (z.B. "Batch 3/8 wird analysiert...").
- [ ] Die Analyse laeuft im Backend (Edge Function), nicht im Browser.

#### AC-2: Duplikat-Erkennung
- [ ] Bookmarks mit identischer URL (nach Normalisierung: Trailing-Slash, www, http/https, Query-Parameter-Reihenfolge) werden als Duplikate erkannt.
- [ ] Bookmarks mit sehr aehnlicher URL (z.B. gleiche Domain + Pfad, unterschiedliche UTM-Parameter) werden als "moeglicherweise gleich" markiert.
- [ ] Fuer jede Duplikat-Gruppe wird ein "bester" Eintrag vorgeschlagen (laengster Titel, meiste Tags, aeltestes Erstelldatum).

#### AC-3: LLM-Strukturvorschlag
- [ ] Alle Bookmarks (title, excerpt, link, domain, tags) werden in Batches an den konfigurierten LLM gesendet.
- [ ] Der LLM schlaegt eine Collection-Struktur vor (Hauptkategorien + Unterkategorien, max. 20 Hauptkategorien).
- [ ] Jeder Bookmark wird genau einer vorgeschlagenen Collection zugeordnet.
- [ ] Bestehende Collections werden beruecksichtigt — der LLM soll sie wiederverwenden wenn sinnvoll.
- [ ] Das Ergebnis wird als JSON in der Datenbank gespeichert (Tabelle `reorganisation_plans`).

#### AC-4: LLM-Provider konfigurierbar
- [ ] In Settings: Dropdown fuer Provider (OpenAI, Anthropic, Ollama/Custom).
- [ ] API-Key Eingabefeld (verschluesselt gespeichert).
- [ ] Modell-Auswahl (z.B. gpt-4o-mini, claude-sonnet, llama3).
- [ ] Optionaler Custom-Endpoint fuer Self-hosted LLMs.

### Edge Cases Phase 1
- **Kein API-Key konfiguriert:** Analyse-Button deaktiviert mit Hinweis "LLM-Provider in Settings konfigurieren".
- **LLM-Timeout bei grossen Batches:** Retry mit exponentiellem Backoff, max. 3 Versuche pro Batch.
- **LLM gibt ungueltiges JSON zurueck:** Batch wird mit anderem Prompt-Format wiederholt.
- **Analyse waehrend laufender Analyse gestartet:** Blockiert mit Hinweis "Analyse laeuft bereits".
- **Leere Collections:** Werden im Vorschlag nicht beruecksichtigt.
- **Bookmarks ohne Titel/Excerpt:** Werden mit URL + Domain an LLM gesendet.

---

## Phase 2: Review-UI

### User Stories

- Als User moechte ich die Duplikate sehen und pro Gruppe entscheiden: behalten, loeschen, oder zusammenfuehren.
- Als User moechte ich die vorgeschlagene Collection-Struktur als Baumansicht sehen, damit ich verstehe wie die KI meine Bookmarks reorganisieren wuerde.
- Als User moechte ich einzelne Zuordnungen aendern (Bookmark in andere vorgeschlagene Collection ziehen), bevor ich den Plan ausfuehre.
- Als User moechte ich den ganzen Plan verwerfen oder die Analyse wiederholen koennen.

### Acceptance Criteria

#### AC-5: Duplikate-Review
- [ ] Liste aller Duplikat-Gruppen mit Vorschau (Titel, URL, Collection, Erstelldatum).
- [ ] Pro Gruppe: "Behalten" (welchen?), "Loeschen" (welche?), "Zusammenfuehren" (bester Titel + alle Tags vereinen).
- [ ] Checkbox "Alle Vorschlaege akzeptieren" fuer schnelle Bearbeitung.
- [ ] Anzahl Duplikate wird prominent angezeigt (z.B. "47 Duplikate in 23 Gruppen gefunden").

#### AC-6: Struktur-Review
- [ ] Vorgeschlagene Collection-Struktur als Baum-Ansicht (wie Sidebar).
- [ ] Jede vorgeschlagene Collection zeigt die zugeordneten Bookmarks (aufklappbar).
- [ ] Neben jeder Collection: Bookmark-Anzahl.
- [ ] Bestehende Collections werden visuell unterschieden von neuen (z.B. Badge "Neu").
- [ ] Vorher/Nachher-Vergleich: Aktuelle Struktur links, vorgeschlagene rechts.

#### AC-7: Manuelle Korrekturen
- [ ] User kann einzelne Bookmarks per Drag & Drop zwischen vorgeschlagenen Collections verschieben.
- [ ] User kann vorgeschlagene Collections umbenennen.
- [ ] User kann vorgeschlagene Collections loeschen (Bookmarks werden "Nicht zugeordnet").
- [ ] User kann neue Collections zum Vorschlag hinzufuegen.
- [ ] Aenderungen werden im gespeicherten Plan aktualisiert (nicht sofort ausgefuehrt).

#### AC-8: Plan-Verwaltung
- [ ] Button "Analyse wiederholen" (erstellt neuen Plan, alter wird ueberschrieben).
- [ ] Button "Plan verwerfen" (loescht den Plan, keine Aenderungen).
- [ ] Plan bleibt gespeichert auch wenn der User die Seite verlaesst.
- [ ] Timestamp: "Analyse vom 28.03.2026, 14:30 Uhr".

### Edge Cases Phase 2
- **Plan veraltet (Bookmarks wurden zwischenzeitlich geaendert):** Hinweis "X Bookmarks wurden seit der Analyse geaendert. Analyse wiederholen?".
- **Vorgeschlagene Collection existiert bereits unter anderem Namen:** Mapping-Vorschlag anzeigen.
- **Alle Duplikate manuell aufgeloest:** Duplikat-Sektion ausblenden.
- **Leerer Plan (keine Aenderungen noetig):** Meldung "Deine Bookmarks sind gut organisiert!".

---

## Phase 3: Bulk-Ausfuehrung

### User Stories

- Als User moechte ich den reviewten Plan mit einem Klick ausfuehren, damit alle Bookmarks reorganisiert werden.
- Als User moechte ich den Fortschritt sehen und die Ausfuehrung notfalls abbrechen koennen.
- Als User moechte ich die Aenderungen rueckgaengig machen koennen, falls das Ergebnis nicht passt.

### Acceptance Criteria

#### AC-9: Plan ausfuehren
- [ ] Button "Plan ausfuehren" mit Bestaetigung ("X Bookmarks verschieben, Y loeschen, Z neue Collections anlegen. Fortfahren?").
- [ ] Neue Collections werden angelegt (via bestehende Collections-API).
- [ ] Bookmarks werden in die Ziel-Collections verschoben (Batch-API).
- [ ] Duplikate werden laut Review geloescht oder zusammengefuehrt.
- [ ] Fortschrittsanzeige waehrend der Ausfuehrung.

#### AC-10: Undo / Rueckgaengig
- [ ] Vor der Ausfuehrung wird ein Snapshot der aktuellen Zuordnung gespeichert.
- [ ] Button "Rueckgaengig machen" in den ersten 24h nach Ausfuehrung verfuegbar.
- [ ] Undo stellt die urspruengliche Collection-Zuordnung aller betroffenen Bookmarks wieder her.
- [ ] Neu angelegte Collections werden beim Undo NICHT geloescht (koennen manuell entfernt werden).

#### AC-11: Abbruch
- [ ] Waehrend der Ausfuehrung: "Abbrechen"-Button stoppt weitere Operationen.
- [ ] Bereits durchgefuehrte Aenderungen bleiben bestehen (kein Rollback bei Abbruch).
- [ ] Nach Abbruch: Anzeige "X von Y Operationen ausgefuehrt. Fortsetzen oder Rueckgaengig?".

### Edge Cases Phase 3
- **Netzwerk-Fehler waehrend Ausfuehrung:** Stopp + Fehlermeldung, bereits verschobene Bookmarks bleiben.
- **Collection-Erstellung schlaegt fehl:** Bookmarks fuer diese Collection werden uebersprungen, Fehler geloggt.
- **Bookmark wurde zwischenzeitlich geloescht:** Ueberspringen, kein Fehler.
- **Undo nach 24h:** Button verschwindet, Hinweis "Undo nicht mehr verfuegbar".
- **Zweite Analyse nach Ausfuehrung:** Erlaubt, arbeitet mit dem neuen Ist-Zustand.

---

## Betroffene Bereiche (Vermutung)

### Backend (raindrop-api)
- Neue Edge Function: `reorganise/analyse` — Duplikate + LLM-Aufruf
- Neue Edge Function: `reorganise/execute` — Bulk-Move + Delete
- Neue Tabelle: `reorganisation_plans` (plan JSON, snapshot, status, timestamps)
- Neue Tabelle: `user_ai_config` (provider, api_key_encrypted, model)

### Frontend (raindrop-app)
- Neue Route: `/settings/ai` — LLM-Provider Konfiguration (existiert teilweise)
- Neue Route: `/my/reorganise` — Review-UI (Duplikate + Struktur + Ausfuehrung)
- Neue Komponenten in `src/co/reorganise/`
- Redux: Neuer Slice `reorganise` (plan, status, progress)

---

## Abgrenzung

- Kein automatisches Ausfuehren ohne User-Review (immer manueller "Ausfuehren"-Schritt).
- Kein Echtzeit-Monitoring von neuen Bookmarks ("Passt das in deine Struktur?") — das waere ein separates Feature.
- Keine Tag-Reorganisation in Phase 1-3 (nur Collection-Zuordnung + Duplikate). Tag-Cleanup koennte Phase 4 werden.
- Kein Training eines eigenen Modells — es wird ein externer LLM genutzt.

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
