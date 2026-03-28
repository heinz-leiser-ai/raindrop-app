# RAIN-1: Frontend Token-Auth

## Status: In Review
**Created:** 2026-03-18
**Last Updated:** 2026-03-18

## Dependencies
- RDBE-12 (Backend Token-Auth) im raindrop-api Repo muss deployed sein

## Kontext

Das Frontend nutzt aktuell `credentials: 'include'` fuer Cookie-basierte Auth. Nach RDBE-12 liefert das Backend Tokens im Login-Response. Das Frontend muss diese Tokens speichern und als `Authorization: Bearer` Header senden.

Zusaetzlich macht die App bei jedem Start einen harten `RESET` des gesamten Redux-State wenn `GET user` fehlschlaegt. Das fuehrt zu unnoetigem Datenverlust und erzwingt erneutes Laden aller Daten.

## User Stories

- Als User moechte ich nach dem Login dauerhaft eingeloggt bleiben, damit ich mich nicht bei jedem Browser-Neustart neu anmelden muss.
- Als User moechte ich beim App-Start sofort meine gecachten Daten sehen, waehrend im Hintergrund geprueft wird ob meine Session noch gueltig ist.
- Als User moechte ich bei abgelaufenem Access-Token automatisch einen neuen bekommen, ohne mich neu einloggen zu muessen.
- Als User moechte ich mich explizit ausloggen koennen und danach keine gespeicherten Tokens mehr haben.
- Als User moechte ich mich per Email/Passwort, Google oder Apple einloggen koennen und in allen Faellen einen persistenten Token erhalten.

## Acceptance Criteria

### AC-1: Token aus Login-Response speichern
- [x] Nach erfolgreichem Email-Login wird `token` und `refresh_token` aus der API-Response im Redux Store gespeichert.
- [x] Token wird via redux-persist + localforage persistiert (ueberlebt Browser-Restart).

### AC-2: Email-Login auf AJAX umstellen
- [x] `src/routes/account/login/index.js`: Formular sendet per AJAX (nicht `<form method='POST'>`) an `auth/email/login` mit `Content-Type: application/json`.
- [x] Bei Fehler wird die Fehlermeldung in der UI angezeigt (kein Server-Redirect).
- [x] Bei Erfolg wird Token gespeichert und User wird zur App weitergeleitet.

### AC-3: API-Modul Authorization Header
- [x] `src/data/modules/api.js`: Alle Requests senden `Authorization: Bearer <token>` Header wenn ein Token im Store vorhanden ist.
- [x] `credentials: 'include'` bleibt als Fallback erhalten (Abwaertskompatibilitaet).

### AC-4: Automatische Token-Erneuerung
- [x] Wenn ein API-Call 401 zurueckgibt und ein `refresh_token` vorhanden ist, wird automatisch `POST auth/refresh` aufgerufen.
- [x] Bei erfolgreicher Erneuerung wird der urspruengliche Request wiederholt.
- [x] Bei fehlgeschlagener Erneuerung wird der User zum Login weitergeleitet.

### AC-5: Kein Hard-Reset bei App-Start
- [x] `src/data/sagas/user.js` `loadUser()`: Kein `RESET` dispatch mehr bei App-Start.
- [x] Gecachte Daten (Collections, Bookmarks etc.) bleiben erhalten waehrend `GET user` im Hintergrund laeuft.
- [x] Bei ungueltigem Token: Soft-Redirect zum Login-Screen, ohne State-Verlust der UI-Einstellungen.

### AC-6: OAuth/Social Login Token-Handling
- [x] Google/Apple Login: Nach OAuth-Redirect wird Token via bestehender JWT-Route (`/account/jwt?token=...`) empfangen und gespeichert.
- [x] Bestehender Flow in `src/routes/account/jwt/index.js` wird erweitert um Token-Persistierung.

### AC-7: Logout
- [x] Bei Logout werden `token` und `refresh_token` aus dem Redux Store geloescht.
- [x] API-Call `GET auth/logout` sendet Bearer-Token statt nur Cookie.

## Edge Cases

- Token im Store aber Backend wurde neu deployed (Token ungueltig): Refresh versuchen, bei Fehler Soft-Redirect zum Login.
- Mehrere Tabs offen: Token-Erneuerung darf nicht zu Race-Conditions fuehren (nur ein Refresh gleichzeitig).
- Offline beim App-Start: Gecachte Daten anzeigen, Token-Validierung nachholen wenn wieder online.
- Migration von Cookie zu Token: Bestehende Cookie-Sessions funktionieren weiter bis der User sich neu einloggt und dabei einen Token erhaelt.
- LocalForage voll oder blockiert: Graceful Degradation — App funktioniert, aber Token geht bei Browser-Restart verloren.

## Betroffene Dateien

- `src/data/modules/api.js` — Authorization Header, Token-Refresh-Logik
- `src/data/sagas/user.js` — loadUser ohne RESET, Token-Speicherung nach Login
- `src/data/reducers/user.js` — Token-Felder im State
- `src/data/constants/user.js` — Neue Action-Types fuer Token
- `src/routes/account/login/index.js` — AJAX statt Form-POST
- `src/routes/account/jwt/index.js` — Token-Persistierung nach JWT-Login
- `src/routes/account/redirect.js` — Redirect-Logik anpassen
- `src/data/modules/persistConfig.js` — Sicherstellen dass Token persistiert wird (user ist bereits in whitelist)

## Abgrenzung

- Backend-Aenderungen (Token in Response, Refresh-Endpoint) → RDBE-12 (raindrop-api)
- Extension-spezifischer Login-Flow → RAIN-2

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
