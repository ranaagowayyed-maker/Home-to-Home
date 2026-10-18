# From Home To Home — Frontend

Angular 20 SPA (standalone components, signals, reactive forms, Tailwind CSS v4).

## Requirements

- Node.js 20.19+ or 22.12+ and npm 10
- Chrome/Chromium for unit tests (set `CHROME_BIN` if it is not on the default path)

## Commands

```bash
npm ci                # install exactly what package-lock.json pins
npm start             # dev server on http://localhost:4200, proxies /api → http://localhost:5080
npm run lint          # ESLint (angular-eslint)
npm run format:check  # Prettier check (npm run format to fix)
npm run test:ci       # Karma + Jasmine, single run in headless Chrome
npm run build         # production build to dist/frontend/browser
```

## Configuration

`src/environments/environment.ts`:

| Key        | Default   | Meaning                                                     |
| ---------- | --------- | ----------------------------------------------------------- |
| `apiUrl`   | `/api/v1` | API base path. Same-origin by default; see deployment note. |
| `currency` | `USD`     | ISO currency used by `formatMoney` (two decimals).          |

The dev proxy target lives in `proxy.conf.json`.

## Deployment

`vercel.json` rewrites every path to `index.html` so deep links work. The refresh token is an
`HttpOnly` cookie scoped to `/api/v1/auth`, sent with `withCredentials`. If the API is served from
a different origin, change `apiUrl` to its absolute URL and make sure the API allows credentialed
CORS from the frontend origin.

## Layout

```
src/app/
  core/      auth service, HTTP interceptor, route guards, API helpers (ProblemDetails)
  features/  auth (landing, sign-up, log-in), meals (My Meals, meal form), customer, delivery
  shared/    ui (Button, Field, Toast, Dialog, EmptyState, ErrorBanner, Skeleton, header), lib (money)
```
