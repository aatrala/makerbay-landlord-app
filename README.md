# RentLite — Simple Property Management

RentLite is a property management app for small landlords: properties and units,
tenants and leases, rent tracking, maintenance with AI triage, expenses,
vendors, and a tenant portal.

## Structure

- `client/` — React + Vite frontend (landlord dashboard + tenant portal)
- `server/` — Express API (Better-Auth, Drizzle ORM, Stripe, Resend, OpenAI)
- `shared/` — shared TypeScript types

## Quick start (no Docker needed)

Requires Node 20+. pnpm is enabled automatically via corepack:

```bash
corepack enable
pnpm install
pnpm run build        # builds shared, server, and client
pnpm --filter server db:seed   # loads demo data
pnpm dev:server       # API on http://localhost:3000
pnpm dev:client       # UI on http://localhost:5173
```

The server runs on an embedded PostgreSQL database by default
(`DATABASE_URL=pglite:./pgdata` in `.env`) — no Docker or external database
required. Data persists in `server/pgdata/`.

### Demo accounts

- Landlord: `landlord@rentlite.dev` / `demo1234`
- Tenant portal: `tenant@rentlite.dev` / `demo1234`

## Using a real PostgreSQL / Supabase database

Set a standard connection string in `.env` instead:

```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

The full schema is in `server/drizzle/0000_*.sql`. Apply it with
`pnpm db:push` (Drizzle) or against a fresh Supabase project with the same SQL.

## Docker (alternative)

`docker compose up` runs Postgres + server + client with the same behavior.

## Optional integrations

- Stripe (online rent payments): set `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
- Resend (email): set `RESEND_API_KEY`
- Twilio (SMS): set `TWILIO_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE`
- OpenAI (AI triage): set `OPENAI_API_KEY`

All features degrade gracefully when these are unset.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm run build` | Build all packages |
| `pnpm run check` | Type-check all packages |
| `pnpm --filter server db:seed` | Seed demo data (skips if users exist) |
| `pnpm --filter server db:studio` | Open Drizzle Studio |
| `pnpm dev:server` / `pnpm dev:client` | Run API / UI in dev mode |
