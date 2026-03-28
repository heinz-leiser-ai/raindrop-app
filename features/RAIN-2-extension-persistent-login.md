# RAIN-2: Extension Persistent Login

## Status: In Review
**Created:** 2026-03-18
**Last Updated:** 2026-03-28

## Dependencies
- RDBE-12 (Backend Token-Auth) im raindrop-api Repo
- RAIN-1 (Frontend Token-Auth) — Token-Speicherung und API-Modul muessen fertig sein

## Kontext

Die Chrome Extension oeffnet aktuell die WebApp zum Login (`/account/extension`). Nach dem Login setzt der Server einen Cookie. Da die Extension auf einem eigenen Origin (`chrome-extension://...`) laeuft, kann sie diesen Cookie nicht nutzen. Chrome blockiert zunehmend Third-Party-Cookies, was das Problem verschaerft. Safari braucht einen eigenen Workaround (Web-Origin statt Extension-Page).

**Loesung:** Nach dem Login in der WebApp wird der Token an die Extension zurueckgegeben. Die Extension speichert ihn in ihrem eigenen localforage und sendet ihn als Bearer-Header.

## User Stories

- Als Extension-Nutzer moechte ich mich einmal einloggen und dauerhaft eingeloggt bleiben, ohne mich bei jedem Browser-Neustart neu anmelden zu muessen.
- Als Extension-Nutzer moechte ich den Login ueber die WebApp durchfuehren und danach automatisch in der Extension eingeloggt sein.
- Als Safari-Extension-Nutzer moechte ich den gleichen Login-Flow nutzen wie Chrome-Nutzer, ohne Sonder-Workarounds.
- Als Extension-Nutzer moechte ich mich in der Extension ausloggen koennen.

## Acceptance Criteria

### AC-1: Token-Uebergabe nach WebApp-Login
- [x] Extension oeffnet WebApp-Login im separaten Tab (`target=_blank`, URL `/account/login?redirect=...`).
- [x] Nach erfolgreichem Login: Redirect auf `/account/extension/callback`; Tokens an Extension per `postMessage` + Content-Script (nicht JWT in der URL — funktional gleichwertig zu „URL mit Token“).
- [ ] Login-Tab nach Erfolg **automatisch schliessen** — nicht umgesetzt (nur UI-Hinweis „Tab schliessen“; optional laut Tech Design).

### AC-2: Token in Extension speichern
- [x] Token in `chrome.storage.local` (`rd_bearer_*`) und Redux-Persist/localforage (`user`); `authSession` spiegelt bei Set/Clear.
- [x] Persistenz ueber `chrome.storage.local` / redux-persist — ueberlebt Browser-Neustart (manuell verifizieren).
- [x] API: `Authorization: Bearer` via RAIN-1 `api.js` + `authSession`.

### AC-3: Safari-Workaround entfaellt
- [x] `popup.js`: kein separater Web-Origin mehr fuer Safari — gleicher `base` wie Chrome (`/index.html#`).
- [x] Zweiter Bullet (optionaler Workaround) — entfaellt durch obiges.

### AC-4: Welcome-Page Token-Auth
- [x] `welcome/logic.js`: `Authorization: Bearer` wenn `rd_bearer_access` in Extension-Storage; weiterhin `credentials: 'include'` zusaetzlich.

### AC-5: Extension Logout
- [x] `clearAuthTokens()` entfernt `rd_bearer_*` bei Extension-Target (`authSession.js`).
- [x] Logout-Request nutzt dieselbe Fetch-Schicht mit Bearer wie andere Calls (`mergeFetchOptions` in `api.js`).

### AC-6: Automatische Token-Erneuerung
- [x] Gleiche Logik wie WebApp: `runRefreshIfNeeded` / 401-Retry in `api.js` (RAIN-1).

## Edge Cases

