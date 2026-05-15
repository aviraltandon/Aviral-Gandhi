# Aviral & Gandhi

> AG × Pen Fights · In memory of VG
>
> A community platform for the AG organization — news, world rankings, parties, elections, tournaments, court hearings (with live video), and a link to the AG Bank.

Built with Next.js 15 + TypeScript + Tailwind + Supabase + Jitsi. Deployed via GitHub → Vercel auto-deploy.

---

## What's in this repo

```
aviral-gandhi/
├── app/                          # Next.js App Router pages
│   ├── auth/                     # login, signup, email verify callback
│   ├── news/                     # The Daily Gleaner (admin publishes)
│   ├── rankings/                 # World rankings (admin edits)
│   ├── tournaments/              # Tournament requests + registration
│   ├── parties/                  # Party creation + joins
│   ├── elections/                # Voting with secret-ballot reveal
│   ├── court/                    # Case docket + live CourtCall
│   │   └── [id]/                 # Individual case page with Jitsi iframe
│   ├── bank/                     # Link to AG Bank
│   └── admin/                    # Admin panel (role management)
├── components/
│   ├── ui/                       # shadcn primitives (Button, Card, Input, Avatar)
│   └── layout/                   # Header + nav tabs
├── lib/
│   ├── supabase/                 # Browser, server, and middleware clients
│   └── utils.ts                  # cn, timeAgo, initials, fmtDateTime
├── supabase/
│   └── migrations/
│       ├── 001_schema.sql        # All tables + auto-profile trigger
│       ├── 002_rls.sql           # RLS policies + winner-reveal view
│       └── 003_storage.sql       # Avatar + party-logo buckets + seed note
├── types/database.ts             # Hand-written TS types (or generate via `supabase gen types`)
└── middleware.ts                 # Protects routes; redirects unauthenticated users
```

## What works out of the box

- **Auth**: email + password signup with Supabase's built-in email confirmation. Login. Logout.
- **News tab**: admin publishes; everyone reads; admin can delete.
- **Court**: anyone files a case → admin schedules → admin clicks **Start CourtCall (Go live)** → everyone with access sees a **Join** button → clicking it opens the Jitsi room embedded inline. **Real-time updates** via Supabase Realtime — when admin goes live, every connected member's docket updates instantly.
- **Bank**: links to your existing `ag-bank-five.vercel.app`.
- **Admin panel**: promote/demote members.
- **World rankings**: read-only display with photos, titles, rank position.

## What's scaffolded but needs implementation

Tournaments, Parties, Elections, and the admin-side rankings editor have placeholder pages with notes pointing at the schema. The hardest parts (DB schema, RLS, the winner-reveal view, real-time-ready tables) are already in place — these are just UI to build out.

---

## Deployment walkthrough

### Step 1 — Supabase setup (5 min)

You said you already have Supabase. Open your project's SQL editor and run the migrations **in order**:

1. `supabase/migrations/001_schema.sql` — creates all tables
2. `supabase/migrations/002_rls.sql` — enables Row Level Security with all the rules we designed
3. `supabase/migrations/003_storage.sql` — creates `avatars` and `party-logos` buckets

In **Authentication → Providers**, make sure **Email** is enabled and **Confirm email** is ON.

In **Authentication → URL Configuration**, add your Vercel preview URL to the allow-list (you'll get this in Step 3):
- Site URL: `https://your-vercel-url.vercel.app`
- Redirect URLs: add `https://your-vercel-url.vercel.app/auth/callback` and `http://localhost:3000/auth/callback`

### Step 2 — GitHub

```bash
cd aviral-gandhi
git init
git add .
git commit -m "Initial commit"
gh repo create aviral-gandhi --private --source=. --push
# or, manually: create a new repo on github.com, then
# git remote add origin https://github.com/Anuragvishwakarm/aviral-gandhi.git
# git branch -M main && git push -u origin main
```

### Step 3 — Vercel deploy

1. Go to vercel.com → **New Project** → import the GitHub repo
2. Framework preset: **Next.js** (auto-detected)
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` — from Supabase Project Settings → API
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — same place (the `anon public` key)
4. Click **Deploy**

After the first deploy, copy the Vercel URL back into Supabase's URL config (Step 1's last action).

### Step 4 — Become the first admin

1. Open your Vercel URL → `/auth/signup` → create an account with your real email
2. Check your inbox → click the Supabase verification link → it brings you back to the app
3. In Supabase SQL editor, run:

```sql
update public.profiles set role = 'admin'
where email = 'YOUR_EMAIL@example.com';
```

That's it. You're now the admin. From the Admin tab in the app, you can promote anyone else.

---

## How CourtCall works in production

This is the feature that ran into a sandbox restriction in our preview. In production it works fine because your Vercel domain is allowed to embed `meet.jit.si` via iframe.

**Flow**:
1. Member files a case → row inserted in `court_cases` with status `requested`
2. Admin clicks **Schedule** → status `scheduled`
3. Admin clicks **Start CourtCall (Go live)** → status `live` → Supabase Realtime broadcasts to every connected client → everyone's docket updates and shows a **Join CourtCall** button
4. Clicking Join routes to `/court/[id]` where the Jitsi iframe loads with the case's auto-generated room name (`agcourt_<uuid>`). The user's display name is passed in the URL fragment so Jitsi pre-fills it.
5. Admin clicks **End live session** → status `scheduled` again → Join buttons disappear
6. Admin clicks **Close** → status `closed`

The room name is deterministic, so anyone who joins the same case enters the same Jitsi room. `meet.jit.si` supports up to ~50 participants on the free public server — plenty for your scale. No accounts, no API keys.

---

## Local development (optional)

If you want to run locally instead of pushing every change:

```bash
cd aviral-gandhi
npm install
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Open `http://localhost:3000`.

---

## Next steps for completing the build

In priority order:

1. **Tournaments page** — the form (title, format, prize, start date, scope, free-text proposed_by, description), list with status pills, registration modal. Auto-publish to news when admin creates or approves. Schema is in `001_schema.sql`.
2. **Parties page** — creation form with logo upload to `party-logos` bucket, join-request flow, founder approval UI.
3. **Elections page** — admin setup modal with date/time pickers, vote casting, the secret-ballot reveal using the `election_results_public` view.
4. **Rankings admin editor** — reorder via up/down arrows, "Edit titles" modal, add-fighter form that links to a profile or accepts a custom name.
5. **Profile page** (`/profile`) — avatar upload to `avatars` bucket, name edit, view your own data.

All the schema, RLS, and helpers are already in place. Each page follows the same pattern as `app/news/` (server component fetches data → passes to client component that handles mutations + optional Realtime).

---

## Tech stack reference

- **Next.js 15** App Router with React 19 — server components fetch from Supabase, client components for interactivity
- **Supabase** for auth, Postgres, RLS, real-time subscriptions, file storage
- **Tailwind CSS 3** with custom `ag-*` theme tokens (parchment, umber, deep, amber)
- **shadcn/ui** primitives via Radix UI
- **sonner** for toast notifications
- **date-fns** for relative time
- **Jitsi Meet** (public `meet.jit.si`) for CourtCall video

## Costs

- Supabase free tier: 500MB DB, 1GB storage, 50k MAU — fine for AG's scale
- Vercel hobby: free forever for personal projects
- Jitsi `meet.jit.si`: free, no account
- **Total: $0/mo** until you outgrow the free tiers (you won't, anytime soon)
