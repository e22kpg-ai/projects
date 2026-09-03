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

## Accounts and access

Signing up is restricted twice over:

1. **Email domain** — only `@rtarf.mi.th` addresses may register. Enforced in
   `user.validateUserInfo` inside `src/adapters/driven/better-auth/auth.ts`, which sits on the
   path every signup takes, so `POST /api/auth/sign-up/email` is covered too, not just the form.
   Outside production the allowlist also accepts `example.com` and `example.local` so the seeded
   and throwaway dev accounts keep working (see `signup-policy.ts`).
2. **Admin approval** — every new account starts at `status: "pending"`. Pending users can sign in
   and see `/pending`, but nothing else: pages redirect, and `createBooking`/`cancelBooking` reject
   them in the use-case, which is the gate that matters since Server Actions can be called directly.

   `/pending` stays a real page rather than a toast on the landing page: a toast lasts seconds and
   the wait lasts days, so someone signing in a week later would have no way to answer "what is my
   status?". The toast answers a different question — *why am I back here* — and fires on signup and
   on every bounce, via `?notice=` which the client clears so a refresh does not replay it.

Admins approve, revoke, or reject (delete) accounts at `/admin/users`, where pending accounts are
listed first. Nobody can change their own role or status — that would let the last admin lock
everyone out of the page that fixes it.

An admin is always approved: promoting someone sets both fields in one write, and an admin's
access cannot be revoked until they are demoted first. Otherwise you get an admin who is bounced
to `/pending` and can administer nothing, while the screen still calls them an administrator.

Signup also collects **สังกัด** (affiliation) as free text, shown to admins while they decide.

People without an organisational address — contractors, visiting units, staff whose account is not
provisioned yet — are added by an admin at `/admin/users` instead. That path skips the domain rule
on purpose and the account is usable straight away, since an admin filling in the form *is* the
approval. The system generates a temporary password and shows it once, because there is no mail
sending yet and nothing stores it afterwards.

The exemption is scoped with `AsyncLocalStorage` (`provisioning-context.ts`) and is only set around
the call that creates the account, inside a use-case that has already checked the caller is an
admin. A flag in the request body would have done the same job for anyone willing to send
`{"provisionedByAdmin":true}` to the public endpoint. Adding `gmail.com` to the allowlist was the
other option considered and rejected: it is free to everyone on earth, so the domain gate would
stop filtering anybody and the only remaining defence would be an admin never misreading a row.

> Migration `0003` adds these columns and backfills every pre-existing account to `approved`.
> Without that backfill the ADD COLUMN default would stamp `pending` on everyone, including the
> only admin, and lock the whole organisation out on deploy.

## Dev quick login

`npm run db:seed` also seeds two local-only accounts, `dev@example.com` / `devpassword123` and `admin@example.com` / `adminpassword123`, both already approved. On `/login` and `/signup`, a dev-only button (below the real form) signs in as that account or spins up a fresh throwaway account in one click — both are gated by `process.env.NODE_ENV !== "production"`, so they're not present in a production build.

## Deploying

The app runs on Vercel, and Vercel builds whatever lands on `master`. Merging a
pull request therefore *is* the deploy — there is no separate button to press, and
no window between the merge and the new code serving real traffic.

**Run pending migrations against production before merging, not after.** The
deploy starts on its own, so a schema change that is still waiting at that moment
means the new code is already live against the old schema. `drizzle.config.ts`
reads `.env.local` by default so an absent-minded `npm run db:migrate` can only
reach the dev database; production has to be named out loud:

```bash
ENV_FILE=.env.production.local npm run db:migrate
```

Additive migrations (a new table, a nullable column) are safe to apply ahead of
the merge: the currently deployed code does not know they exist. A migration that
drops or narrows something is not, and needs to be split so the deploy can happen
in between.

**`TZ` cannot be set on Vercel.** It is on Vercel's reserved-name list, and the
dashboard rejects it: *"The name of your Environment Variable is reserved."*
Vercel functions run as UTC, and there is no host-level setting that changes it.

So the timezone is set in code instead, and that is the supported configuration
here rather than a workaround. `instrumentation.ts` calls `ensureAppTimezone()`
from `register()`, which Next runs once before the first request on the Node
runtime; the guard sets `process.env.TZ`, reads the zone back to confirm the
runtime accepted it, and throws in production if it did not — the one case where
nothing is left to try. Every deploy logs one line saying it had to correct the
zone. That line is expected on Vercel, not a fault to chase.

The guard corrects only the process that calls it, so every entry point that reads
the clock has to call it. There are two: `register()` above, and `seed.ts`, which
runs under `tsx` and never reaches `register()` — it calls `ensureAppTimezone()`
itself, right after `dotenv` loads, before anything reads a date.

A host that *does* allow `TZ` (a container, a VM, a local shell) should still set
it there — the guard then finds the zone already correct and stays silent, which is
why `.env.example` still carries it. It is a convenience, not a requirement: no
entry point depends on the environment being right.

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

## Tests

- `npm run test` — vitest unit tests (booking rules, use-cases, date helpers), pinned to `TZ=Asia/Bangkok`.
- `npm run test:e2e` — Playwright smoke test driven against a dev server you start yourself:

  ```bash
  npx playwright install chromium   # once
  npm run dev                       # one terminal
  npm run test:e2e                  # another terminal
  ```

  It covers the auth guards (a forged session cookie must land on `/login`; `/admin/*` must 404 for
  non-admins), the admin room create/reject/delete flow, the explicit-save role change, and booking
  through to the calendar tooltip. It writes real rows (new users, rooms, bookings), so point it at a
  dev database only. Screenshots land in `.e2e-shots/` (gitignored); `E2E_BASE_URL` overrides the target.