- Extension wird installiert waehrend User bereits in WebApp eingeloggt ist: User muss sich in Extension separat einloggen (kein automatischer Token-Transfer).
- Login-Fenster wird vom User geschlossen bevor Login abgeschlossen ist: Extension bleibt im "nicht eingeloggt" Zustand.
- Token laeuft ab waehrend Extension im Hintergrund ist: Beim naechsten API-Call wird Refresh versucht.
- Mehrere Browser-Profile mit gleicher Extension: Jedes Profil hat eigenen Token.
- Extension-Update: Gespeicherter Token bleibt erhalten (localforage/chrome.storage ueberlebt Updates).

## Betroffene Dateien

- `src/routes/account/extension/index.js` — Login-Flow mit Token-Rueckgabe
- `src/target/extension/background/popup.js` — Safari-Workaround pruefen/entfernen
- `src/assets/target/extension/welcome/logic.js` — Auth-Check auf Token umstellen
- `src/data/modules/api.js` — bereits durch RAIN-1 angepasst (Bearer-Header)
- `src/routes/account/index.js` — Extension-Route ggf. anpassen

## Abgrenzung

- Backend Token-Endpoints → RDBE-12 (raindrop-api)
- Token-Speicherung im API-Modul und Redux → RAIN-1
- Dieses Feature behandelt NUR den Extension-spezifischen Login-Flow und Token-Uebergabe

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Architektur-Entscheid

Die Extension und die WebApp teilen sich dieselbe Codebasis (Webpack-Target `extension`), nutzen aber **getrennte Browser-Origins**. Session-Cookies der API sind in der Extension nicht zuverlaessig nutzbar. RAIN-1 liefert bereits **Bearer-Tokens** und zentrale Refresh-Logik im API-Modul.

RAIN-2 ergaenzt den **Extension-spezifischen Uebergang**: Nach erfolgreichem Login in einem normalen Browser-Tab (WebApp-Origin) werden Access- und Refresh-Token in den **Extension-Kontext** uebernommen und dort dauerhaft gespeichert. Anschliessend verhaelt sich die Extension wie die WebApp: dieselben API-Aufrufe, dieselbe Token-Erneuerung.

### Komponenten-Struktur (logischer Ablauf)

```
Extension (Popup / Options / Background)
+-- „Sign In“ oeffnet WebApp in neuem Fenster/Tab (bestehende URL aus Konfiguration)
+-- WebApp: Login wie RAIN-1 (JSON, Tokens in Antwort)
+-- Gezielte „Rueckkehr“-Seite nach Login
|   +-- Traegt Tokens in die Extension ein (z. B. ueber Extension-Bridge: Message oder Redirect mit einmaligem Token in der URL, konsistent mit /account/jwt)
+-- Background oder Popup
|   +-- Speichert Tokens in Extension-Storage (persistent)
|   +-- Schliesst Login-Fenster nach Erfolg (optional)
+-- Welcome-Onboarding (statische Seite)
|   +-- Auth-Check per API mit Bearer statt Cookie-Only
+-- Alle Daten-Requests
    +-- Nutzen RAIN-1 API-Schicht (Authorization + Refresh bei 401)
```

### Datenmodell (plain language)

- **Pro Browser-Profil:** ein gespeicherter **Access-Token** und **Refresh-Token** (gleiche Semantik wie in RAIN-1).
- **Speicherort:** Extension-spezifischer persistenter Speicher (z. B. `chrome.storage.local` oder das bestehende localforage-Setup des Extension-Targets), sodass Tokens **Ueber Neustart** erhalten bleiben.
- **Kein serverseitiges neues Datenmodell** — weiterhin Supabase-/API-Session ueber bestehende Endpunkte.

### Tech-Entscheidungen (Warum)

| Entscheidung | Begruendung |
|--------------|-------------|
| Login im WebApp-Tab statt nur in der Extension | Nutzt vorhandene Login-UI und RAIN-1-Flow; vermeidet doppelte Login-Implementierung. |
| Token in die Extension uebernehmen | Cookies sind cross-origin unzuverlaessig; Bearer ist explizit und von RAIN-1/RDBE-12 abgedeckt. |
| Gleiche API-/Refresh-Logik wie WebApp | Ein Codepfad (`api.js` + `authSession`), weniger Fehler, konsistentes Verhalten. |
| Safari-Popup-Workaround nur noch falls noetig | Mit Bearer entfaellt die Dringlichkeit „Cookie auf eigener Web-Origin“; Ziel ist einheitliches Verhalten mit Chrome. |
| Welcome-Page: Auth per Bearer | Hardcodierte Cookie-URLs sind fehleranfaellig; Anzeige „eingeloggt“ folgt dem echten API-Status. |

