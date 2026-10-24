# Leads Marketplace

CSV dataset marketplace — React client + Express API + PostgreSQL (Prisma) + Cloudflare R2 + Stripe.

## Prerequisites

- Node.js 22+
- **Mocks dev (recommended for a fresh clone):** Node only — no Docker, no `.env`
- **Full stack dev:** Docker for PostgreSQL and env files from `.env.example` / `client/.env.example`

## Quick start — mocks (fresh machine)

One terminal starts **API + client**. Wait until you see both `Local: http://localhost:4200/` and `[ ready ] http://localhost:3000`.

```sh
npm install
npm run start:mocks
```

Open **http://localhost:4200**. The client talks to the API through Vite (`/api` → port 3000), so you do not need `client/.env` for local mocks.

Daily work after the first setup:

```sh
npm run dev:mocks
```

(`dev:mocks` refreshes the SQLite schema/client; run `npm run db:seed:mocks` if you need the demo catalog again.)

## Quick start — PostgreSQL + cloud keys

```sh
npm install
cp .env.example .env   # fill in secrets
npm run db:up
npm run db:migrate
npm run db:generate
npm run db:seed        # optional
npm run dev
```

If a dev terminal looks frozen (no URLs, Ctrl+C does nothing), you may be in **Nx TUI** mode from an older run. Press **`q`** to quit, or run `npx nx reset` and kill stray `nx run-many` processes. `npm run dev` uses streaming logs so **Ctrl+C** stops server and client normally.

- **API:** http://localhost:3000  
- **Client:** Vite default (usually http://localhost:4200)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Serve server + client together |
| `npm run start:mocks` | First-time mocks: SQLite setup + seed + dev servers |
| `npm run dev:mocks` | Mocks dev (SQLite + stub R2/Stripe); runs schema sync first |
| `npm run dev:server` | Serve Express API only |
| `npm run dev:client` | Serve React client only |
| `npm run db:up` | Start PostgreSQL Docker container |
| `npm run db:down` | Stop PostgreSQL container |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:seed` | Seed database |
| `npm run db:setup:mocks` | SQLite DB push + generate + seed (one-shot mocks prep) |
| `npm run db:seed:mocks` | Re-seed dev users + catalog (after setup) |
| `npm run db:studio` | Open Prisma Studio |

## Database

PostgreSQL runs in Docker as `leads-pg` on port `5432`.

```sh
npm run db:up
npm run db:migrate
npm run db:seed
```

Connection string (local):

```
postgresql://postgres:postgres@localhost:5432/leads_marketplace
```

## Local dev with mocks (no cloud DB / R2 / Stripe)

**No Docker Postgres, no `DATABASE_URL`, no `JWT_SECRET`, no R2/Stripe keys.** Mocks mode uses a SQLite file at `server/.mock-storage/dev.db`, a fixed dev JWT, and stubbed object storage + checkout.

See **Quick start — mocks** above. `MOCKS=true` is set by npm and Nx (see `.env.serve.mocks`). Auth is real app logic against local SQLite.

If the browser shows `ERR_CONNECTION_REFUSED` on `/files`, the API is not up yet — wait for `[ ready ] http://localhost:3000` or run `npm run dev:server` with `MOCKS=true` in a second terminal to see startup errors.

When you switch back to `npm run dev` (Postgres), run `npm run db:generate` so the Prisma client matches the Postgres schema again.

**Seeded accounts** (password `devpassword1` for all):

| Email | Role |
|-------|------|
| `admin@dev.local` | admin — use **UPLOAD** in the header or go to `/admin/upload` |
| `buyer1@dev.local` | regular |
| `buyer2@dev.local` | regular |

Equivalent: `nx run-many -t serve -p server client -c mocks`.

## Stripe webhooks (optional)

```sh
stripe listen --forward-to localhost:3000/webhooks/stripe
```

Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET` in `server/.env`.
