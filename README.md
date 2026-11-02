# Manage Homestay

Manage Homestay (managehomestay.com, by Appa Technologies Pty Ltd) runs short-stay homestays and
long-term rentals from one app, on Cloudflare Workers (Hono API + React SPA), Neon Postgres via
Hyperdrive, R2 uploads and Resend email.

**Short stays:** listings (nightly rate, min stay, cleaning fee, house rules, check-in/out times),
booking calendar with conflict detection, iCal import/export (Airbnb, Booking.com, VRBO), guests,
auto-created turnovers assignable to cleaners, per-listing income / occupancy / ADR reports, guest
message templates (preview → draft → send via Resend), and monthly owner statements.

**Long-term:** properties & units, tenants, leases, rent payments (Stripe), expenses,
maintenance + AI triage, reminders and the tenant portal.

See **[DEPLOY.md](DEPLOY.md)** for Cloudflare deployment. Tests: `pnpm test` (vitest + PGlite).

## Structure

- `client/` — React + Vite frontend (landlord dashboard + tenant portal)
- `server/` — Hono API for Cloudflare Workers (Better-Auth, Drizzle ORM, Stripe, Resend, OpenAI)
- `shared/` — shared TypeScript types

## Quick start (no Docker needed)

Requires Node 22+. pnpm is enabled automatically via corepack:

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