### Dependencies (Packages)

- **Keine neuen Pakete** vorgesehen — WebExtension-Polyfill und bestehende Redux/Persist-Kette reichen.

### Risiken / Annahmen

- **OAuth/Social-Login** endet nach Provider-Redirect auf der WebApp; die Rueckgabe der Tokens an die Extension muss in der **Redirect-/JWT-Route** abgestimmt sein (bereits teilweise durch `/account/jwt` vorgesehen).
- **Manuelle Installation** der Extension bei bereits eingeloggtem Web-Tab: kein automatischer Token-Import ohne expliziten Login-Schritt in der Extension (siehe Edge Cases in der Spec).

### Handoff

- Implementierung: **Frontend** im Repo `raindrop-app` (Extension-Target), nach Freigabe dieses Designs.
- Backend: **bereits** durch RDBE-12 + RAIN-1 vorbereitet; keine zusaetzliche API-Spezifikation fuer RAIN-2 ausser Abstimmung der **Callback-URL** fuer Token-Uebergabe.

## QA Test Results

**Tested:** 2026-03-28  
**Methode:** Code-Review + Build-Check (Webpack Web + Extension Chrome). **Kein vollstaendiger manueller Browser-Lauf** (Extension installieren, Login, Neustart) — vor Deploy empfohlen.

### Acceptance Criteria Status

| AC | Ergebnis | Anmerkung |
|----|----------|-----------|
| AC-1 | Teilweise | Token-Uebergabe und Erkennung OK; **automatisches Schliessen des Login-Tabs** offen (siehe offenes AC-1-Item). |
| AC-2 | Pass (Review) | Speicherorte und `api.js`-Bearer im Code nachvollziehbar; Neustart-Persistenz manuell pruefen. |
| AC-3 | Pass | `popup.js` vereinheitlicht. |
| AC-4 | Pass | Welcome nutzt Bearer aus Storage. |
| AC-5 | Pass (Review) | Logout-Saga + `clearAuthTokens` + API-Header. |
| AC-6 | Pass | Gemeinsamer Codepfad mit WebApp. |

### Edge Cases (Review)

| Edge Case | Einschaetzung |
|-----------|----------------|
| Install bei bestehendem Web-Login | Kein Auto-Import — wie spezifiziert; Extension braucht eigenen Login. |
| Tab zu frueh geschlossen | Extension bleibt ausgeloggt — plausibel. |
| Token abgelaufen | Refresh bei 401 wie RAIN-1 — Codepfad vorhanden. |
| Mehrere Profile / Update | `chrome.storage` pro Profil; Persistenz ueberlebt Update — Standardverhalten. |

### Security Audit (kurz)

- **Content-Script** `authBridge`: nur feste erlaubte Web-Origins fuer `postMessage`.
- **Risiko:** Tokens liegen kurz im Seitenkontext bei Callback; ueblich fuer diese Bridge — kein Secret im Klartext in der URL.
- **Manuell:** Netzwerk-Tab pruefen, ob keine Tokens in Query-Strings geloggt werden (Callback nutzt Redux, keine Token in URL).

### Bugs / Follow-ups

| ID | Schwere | Beschreibung |
|----|---------|--------------|
| FU-1 | Low | AC-1: Login-Tab automatisch schliessen oder explizit aus Spec streichen. |
| FU-2 | — | Manueller End-to-End-Test: Chrome + ggf. Firefox/Safari Extension. |

### Summary

- **Acceptance Criteria:** 5/6 voll, 1 Teil (AC-1 Schliessen Tab).  
- **Production Ready:** **Bedingt** — nach manuellem E2E-Test auf **JA** setzen.  
- **Empfehlung:** Einmal kompletter Login-Flow in der gebauten Extension; dann Status auf **Done** / Deploy.

## Deployment
_To be added by /deploy_
