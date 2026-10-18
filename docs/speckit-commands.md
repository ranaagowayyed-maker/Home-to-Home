# Spec-Kit Commands — From Home To Home (من البيت للبيت)

The spec-kit commands for this project, run in this order. The source of truth for scope is [docs/PRD.md](PRD.md).

## 1. Constitution

```
/speckit-constitution Create the project constitution for "From Home To Home" (من البيت للبيت), a web marketplace where mothers list homemade meals, customers browse and order them (cash on delivery), and delivery personnel accept delivery requests. Stack: React 18 + TypeScript + Tailwind (frontend, Vitest + React Testing Library); .NET 10 with C# and ASP.NET Core Web API + Entity Framework Core (backend, xUnit); PostgreSQL + Redis; REST under /api/v1/. The source of truth for scope is docs/PRD.md. Focus the principles on code quality, testing, and maintainability:

1. Code quality
- Frontend: TypeScript strict mode; no `any` without a written justification; ESLint and Prettier enforced in CI.
- Backend: C# nullable reference types enabled; warnings treated as errors; .NET analyzers and `dotnet format` enforced in CI; async/await end to end with CancellationToken on I/O calls.
- A PR cannot merge with lint, format, type or compiler errors.
- Small, single-purpose classes and components; business rules live in backend application services, never in controllers or UI components. Use dependency injection and program to interfaces for services and repositories.
- Money is stored in minor units (integers). Order item name and price are snapshotted at order time.

2. Documentation (mandatory)
- Every C# class, interface, method, property and enum has full XML documentation comments (summary, param, returns, exceptions, and an example for public service methods).
- Every React component, its props interface/type, hook and function has full TSDoc: purpose, every prop (type, meaning, default, required or optional), return value, and a usage example for components.
- Every API endpoint is documented (OpenAPI generated from the XML comments: method, path, auth/role, request, response, error codes) and references its PRD feature ID (for example P0-F003).
- Public behavior changes update docs in the same PR.

3. Testing (mandatory)
- Every added or changed component, hook, utility, service and controller ships with unit tests in the same PR: Vitest + React Testing Library on the frontend, xUnit on the backend. A component without a unit test is not done.
- Unit tests cover the happy path, validation errors, loading, error and empty states, and role-based access.
- Integration tests are optional but recommended for critical flows: auth and token refresh, order placement, the order status state machine, and atomic delivery-request acceptance (two simultaneous accepts, one wins). Backend integration tests use WebApplicationFactory with a real PostgreSQL (Testcontainers).
- Acceptance criteria in the PRD map to tests; tests are written or updated with the code, not after.
- Never skip, disable or delete a test to get CI green.

4. Security and correctness
- Authentication on every endpoint except register, login and refresh; role and ownership checks on every resource (customer, mother, delivery) through ASP.NET Core authorization policies.
- All input validated server-side; passwords hashed with the ASP.NET Core password hasher; secrets only in configuration or environment variables; contact details shown only to parties on an order.
- Order status changes go only through the defined state machine.

5. UX consistency and accessibility
- Every feature defines validation, loading, error, empty and success states, with inline field errors and a confirmation after every save.
- WCAG 2.1 AA, mobile-first and responsive; Chrome 100+, Safari 15+, Firefox 100+.

6. Maintainability and delivery
- MVP simplicity: build only what is in the PRD P0 and P1 lists; no speculative abstractions; anything in P2/P3 needs an approved PRD change first.
- Feature branches named NNN-feature-name; small PRs, each linked to its PRD feature ID.
- Database changes only through EF Core migrations; migrations are reviewed and reversible where possible.
- CI (GitHub Actions) must pass lint, format, build, unit tests and type checks for both frontend and backend before merge.
- Performance budgets: page load under 2s, API p95 under 500ms; structured JSON logs with request IDs.

Governance: the constitution overrides other practices; amendments require a documented reason and a version bump.
```

## 2. Specify

`/speckit-specify` describes what and why, not the tech stack, so the stack stays in the constitution and plan steps.

```
/speckit-specify Build "From Home To Home" (من البيت للبيت), a simple web marketplace for homemade meals. Mothers showcase meals they cook at home, customers browse and order them, and delivery personnel view ready orders and accept delivery requests. It works like existing food delivery apps, but meals come from home cooks instead of restaurants. This is an MVP, so keep everything as simple as possible.

Users and roles:
- Customer (Sara): finds and orders a homemade meal in a few taps.
- Mother (Fatima): lists her meals and prepares incoming orders.
- Delivery person (Omar): sees ready orders and accepts a delivery request.

Must-have capabilities:
1. Sign up, log in and log out with one of three roles (customer, mother, delivery person). Each role lands on its own home screen and can only access its own features.
2. Mothers create, edit, hide and archive meals with name, description, category, price and photo.
3. Customers browse available meals, add meals from one mother to a cart, enter delivery address and phone, and place an order. Payment is cash on delivery only. Total is the meal subtotal plus a flat delivery fee.
4. When a mother marks an order ready, a delivery request opens. Delivery personnel see open requests and accept one. Only one delivery person can win a request, and a delivery person can have at most 3 active deliveries.
5. Order status tracking for all parties: Placed, Preparing, Ready for pickup, Out for delivery, Delivered, plus Rejected (by the mother) and Cancelled (by the customer, only while Placed). Each role can only perform its own allowed status changes, and the order shows a timeline.

Should-have: meal search and filters (name, category, max price), order history per role, in-app notifications, mother availability toggle (pause and resume orders), profile editing.

Out of scope for v1: online payment, ratings and reviews, live map tracking, native mobile app, analytics dashboards, admin panel.

Experience rules: every screen has loading, empty, error and success states; forms show inline validation; every save shows a confirmation; mobile-first and accessible. Contact details and full addresses are shown only to the people involved in an order.

Success: an order can travel end to end (placed, prepared, picked up, delivered) using only the web app, with at least 100 delivered orders in the first 30 days after launch.
```

## 3. Plan

```
/speckit-plan Frontend: React 18 + TypeScript + Tailwind CSS, built with Vite, tested with Vitest and React Testing Library, deployed to Vercel. Backend: .NET 10 (C#) ASP.NET Core Web API with controllers, application services and dependency injection, exposed as REST under /api/v1/ with OpenAPI docs, tested with xUnit (unit) and WebApplicationFactory + Testcontainers (optional integration), deployed as a container on Railway. Data: PostgreSQL through Entity Framework Core (Npgsql) with EF Core migrations; Redis for rate limiting and caching browse queries. Auth: ASP.NET Core JWT bearer with 15-minute access tokens, rotating refresh tokens and role-based authorization policies (CUSTOMER, MOTHER, DELIVERY) plus ownership checks. Meal photos: S3-compatible object storage using pre-signed uploads; only the photo URL is stored in PostgreSQL; in local development use a local S3-compatible container. Product analytics: PostHog or Mixpanel. CI/CD: GitHub Actions running lint, format, build and tests for both frontend and backend. Keep the architecture simple: one frontend app, one API, one database; no microservices, no message queues. Order status changes go through a single state machine in the backend. Accepting a delivery request must be atomic so only one delivery person wins. Follow the constitution (full TSDoc and XML documentation, unit tests for every added component).
```
