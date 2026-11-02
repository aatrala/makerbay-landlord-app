# Deploying Manage Homestay to Cloudflare

Production target: **https://managehomestay.com** — one Cloudflare Worker (`managehomestay`) serves the
React SPA (static assets) and the Hono API under `/api/*`. Postgres lives in **Neon**, reached through
**Hyperdrive**. Uploads go to **R2**. A daily cron (02:30 UTC = 08:00 IST) syncs iCal feeds, sends rent
reminders and the host's arrivals/departures/turnover digest.

> Recommended: Workers **Paid** plan (bundle ≈1 MB gzipped, CPU for auth hashing + cron work).
> Never commit secrets — use `wrangler secret put` and a local, git-ignored `server/.dev.vars`.

Requires Node 22+ and pnpm 10. All commands below run from `server/` unless noted.

## 1. Neon database
1. Create a Neon project (region close to your users) and a database, e.g. `managehomestay`.
2. Copy the **direct (non-pooled)** connection string — Hyperdrive does its own pooling.
3. Run migrations from your machine:
   ```bash
   cd server
   DATABASE_URL='postgres://…neon…/managehomestay?sslmode=require' pnpm db:migrate
   # optional demo data (dev only):  DATABASE_URL=… pnpm db:seed
   ```
   Migrations live in `server/drizzle/` (`0001_str_features.sql` adds the short-stay tables).

## 2. Hyperdrive
```bash
pnpm exec wrangler hyperdrive create managehomestay-db --connection-string='postgres://…neon…'
```
Put the returned id into `server/wrangler.jsonc` → `hyperdrive[0].id` (replaces `REPLACE_WITH_HYPERDRIVE_ID`).

## 3. R2 bucket
```bash
pnpm exec wrangler r2 bucket create managehomestay-uploads
```

## 4. Secrets (`wrangler secret put <NAME>`)
| Name | Purpose |
|---|---|
| `BETTER_AUTH_SECRET` | Session signing (random 32+ chars: `openssl rand -base64 32`) |
| `TURNSTILE_SECRET_KEY` | Turnstile server verification for sign-up / login |
| `RESEND_API_KEY` | Guest messages, vendor notices, digests, rent reminders |
| `STRIPE_SECRET_KEY` | Tenant rent payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature (`whsec_…`) |
| `OPENAI_API_KEY` | Optional — AI maintenance triage |

Plain vars in `wrangler.jsonc` → `vars` (not secret): `APP_URL`, `BETTER_AUTH_URL`, `EMAIL_FROM`,
`TURNSTILE_SITE_KEY` (public site key from the Turnstile dashboard; empty = widget disabled),
`STRIPE_PUBLISHABLE_KEY` (optional, public).

Turnstile: Cloudflare dashboard → Turnstile → add widget, hostnames `managehomestay.com` (+ your
`*.workers.dev` preview host). Copy site key → var, secret key → secret.

## 5. Build & deploy
From repo root:
```bash
pnpm install
pnpm check && pnpm test
pnpm deploy:preview   # uploads a version + preview URL, does not take traffic
pnpm deploy           # production
```

## 6. Custom domain
The domain must be a zone on the same Cloudflare account. Add to `wrangler.jsonc`:
```jsonc
"routes": [
  { "pattern": "managehomestay.com", "custom_domain": true },
  { "pattern": "www.managehomestay.com", "custom_domain": true }
]
```
(or Dashboard → Workers → managehomestay → Settings → Domains & Routes). Keep `APP_URL` /
`BETTER_AUTH_URL` equal to the canonical origin.

## 7. Resend domain verification
Resend → Domains → add `managehomestay.com` (or a `mail.` subdomain), then add the shown SPF (TXT),
DKIM (TXT/CNAME) and optional DMARC records in Cloudflare DNS (DNS-only, not proxied). Wait for
"Verified", then set `EMAIL_FROM`, e.g. `Manage Homestay <noreply@managehomestay.com>`.
Without `RESEND_API_KEY`, sends fail gracefully ("Email is not configured") and drafts stay as drafts.

## 8. Stripe webhook
Stripe Dashboard → Developers → Webhooks → add endpoint:
```
https://managehomestay.com/api/stripe/webhook
```
Events: `payment_intent.succeeded`, `payment_intent.payment_failed`.
Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

## 9. Channel calendars (iCal)
Each listing has an export URL `https://managehomestay.com/api/ical/<token>.ics` (paste into
Airbnb/Booking.com/VRBO). Import feeds are added per listing and synced daily by cron, or on demand.

## Local development
```bash
pnpm install
pnpm dev            # Node server on :3000 with embedded PGlite (./server/pgdata) + Vite on :5173
pnpm -F server dev:worker   # wrangler dev (uses localConnectionString in wrangler.jsonc)
```
