# Feature Index

**Project:** Raindrop App (Frontend)
**Next Available ID:** RAIN-3

| ID     | Name                       | Priority | Status  | Hauptpfade                                                        | Kurzbeschreibung                                        |
| ------ | -------------------------- | -------- | ------- | ----------------------------------------------------------------- | ------------------------------------------------------- |
| RAIN-1 | Frontend Token-Auth        | P0       | In Review | `src/data/modules/api.js`, `src/data/sagas/user.js`, `src/routes/account/` | Token statt Cookie, persistente Sessions                |
| RAIN-2 | Extension Persistent Login | P0       | In Review | `src/routes/account/extension/`, `src/target/extension/`          | Extension bleibt dauerhaft eingeloggt via Token          |

## Empfohlene Build-Reihenfolge

1. RAIN-1 (Frontend Token-Auth) — Grundlage, haengt von Backend RDBE-12 ab
2. RAIN-2 (Extension Persistent Login) — baut auf RAIN-1 auf

## Abhaengigkeiten zu raindrop-api

- RAIN-1 und RAIN-2 setzen RDBE-12 (Backend Token-Auth) voraus
