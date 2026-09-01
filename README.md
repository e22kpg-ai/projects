# ระบบจองห้องประชุม (Meeting Room Booking)

Next.js (App Router) + Turso (libSQL) + Drizzle ORM + Better Auth + Tailwind CSS, structured as Hexagonal Architecture (Ports & Adapters). See [CLAUDE.md](CLAUDE.md) for the architecture and design-system rules, and `C:\Users\User\.claude\plans\web-jiggly-spindle.md` for the full implementation plan.

## Setup

1. Install the Turso CLI and create a database:
   ```powershell
   irm https://get.tur.so/install.ps1 | iex
   turso auth login
   turso db create meeting-room-booking
   turso db show meeting-room-booking --url
   turso db tokens create meeting-room-booking
   ```
2. Fill in `.env.local`:
   ```
   TURSO_DATABASE_URL=<url from turso db show>
   TURSO_AUTH_TOKEN=<token from turso db tokens create>
   BETTER_AUTH_SECRET=<random string, e.g. openssl rand -base64 32>
   BETTER_AUTH_URL=http://localhost:3000
   ```
3. Apply the schema and seed sample rooms:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```

## Dev quick login

`npm run db:seed` also seeds a local-only account, `dev@example.com` / `devpassword123`. On `/login` and `/signup`, a dev-only button (below the real form) signs in as that account or spins up a fresh throwaway account in one click — both are gated by `process.env.NODE_ENV !== "production"`, so they're not present in a production build.

## Project structure

- `src/core/` — domain entities, business rules, ports, use-cases. Pure TypeScript, no framework imports.
- `src/adapters/driven/` — Drizzle/Turso repositories, Better Auth adapter (implement the ports).
- `src/adapters/driving/` — Server Actions and query helpers that Next.js pages call into.
- `src/composition/container.ts` — the single place concrete adapters are wired into use-cases.
- `src/app/` — Next.js routes (thin — delegate to `adapters/driving/`).
- `src/components/` — UI, built only from the design-system classes in `src/styles/`.

## Other scripts

- `npm run db:generate` — generate a new Drizzle migration after changing the schema.
- `npm run db:studio` — browse the database with Drizzle Studio.
- `npm run auth:generate-schema` — regenerate `auth-schema.ts` from the Better Auth config (needs `.env.local` filled in).
