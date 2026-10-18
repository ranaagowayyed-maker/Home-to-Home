# From Home To Home (من البيت للبيت)

A web marketplace where mothers sell homemade meals, customers order them for cash on delivery, and delivery personnel pick them up and deliver them.

- Product requirements: [docs/PRD.md](docs/PRD.md)
- Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

| Part | Stack | Folder |
|---|---|---|
| API | .NET 10, ASP.NET Core Web API, EF Core, PostgreSQL, Redis | [backend/](backend) |
| Web app | Angular 20, TypeScript, Tailwind CSS | [frontend/](frontend) |

## Run locally

Requirements: .NET 10 SDK, Node.js 22, Docker.

```bash
# 1. PostgreSQL, Redis and MinIO (photo storage)
docker compose up -d

# 2. API on http://localhost:5080 (applies migrations on start in Development)
cd backend
dotnet run --project src/HomeToHome.Api

# 3. Web app on http://localhost:4200 (proxies /api to the API)
cd frontend
npm ci
npm start
```

## Test

```bash
cd backend
dotnet format HomeToHome.sln --verify-no-changes
dotnet test                       # unit tests, plus integration tests against PostgreSQL in Docker (Testcontainers)

cd frontend
npm run lint && npm run format:check && npm run test:ci && npm run build
```

## Database migrations

```bash
cd backend
dotnet tool restore
dotnet ef migrations add <Name> -p src/HomeToHome.Infrastructure -s src/HomeToHome.Api -o Persistence/Migrations
```

## Configuration

Secrets are environment variables, never committed. The API reads:

| Variable | Purpose |
|---|---|
| `ConnectionStrings__Postgres` | PostgreSQL connection string |
| `ConnectionStrings__Redis` | Redis connection string (optional locally; an in-memory login limiter is used when empty) |
| `Jwt__SigningKey` | HMAC-SHA256 signing key, at least 32 characters |
| `Cors__AllowedOrigins__0` | The web app's origin, for example the Vercel domain |
| `Storage__ServiceUrl`, `Storage__Bucket`, `Storage__AccessKey`, `Storage__SecretKey`, `Storage__PublicBaseUrl` | S3-compatible photo storage |
| `Database__MigrateOnStartup` | `true` to apply migrations when the API starts |
