# Ledger — Invoice Maker (Supabase)

A small full-stack invoicing app: add clients, generate invoices, and track
everything from a dashboard.

- **Frontend**: React + **TypeScript** (Vite), **Tailwind v4** with
  **shadcn/ui** components, deploys to **Netlify** (or **Vercel**)
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
bun run test         # or: npm test — component tests on React 19
```

Open **http://localhost:5173** and create an account from the first screen.

> **Local dev tip:** by default Supabase asks new users to confirm their email.
> Running `supabase start` sends those emails to **Mailpit** at
> http://localhost:54324 instead of the internet, so they arrive instantly and
> there is no limit. Against a hosted project you get **2 auth emails per hour**
> unless you configure custom SMTP — see *Emails: confirmation, reset, and their
> limits* below.

### 5. Emails: confirmation, reset, and their limits

Supabase signs new users straight in unless you tell it otherwise. To make
everyone verify their address first, turn on **Authentication → Providers →
Email → Confirm email**. After that `signUp` returns no session, so the app
shows a "Confirm your email" screen with a resend button until the link in the
email is opened.

That switch is a **project setting** and cannot be forced from the browser —
doing so would need the service-role key, which must never ship in a frontend.
What the app does enforce is the consequence: any session whose
`email_confirmed_at` is empty is refused and gets that same screen, so an
unverified account never reaches the invoices.

Reset links come from the *Forgot password?* button on the sign-in card. The
link returns to the app root, where supabase-js turns it into a recovery session
and the app asks for the new password.

**Where the links go.** Every auth email lands on the project's **Site URL**
unless the call asks for something else — which is why a deployed app can still
send people to `http://localhost:5173`. The app now passes its own origin, so
local dev returns to localhost and the deployed build returns to its own domain.
Supabase only honours that when the URL is allow-listed:

1. *Authentication → URL Configuration → **Site URL***: set your production URL.
   It is the fallback for anything not allow-listed, so a leftover localhost
   value here is a production bug.
2. ***Redirect URLs***: add every origin that may be asked for, wildcards
   included — `https://your-app.netlify.app/**`, `http://localhost:5173/**`,
   `https://**--your-site.netlify.app/**` for preview deploys.
3. Leave the email templates' `{{ .ConfirmationURL }}` as they are: it carries
   whichever redirect through.

If a link still goes to the wrong place, the URL simply is not on that list —
Supabase falls back to Site URL silently instead of erroring.

**Sending limits.** Supabase's built-in mail service sends **2 auth emails per
hour for the whole project** — confirmation, resend and reset all count — and
answers `429 email rate limit exceeded` after that. It is for testing only.
Three ways around it:

- **Develop against the CLI stack.** `supabase start` routes every auth email to
  Mailpit at http://localhost:54324, with no limits and no inbox to check.
- **Configure custom SMTP** (*Authentication → Emails → SMTP Settings*) with
  Resend, Brevo, Postmark, SES or similar. Only then can *Authentication → Rate
  Limits → Emails sent by Supabase Auth* be raised above 2.
- **Skip the email while testing.** Add users from *Authentication → Users → Add
  user* with **Auto Confirm User** ticked — nothing is sent.

