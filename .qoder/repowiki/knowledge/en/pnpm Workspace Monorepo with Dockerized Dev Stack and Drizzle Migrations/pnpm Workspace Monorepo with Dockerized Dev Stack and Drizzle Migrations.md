---
kind: build_system
name: pnpm Workspace Monorepo with Dockerized Dev Stack and Drizzle Migrations
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - pnpm-workspace.yaml
    - docker-compose.yml
    - shared/package.json
    - shared/tsconfig.json
    - server/package.json
    - server/tsconfig.json
    - server/drizzle.config.ts
    - server/Dockerfile
    - client/package.json
    - client/tsconfig.json
    - client/vite.config.ts
    - client/Dockerfile
---

## Build System Overview

RentLite is a **pnpm workspace monorepo** composed of three packages — `shared` (TypeScript domain types), `server` (Express API), and `client` (Vite+React SPA) — orchestrated through a top-level `package.json`, a `docker-compose.yml`, and per-package build scripts. There is no Makefile, CI pipeline, or release automation in this branch; the build surface is entirely npm/pnpm + Docker.

## Core Tools & Versions

- **Package manager**: pnpm ≥9 (enforced via `engines` in root `package.json`).
- **Node runtime**: Node ≥20 locally; Docker images use `node:22-alpine`.
- **TypeScript**: v5.7 across all packages, configured via a shared root `tsconfig.json` that each package extends.
- **Frontend build**: Vite 6 with React plugin and Tailwind CSS v4 (`@tailwindcss/vite`).
- **Backend runtime**: Compiled TypeScript → `dist/index.js`, run via `node`; development uses `tsx watch src/index.ts`.
- **Database migrations**: Drizzle Kit (`drizzle-kit push`, `drizzle-kit studio`) driven by `server/drizzle.config.ts` against PostgreSQL 16.
- **Containerization**: Docker Compose defines `postgres`, `server`, and `client` services; `corepack enable pnpm` is used inside images.

## Workspace Layout & Dependency Graph

```text
root/
├── shared/   ← @rentlite/shared (pure TS, compiled to dist/, consumed as workspace:*)
├── server/   ← Express API, depends on @rentlite/shared
└── client/   ← Vite SPA, depends on @rentlite/shared
```

The root `pnpm-workspace.yaml` declares the three packages. Both `server` and `client` reference the shared package via `"@rentlite/shared": "workspace:*"`. The `shared` package is built first (`tsc`) before either consumer builds, enforced by the top-level `build` script:

```json
"build": "pnpm --filter shared build && pnpm --filter server build && pnpm --filter client build"
```

Each package exposes a uniform `check` script (`tsc --noEmit`) wired into the root `check` command for type-checking the whole workspace.

## Per-Package Build Scripts

| Package | `dev` | `build` | `check` | Notes |
|---|---|---|---|---|
| `shared` | *(none)* | `tsc` | `tsc --noEmit` | Outputs JS + `.d.ts` under `./dist`; `composite: true` enables project references. |
| `server` | `tsx watch src/index.ts` | `tsc` | `tsc --noEmit` | Uses `references` to `../shared`; production entry is `node server/dist/index.js`. |
| `client` | `vite --host 0.0.0.0` | `vite build` | `tsc --noEmit` | Vite dev server proxies `/api` to `http://localhost:3000`; alias `@/*` → `./src/*`. |

Top-level convenience scripts delegate via `pnpm --filter <pkg>`:
- `pnpm dev` → `docker compose up` (full stack).
- `pnpm dev:server` / `pnpm dev:client` → individual package dev servers.
- `pnpm db:push` / `db:studio` / `db:seed` → Drizzle commands scoped to `server`.

## Docker & Compose

`docker-compose.yml` defines three services:
- `postgres` (PostgreSQL 16 Alpine) with healthcheck `pg_isready -U rentlite`.
- `server` built from `server/Dockerfile`, depends on `postgres` being healthy, exposes port 3000, mounts an `uploads` volume.
- `client` built from `client/Dockerfile`, depends on `server`, exposes port 5173.

Environment variables are injected at compose time (e.g., `DATABASE_URL`, `BETTER_AUTH_SECRET`, `CLIENT_URL`, `RESEND_API_KEY`, `PLAID_*`, `TWILIO_*`). Secrets default to development placeholders.

Both Dockerfiles follow the same multi-stage pattern:
1. `FROM node:22-alpine`, `RUN corepack enable pnpm`.
2. Copy workspace root manifests + `shared/package.json` + service `package.json`.
3. `pnpm install --frozen-lockfile 2>/dev/null || pnpm install` (fallback without lockfile).
4. Copy source trees.
5. `pnpm --filter @rentlite/shared build` then `<service> build`.
6. Expose port and set CMD (server runs compiled JS; client runs `pnpm --filter client dev`).

## TypeScript Project References

- Root `tsconfig.json` is extended by every package.
- `shared/tsconfig.json` sets `composite: true` so it can be referenced.
- `server/tsconfig.json` declares `references: [{ path: "../shared" }]`, enabling incremental compilation across the boundary.
- `client/tsconfig.json` adds JSX support (`react-jsx`), DOM libs, and the `@/*` path alias.

## Database Migration Flow

Migrations are schema-driven via Drizzle Kit:
- Schema lives in `server/src/db/schema.ts`.
- `drizzle.config.ts` points at `./src/db/schema.ts`, outputs migrations to `./drizzle`, dialect `postgresql`, credentials from `process.env.DATABASE_URL`.
- Commands: `pnpm db:push` (push schema to DB), `pnpm db:studio` (launch Prisma-style UI), `pnpm db:seed` (run seed script via `tsx`).

## Constraints & Conventions Observed

- All packages must declare a `check` script running `tsc --noEmit`; the root `check` aggregates them.
- The `shared` package is the single source of truth for domain types — both `server` and `client` depend on it via `workspace:*`.
- Development always starts via `pnpm dev` which boots the full Docker Compose stack; local-only dev is supported via `dev:server` / `dev:client`.
- Production artifacts are compiled TypeScript (`dist/`) for both server and shared; the client uses Vite's build output.
- No CI, release, version bumping, or artifact publishing scripts exist in this branch — the build system stops at local/dev and Docker Compose orchestration.