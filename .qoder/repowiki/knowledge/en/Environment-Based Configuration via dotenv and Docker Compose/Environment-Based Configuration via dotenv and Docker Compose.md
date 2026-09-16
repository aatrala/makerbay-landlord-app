---
kind: configuration_system
name: Environment-Based Configuration via dotenv and Docker Compose
category: configuration_system
scope:
    - '**'
source_files:
    - .env.example
    - server/src/index.ts
    - server/src/db/index.ts
    - server/drizzle.config.ts
    - client/vite.config.ts
    - client/src/lib/api.ts
    - docker-compose.yml
    - server/Dockerfile
    - client/Dockerfile
---

## What system/approach is used

The RentLite monorepo uses a simple, environment-variable-driven configuration approach built on `dotenv` (server-side) and Vite's `import.meta.env` (client-side). There is no centralized config module or typed configuration loader — each service reads its own settings directly from `process.env` at startup. Runtime values are supplied through three layers: a `.env.example` template, per-service `*.config.ts` files that read env vars, and `docker-compose.yml` which injects the final values into containers.

## Key files and packages

- `.env.example` — single source of truth for all required/optional environment variables across services (database URL, Better Auth secrets, client URL, Resend/Twilio/Plaid keys).
- `server/src/index.ts` — server entry point that calls `import "dotenv/config"` to load `.env`, then reads `PORT` and `CLIENT_URL` directly from `process.env`.
- `server/src/db/index.ts` — constructs the Postgres connection string from `process.env.DATABASE_URL`.
- `server/drizzle.config.ts` — Drizzle Kit migration config that also loads `dotenv/config` and reads `DATABASE_URL`.
- `client/vite.config.ts` — hardcodes dev server port (`5173`) and proxies `/api` to `http://localhost:3000`; no runtime env var usage here.
- `client/src/lib/api.ts` — reads `import.meta.env.VITE_API_URL` (set by Docker Compose) as the API base URL; falls back to empty string so requests resolve relative to the page origin.
- `docker-compose.yml` — defines the `postgres`, `server`, and `client` services; injects every env var listed in `.env.example` into the server container using `${VAR:-default}` syntax, and sets `VITE_API_URL` for the client container.
- `server/Dockerfile` and `client/Dockerfile` — build artifacts with `pnpm --filter` and expose ports 3000 / 5173; rely on runtime env injection rather than bake-in values.

## Architecture and conventions

- **Single env file convention**: All configuration keys live in one `.env.example` at the repo root. Services do not define their own `.env` schemas — they consume the same set of variables.
- **Server-side loading**: The Express server explicitly imports `dotenv/config` at the top of `server/src/index.ts`, so any `.env` file placed next to the process is auto-loaded before any route or DB code runs. The same pattern is repeated in `drizzle.config.ts` so CLI tools like `drizzle-kit` can run without manual env setup.
- **Direct env access**: No abstraction layer exists. Code reads `process.env.PORT`, `process.env.CLIENT_URL`, `process.env.DATABASE_URL`, etc. directly. There are no defaults inside the application code except for `PORT` (`Number(process.env.PORT) || 3000`) and the CORS origin fallback (`process.env.CLIENT_URL || "http://localhost:5173"`).
- **Client-side build-time vs runtime**: Vite exposes only variables prefixed with `VITE_` to the browser bundle. The client reads `import.meta.env.VITE_API_URL` at runtime (injected by Docker Compose), while dev proxying in `vite.config.ts` bypasses this entirely during local development.
- **Docker Compose as the deployment config surface**: `docker-compose.yml` is the authoritative place where production-like values are injected. It uses the `${VAR:-default}` syntax to provide safe fallbacks for optional secrets (Twilio, Plaid) while requiring non-empty values for `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `RESEND_API_KEY`.
- **No feature flags or typed config objects**: The repo does not implement a schema validator, default-value resolver, or typed configuration object. Each consumer parses and validates what it needs inline.

## Conventions and constraints

- Every service-dependent secret must be documented in `.env.example` with a placeholder value; new integrations should add entries there first.
- Server processes must call `import "dotenv/config"` before reading `process.env` if a local `.env` file is expected (already done in `server/src/index.ts` and `server/drizzle.config.ts`).
- Client-facing URLs must be exposed via the `VITE_` prefix so Vite can embed them at build time; the current convention is `VITE_API_URL`.
- Docker Compose should mirror every variable from `.env.example` using `${VAR:-fallback}` syntax so the compose file remains self-contained and runnable without an external `.env` file.
- Hardcoded defaults exist only for non-secret, low-risk values (`PORT = 3000`, CORS origin fallback, empty API base URL); secrets have no in-code defaults and will cause runtime errors if missing.