The app turns that 429 into a plain-English message, and its resend button waits
60 seconds between attempts (Supabase's per-address limit).

With the Supabase CLI the confirmation option lives in `supabase/config.toml`:

```toml
[auth.email]
enable_confirmations = true
```

## Deploying

The SPA lives in `frontend/`. Both hosts below build it with `npm run build`
and serve `frontend/dist`.

### Netlify

`netlify.toml` in the repo root already sets the base directory, build command,
publish directory, and the SPA fallback. Point **Netlify → Add new site →
Import an existing project** at this repository and accept the detected
settings — no manual configuration is needed.

Add the two environment variables in *Site configuration → Environment
variables* (they apply to all deploy contexts):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

`frontend/public/_redirects` does the same job as the `netlify.toml` redirect,
so client-side routes keep working even if the config file is bypassed.

The repo ships `frontend/bun.lock`, so Netlify installs with Bun. If that step
fails on the build image, set the site's **Install command** to `npm install`
in the UI — the build reads `package.json` either way.

### Vercel

Set Vercel's **Root Directory** to `frontend`; Vercel auto-detects Vite and
`frontend/vercel.json` handles the SPA fallback. Add the same two environment
variables under *Project → Settings → Environment Variables*.

### Both

The variables are inlined at build time, so redeploy after changing them.
Finally, add your deployed domain to *Supabase → Authentication → URL
Configuration*: **Site URL** = the deployed URL, and the same origin under
**Redirect URLs** (`https://your-app.netlify.app/**`). Confirmation and reset
links honour an origin only if it is on that list — see
*Emails: confirmation, reset, and their limits* above for the details.

## Features

- **Accounts** — sign up and sign in with Supabase Auth (email + password), with
  password reset by email. Email confirmation can be required (see step 5), and
  the app refuses an unverified session either way. Every company and invoice
  belongs to the account that created it, enforced by row level security in the
  database.
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
  scroll sideways, and the invoice builder stacks its line items
- **Light and dark** — a theme switch in the header (light / dark / system);
  the invoice preview stays a white sheet in both, so the PDF is unchanged
- **Terms and privacy pages** — `/terms` and `/privacy` are public routes,
  linked from the sign-in screen and from the Profile page

## How data access works

There is no API layer. `frontend/src/api.ts` is a thin wrapper over
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
  components.json            # shadcn/ui configuration (radix-nova, neutral)
  public/_redirects          # SPA fallback for Netlify
  vercel.json                # SPA rewrite for Vercel
  vitest.config.ts           # jsdom component tests (vitest)
  .env.example               # VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
  src/
    supabase.ts              # supabase-js client
    api.ts                   # data layer (auth, companies, invoices, dashboard)
    AuthContext.tsx          # session + profile state
    types.ts                 # shared domain types
    pdf.ts                   # browser PDF export (html2canvas + jsPDF)
    pages/                   # Login, Dashboard, Companies, NewCompany, Profile,
                             # Invoices, NewInvoice, InvoiceDetail, ConfirmEmail,
                             # ResetPassword, Terms, Privacy
                             # (the *.test.tsx files sit next to what they test)
    components/
      layout/                # app-sidebar, header (breadcrumbs), main, nav-*
      ui/                    # shadcn/ui primitives
      check-inbox-card.tsx   # "Confirm your email" / "Check your inbox" + resend
      legal-footer.tsx       # terms/privacy line under the sign-in screens
      legal-page.tsx         # frame shared by Terms and Privacy
      theme-switch.tsx       # light / dark / system
    context/theme-context.tsx  # theme state, applied as `.dark` on <html>
    lib/                     # cn(), legal copy, INR/date formatters
    index.css                # Tailwind v4 + shadcn theme tokens (hex)
    styles/invoice.css       # the invoice "paper" (hex-only, for html2canvas)
```

`netlify.toml` sits at the repository root so Netlify builds `frontend/`.

## Notes / next steps

- **React 19 is required.** The shadcn components in `frontend/src/components/ui`
  take `ref` as a prop (there is no `forwardRef` anywhere), which is React 19
  behaviour. On React 18 `ref` is stripped from props, so every Radix trigger
  that uses `asChild` (dropdown menus, alert dialogs, tooltips) loses its anchor
  node and its popup renders off-screen — the buttons look dead.
  `src/components/ui/ref-forwarding.test.tsx` guards this.
- Auth is Supabase's email/password provider, with email confirmation (optional,
  step 5) and password reset through the *Forgot password?* link. Both rely on
  auth emails, so mind the 2-per-hour built-in limit described in step 5.
- The Terms of Service and Privacy Policy pages ship as **templates** — they are
  written for this app, but review them before relying on them. Change the
  operator name and contact address in `frontend/src/lib/legal.ts`.
- The invoice PDF is a raster capture of the on-screen preview, so its text is
  not selectable. The capture is taken at A4 measurements and drawn edge to
  edge, so the sheet fills the page exactly — a very long invoice (dozens of
  line items) is the only case that spills onto a second page. Swapping in a
  vector renderer would mean rebuilding the layout in that library's
  primitives.
- One sender identity per account. Supporting several businesses on one login
  would mean a `senders` table that invoices point at.
- "Overdue" is computed automatically when a due date has passed and the
  invoice isn't marked paid — you can also set it manually.
