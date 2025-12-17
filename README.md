# HUG-safe Listing Manager (Monorepo Skeleton)

A legally low-risk approach: users paste a Naver listing URL as a *reference link only* and manage everything (notes, calls, appointments, HUG risk check) inside this app.

## Stack
- Web: React + Vite + TS + Tailwind
- API: NestJS + Prisma
- DB: PostgreSQL (docker-compose)
- Shared: TypeScript package for types + HUG check rules

## Quick start (pnpm recommended)
```bash
# 1) install
pnpm i

# 2) start db
docker compose up -d

# 3) prisma
pnpm --filter @app/api prisma:gen
pnpm --filter @app/api prisma:migrate

# 4) run
pnpm dev
```

## Environment
Copy `.env.example` -> `.env` inside `apps/api` and adjust.

## Legal safety notes (product)
- Do NOT scrape or reproduce Naver content.
- Store only a user-provided URL/ID as a reference.
- HUG result must be shown as "참고용" and include a disclaimer.
