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

- **API:** http://localhost:3000  
- **Client:** Vite default (usually http://localhost:4200)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Serve server + client together |
| `npm run dev:server` | Serve Express API only |
| `npm run dev:client` | Serve React client only |
| `npm run db:up` | Start PostgreSQL Docker container |
| `npm run db:down` | Stop PostgreSQL container |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:seed` | Seed database |
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

## Stripe webhooks (optional)

```sh
stripe listen --forward-to localhost:3000/webhooks/stripe
```

Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET` in `server/.env`.
