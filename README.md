# CritiMatch

AI-assisted emergency resource matching: facilities publish live stock, requesters describe a need in plain language,
the system scores urgency, matches the nearest facility and escalates unmatched requests after 1 hour.

## Run it

1. `npm install`
2. Create a Supabase project, copy `.env.example` to `.env` and fill `DATABASE_URL` / `DIRECT_URL` (+ `AUTH_SECRET`, `CRON_SECRET`).
   `LLM_API_KEY` is optional. Without it a built-in fallback extractor is used.
3. `npm run db:push` creates the tables. `npm run db:seed` loads demo data.
4. `npm run dev` and open http://localhost:3000

## Demo logins (from the seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@critimatch.dev | admin1234 |
| Facility 1 to 7 | facility1@critimatch.dev ... facility7@critimatch.dev | demo1234 |

## Try the full flow

1. Open `/request/new`, type "need 2 units O negative blood urgently after an accident", pick Connaught Place, add a phone, send.
2. Sign in as `facility2@critimatch.dev` (Lifeline Blood Bank) and confirm the offer on the Offers tab.
3. Watch the tracking page flip to Matched and the stock drop in Inventory.
4. To see escalation fast, set `deadlineAt` of a request to the past in the database and open any page that polls, or call the cron route.

## SLA watcher

`POST /api/cron/sla` with header `Authorization: Bearer <CRON_SECRET>` expires stale offers and escalates late requests.
Schedule it every minute from a Railway cron job. Pages also trigger it on demand at most every 20 s, so demos work without a scheduler.

## Structure

- `prisma/` schema and seed
- `src/lib/` urgency scoring, Haversine, matching engine, SLA watcher, LLM extraction, auth
- `src/app/api/` route handlers
- `src/app/` pages: landing, request, tracking, facility dashboard, admin, login, register
