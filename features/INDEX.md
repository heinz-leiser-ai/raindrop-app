# Feature Index

**Project:** Raindrop App (Frontend)
**Next Available ID:** RAIN-7

| ID     | Name                       | Priority | Status  | Hauptpfade                                                        | Kurzbeschreibung                                        |
| ------ | -------------------------- | -------- | ------- | ----------------------------------------------------------------- | ------------------------------------------------------- |
| RAIN-1 | Frontend Token-Auth        | P0       | In Review | `src/data/modules/api.js`, `src/data/sagas/user.js`, `src/routes/account/` | Token statt Cookie, persistente Sessions                |
| RAIN-2 | Extension Persistent Login | P0       | In Review | `src/routes/account/extension/`, `src/target/extension/`          | Extension bleibt dauerhaft eingeloggt via Token          |
| RAIN-3 | Drag & Drop Bookmarks → Collection | P1 | Deployed | `src/co/bookmarks/dnd/`, `src/co/collections/items/tree.js` | Bookmarks per DnD aus Liste in Sidebar-Collection verschieben |
| RAIN-4 | AI Bookmark Reorganisation | P2       | Planned | `src/co/reorganise/`, Backend Edge Functions | KI analysiert Duplikate + schlaegt neue Collection-Struktur vor |
| RAIN-5 | Link Health Check          | P1       | Deployed | Backend Edge Functions, `src/routes/settings/` | Tote Links pruefen, anzeigen, loeschen + Loeschjournal  |
| RAIN-6 | Move Bookmarks aus Suche   | P1       | In Review | `src/co/bookmarks/dnd/`, `src/co/bookmarks/item/` | DnD-Fix in Suche + "Verschieben nach..." Aktion mit Picker |

## Empfohlene Build-Reihenfolge

1. RAIN-1 (Frontend Token-Auth) — Grundlage, haengt von Backend RDBE-12 ab
2. RAIN-2 (Extension Persistent Login) — baut auf RAIN-1 auf
3. RAIN-5 (Link Health Check) — nutzt bestehende Frontend-Infrastruktur, braucht Backend
4. RAIN-4 (AI Bookmark Reorganisation) — unabhaengig, braucht Backend + LLM-Anbindung

## Abhaengigkeiten zu raindrop-api

- RAIN-1 und RAIN-2 setzen RDBE-12 (Backend Token-Auth) voraus
- RAIN-5 braucht neue Edge Functions + DB-Tabellen (kein LLM)
- RAIN-4 braucht neue Edge Functions + DB-Tabellen + LLM-Provider-Konfiguration
