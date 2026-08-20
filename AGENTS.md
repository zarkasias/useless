# Base44 Dev Environment

## Stack
- Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
- Supabase (hosted) for auth + database. No local DB service — the app talks to the user's Supabase project over the network.

## Run
```
docker compose -f docker-compose.base44.yml up -d
```
App is on host port 3000 (Next.js dev server, live reload). Source is bind-mounted at `/app`; edits hot-reload without rebuilds.

## Secrets (external, user-supplied)
Delivered via `/run/base44/app.env`, wired as the last `env_file:` entry in compose so they override the placeholders in `.env.base44-defaults`.
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/publishable key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side only)

`.env.base44-defaults` holds placeholder values so the app boots before real credentials exist.

## Preview hostname
`next.config.ts` sets `allowedDevOrigins` from `BASE44_PUBLIC_HOST_SUFFIX` so the preview origin can load dev assets/HMR. The var is passed into the web service's `environment:`.

## Database setup
First run against a fresh Supabase project: apply `database/schema.sql` in the Supabase SQL editor, then optionally seed achievements (`npm run seed:achievements`, which uses the service-role key). This is a one-time setup in the user's Supabase dashboard, not part of the compose stack.

## Verify
```
curl -sf -H "Host: external-preview.example.com" http://localhost:3000/   # must return the app HTML
```
