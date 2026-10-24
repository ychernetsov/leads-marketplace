# Leads Marketplace

CSV dataset marketplace — React client + Express API + PostgreSQL (Prisma) + Cloudflare R2 + Stripe.

## Prerequisites

- Node.js 22+
- Docker (for PostgreSQL)
- Env files configured (`server/.env`, `client/.env`, root `.env` as needed)

## Quick start

```sh
npm install

# Start PostgreSQL
npm run db:up

# Apply migrations & generate Prisma client
npm run db:migrate
npm run db:generate

# Optional: seed sample files
npm run db:seed

# Run API + client (separate terminals also fine)
npm run dev
```

If a dev terminal looks frozen (no URLs, Ctrl+C does nothing), you may be in **Nx TUI** mode from an older run. Press **`q`** to quit, or run `npx nx reset` and kill stray `nx run-many` processes. `npm run dev` uses streaming logs so **Ctrl+C** stops server and client normally.

- **API:** http://localhost:3000  
- **Client:** Vite default (usually http://localhost:4200)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Serve server + client together |
| `npm run dev:mocks` | Dev with local DB + mocked R2/Stripe (see below) |
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

```sh
npm run db:setup:mocks
npm run dev:mocks
```

Nx loads `.env.serve.mocks` (`MOCKS=true`, `FRONTEND_URL=http://localhost:4200`). Auth (signup/login/logout) is real application logic against that local DB.

When you switch back to `npm run dev` (Postgres), run `npm run db:generate` so the Prisma client matches the Postgres schema again.

**Seeded accounts** (password `devpassword1` for all):

| Email | Role |
|-------|------|
| `admin@dev.local` | admin (`/admin/upload`) |
| `buyer1@dev.local` | regular |
| `buyer2@dev.local` | regular |

Equivalent: `nx run-many -t serve -p server client -c mocks`.

## Stripe webhooks (optional)

```sh
stripe listen --forward-to localhost:3000/webhooks/stripe
```

Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET` in `server/.env`.
