# Ledger — Invoice Maker (Supabase)

A small full-stack invoicing app: add clients, generate invoices, and track
everything from a dashboard.

- **Frontend**: React (Vite), plain CSS design system, deployed on **Vercel**
- **Backend**: none — **Supabase** provides auth, the Postgres database, and
  row level security
- **PDFs**: rendered in the browser, downloaded straight from the invoice page

There is no server to run. The browser talks to Supabase directly; the
`anon` key is public and every table is protected by row level security.

## Quick start

### 1. Create a Supabase project

Sign in at [supabase.com](https://supabase.com), create a project, and wait for
the database to finish provisioning.

### 2. Apply the schema

Open **SQL Editor**, paste the contents of
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), and
run it. This creates the tables, the per-user invoice numbering trigger, the
row level security policies, and the `dashboard_stats()` function.

With the Supabase CLI you can instead run:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

### 3. Configure the frontend

Grab your **Project URL** and **anon key** from *Project Settings → API*, then:

```bash
cd frontend
cp .env.example .env      # then edit .env with your values
```

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run it

```bash
bun install          # or: npm install
bun run dev          # or: npm run dev
```

Open **http://localhost:5173** and create an account from the first screen.

> **Local dev tip:** by default Supabase asks new users to confirm their email.
> For a frictionless local setup, turn that off under
> *Authentication → Providers → Email → Confirm email*. With it on, you'll see
> "Check your inbox to confirm your email, then sign in."

## Deploying to Vercel

The SPA lives in `frontend/`, so set Vercel's **Root Directory** to
`frontend`. Vercel auto-detects Vite; `frontend/vercel.json` handles the
client-side route fallback so `/invoices/12` works on reload.

Add the two environment variables in *Vercel → Project → Settings → Environment
Variables* (for **Production**, **Preview**, and **Development**):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

They are inlined at build time, so redeploy after changing them. Finally, add
your Vercel domain to *Supabase → Authentication → URL Configuration* so auth
redirects land back on your app.

## Features

- **Accounts** — sign up and sign in with Supabase Auth (email + password).
  Every company and invoice belongs to the account that created it, enforced by
  row level security in the database.
- **Profile** — your own details (business name, job title, address, phone, tax
  ID, PAN, SAC code, bank/UPI) are the **billed from** side of every invoice
- **Companies** — the clients you bill, the **billed to** party
- **Generate invoice** — pick the company, add line items, tax %, discount,
  notes. Invoice numbers are auto-assigned per user (`INV-0001`) by a database
  trigger.
- **Dashboard** — total invoiced, paid, outstanding, overdue, status breakdown,
  and recent activity, from a single `dashboard_stats()` call
- **Download PDF** — the invoice is captured in the browser and saved as a PDF,
  with no browser print dialog
- **Works on a phone** — the sidebar becomes a slide-in drawer, wide tables
  become labelled cards, and the invoice builder stacks its line items

## How data access works

There is no API layer. `frontend/src/api.js` is a thin wrapper over
`supabase-js` that keeps the same method names the pages already used. Every
query runs as the signed-in user, and the database decides what they can see:

| Table | Rule |
|---|---|
| `profiles` | one row per auth user; you can read and update only your own |
| `companies` | `user_id = auth.uid()` |
| `invoices` | `user_id = auth.uid()` |
| `invoice_items` | only where the parent invoice belongs to you |

`dashboard_stats()` is a `security invoker` function, so it is filtered by the
same policies.

## Project structure

```
supabase/
  migrations/0001_init.sql   # tables, RLS, triggers, dashboard_stats()

frontend/
  vercel.json                # SPA rewrite for Vercel
  .env.example               # VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
  src/
    supabase.js              # supabase-js client
    api.js                   # data layer (auth, companies, invoices, dashboard)
    AuthContext.jsx          # session + profile state
    pdf.js                   # browser PDF export (html2canvas + jsPDF)
    pages/                   # Login, Dashboard, Companies, NewCompany, Profile,
                             # Invoices, NewInvoice, InvoiceDetail
    components/              # Sidebar, StatusStamp
    index.css                # design system (tokens, layout, components)
```

## Notes / next steps

- Auth is Supabase's email/password provider: no password reset UI is wired up
  yet (Supabase handles the reset emails, the app doesn't link to them).
- The invoice PDF is a raster capture of the on-screen preview, so its text is
  not selectable. Swapping in a vector renderer would mean rebuilding the
  layout in that library's primitives.
- One sender identity per account. Supporting several businesses on one login
  would mean a `senders` table that invoices point at.
- "Overdue" is computed automatically when a due date has passed and the
  invoice isn't marked paid — you can also set it manually.
