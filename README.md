# Raindrop.io 5.0

Mono repo for Raindrop.io web app, browser extension and desktop app

## Build

Be sure to run `npm i` before calling any commands below


| target   | command                           | notes                             |
| -------- | --------------------------------- | --------------------------------- |
| web      | `npm run build`                   |                                   |
| electron | `npm run build:electron`          |                                   |
| chrome   | `npm run build:extension:chrome`  |                                   |
| edge     | `npm run build:extension:edge`    |                                   |
| firefox  | `npm run build:extension:firefox` | Saved to `dist/firefox/prod`      |
| opera    | `npm run build:extension:opera`   |                                   |
| safari   | `npm run build:extension:safari`  | Then open **build/xcode** project |


## Development


| target | command                          | notes                                                           |
| ------ | -------------------------------- | --------------------------------------------------------------- |
| web    | `npm run local`                  |                                                                 |
| chrome | `npm run local:extension:chrome` | Turn off `same-site-by-default-cookies` in Chrome browser flags |

## Local start/stop

### Start web app

1. Install deps once:
   - `npm i`
2. Start dev server:
   - `npm run local`
3. Open:
   - `http://localhost:2000`

### Stop web app

- In the terminal where `npm run local` is running:
  - `Ctrl + C`

### If port 2000 is still blocked

- Check process:
  - `lsof -nP -iTCP:2000 -sTCP:LISTEN`
- Kill process (replace `<PID>`):
  - `kill -9 <PID>`

## Recent project changes

- API base URL now points to Supabase Edge Function backend:
  - `https://heutudmyharxiwnofost.supabase.co/functions/v1/api/`
- Thumbnail URLs no longer call `rdl.ink` directly from frontend.
  - Frontend now calls backend proxy path:
    - `/thumbnail/render/{encodedUrl}`
  - Backend signs and redirects to:
    - `https://html2pdf-theta.vercel.app/api/v1/thumbnail?...&token=...`
- Secret handling:
  - `THUMBNAIL_SIGNING_SECRET` is backend-only and must never be used in frontend.


## Supported browsers

- Chrome >= 67 - older versions not support SameSite cookie
- Safari >= 11 (OS X 10.11) - older version not support JS Rest in objects
- Firefox >= 55 - older version not support JS Rest in objects
- Edge >= 80 - earlies Blink version

