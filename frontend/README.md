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

The `Dockerfile` builds the app and serves it with nginx (`nginx.conf.template`). nginx falls back to
`index.html` so deep links work, and forwards `/api/*` to `API_UPSTREAM` (the API's private
address on Railway), so the app and API share one origin and the `HttpOnly` refresh cookie stays
first-party. See "Deploy to Railway" in the root README.

## Layout

```
src/app/
  core/      auth service, HTTP interceptor, route guards, API helpers (ProblemDetails, Paged),
             CartService (signals + localStorage, one kitchen per cart), ConfigService (GET /config)
  features/  auth (landing, sign-up, log-in)
             meals (My Meals, meal form)
             customer (Browse Meals, meal detail, cart, checkout)
             orders (shared order page /orders/:id, customer My Orders, mother Incoming Orders)
             delivery (Available Deliveries, My Deliveries)
  shared/    ui (Button, Field, Toast, Dialog, EmptyState, ErrorBanner, Skeleton, StatusBadge, header)
             lib (money, order statuses, 15 s polling helper, paged "Load more" list, idempotency key)
```

Routes: customer `/browse`, `/browse/:id`, `/cart`, `/checkout`, `/orders`; mother `/my-meals`,
`/incoming-orders`; delivery `/deliveries`, `/deliveries/mine`; every role `/orders/:id`.
Polling screens (order page, Incoming Orders, Available Deliveries) use `pollStream` + `toPollState`
in `shared/lib/poll.ts`: RxJS `timer` + `switchMap` bridged with `toSignal`, so polling stops when
the page is destroyed; the order page also stops once the status is DELIVERED, REJECTED or CANCELLED.
