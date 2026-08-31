# Gradelys v2.0

Your AI-powered learning workspace — AI chat, notes, spaced-repetition flashcards,
quizzes & exams, AI visualizations, a document Studio, Spaces (workspaces), exam
scanning with instant diagnostics, gamification, and a full admin panel.

**This app has no demo mode.** Every feature is wired to real services — Supabase
(auth + database), Google Gemini (AI generation), Whop (payments), and Resend
(email). Without the required environment variables, the app intentionally
refuses to run and shows a setup screen instead of faking data.

**Product shape**: Gradelys is organized around **Spaces**. A Space holds one or
more sources (PDFs, images, links, or pasted text); Practice, Visualize, and
Studio are all scoped to a Space and require at least one ready source before
they'll generate anything — this keeps every generated quiz, diagram, or document
grounded in the student's own material instead of generic AI output. Each of
Practice, Visualize, and Studio has its own dedicated chat-like interface
(`conversations.kind = 'visualize' | 'studio' | 'practice'`, separate from
ordinary chat) with a history strip of past sessions and an "Attach" popover to
pick a Space or fire a ready-made prompt with one click. The general Chat
(`kind = 'chat'`) can optionally be scoped to a Space too, in which case answers
are restricted to that Space's sources.

**Free plan**: 1 space, 3 lifetime chat messages, 1 scan, 1 Studio document —
Practice and Visualize require Plus or Pro. Adjust these in
`src/lib/config.ts` (`planLimits`) and the corresponding checks in each
`/api/*` route.

**Languages**: the interface ships in English, French, Arabic (RTL), and
Spanish (`src/i18n/translations.ts`). AI-generated content (quiz, flashcards,
Studio documents, Visualize output) always matches the language of the
space's own source material, independent of the interface language — this is
enforced in the generation prompts in `src/lib/generation/tool-generation.ts`.

**Practice modes**: Flashcards use typed-answer active recall (type your
answer, reveal to check, then rate difficulty for spaced repetition). Quiz
mode hides correctness until the end, showing your score once you finish.
Timed exam mode generates a real open-ended written exam grounded in the
space's sources — you write full answers, submit, and Gemini grades it out of
20 with per-question feedback, the way a teacher would.

**Admin**: the Admin → Users tab can directly assign a subscription plan
(Free / Plus / Pro, Monthly or Annual) to any user, bypassing Whop checkout —
useful for comps, support cases, or testing.

---

## 1. Prerequisites

- Node.js 18.18+ (Node 20+ recommended)
- A free [Supabase](https://supabase.com) project
- A [Google Gemini API key](https://aistudio.google.com/apikey) (free tier available)
- Optional: a [Whop](https://whop.com) seller account (payments), a
  [Resend](https://resend.com) account (email), a [Serper.dev](https://serper.dev)
  key (live web search in chat)

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in at minimum:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=AIza...
```

These two integrations (Supabase + Gemini) are **required** — the app will not
start without them. Whop, Resend, and Serper are optional; the related features
(payments, transactional email, live web search) simply stay unavailable until
configured, with clear errors rather than fake behavior.

## 4. Set up the database

1. Open your Supabase project → SQL Editor → New query.
2. Paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) and run it.
   This creates all tables, Row Level Security policies, triggers (auto-creates a
   profile + subscription + streak row on signup), indexes, and storage buckets.
3. In Supabase → Authentication → Providers, enable **Email** (and optionally
   **Google** if you want the "Continue with Google" button to work — no extra
   env vars needed on the Next.js side, just configure the provider in Supabase).
4. In Supabase → Authentication → URL Configuration, set your Site URL and add
   `http://localhost:3000/api/auth/callback` (and your production URL) as a
   redirect URL.

To promote a user to admin (unlocks `/admin`), run in the SQL Editor:

```sql
update profiles set role = 'admin' where email = 'you@example.com';
```

## 5. Run the app

```bash
npm run dev
```

Visit `http://localhost:3000`. If any required env var is missing, every route
shows a setup screen listing exactly what's missing — the app is unusable until
it's fully configured, by design.

## 6. Optional integrations

| Feature | Env vars | What happens without it |
|---|---|---|
| Payments (Plus/Pro checkout, recharge packs) | `WHOP_API_KEY`, `WHOP_WEBHOOK_SECRET`, `NEXT_PUBLIC_WHOP_CHECKOUT_*` | Pricing page links fall back to the signup page instead of a checkout |
| Transactional email (welcome, password reset, receipts) | `RESEND_API_KEY` | Emails aren't sent; Supabase's own auth emails still work independently |
| Live web search in chat | `SERPER_API_KEY` | The "Web search" toggle in chat is a no-op until this is set |

### Configuring Whop (step by step)

Whop is the merchant of record — it handles international card payments and
gives you a hosted checkout page, so you don't need to touch Stripe directly.

1. **Create a seller account** at [whop.com](https://whop.com) and finish onboarding
   (business details, payout method).
2. **Create your product** — in the Whop dashboard, go to *Products → New product*
   and create one product called "Gradelys" (or similar).
3. **Add plans** to that product — create four pricing plans:
   - Plus (monthly) and Plus (annual)
   - Pro (monthly) and Pro (annual)

   Optionally add three one-time "recharge" products for scan packs (+50, +200,
   +Unlimited for 1 month) — these should be one-time purchases, not subscriptions.
4. **Get checkout links** — each plan/product has a *Checkout link* in its settings.
   Copy each link into the matching env var:
   ```
   NEXT_PUBLIC_WHOP_CHECKOUT_PLUS_MONTHLY=https://whop.com/checkout/...
   NEXT_PUBLIC_WHOP_CHECKOUT_PLUS_ANNUAL=https://whop.com/checkout/...
   NEXT_PUBLIC_WHOP_CHECKOUT_PRO_MONTHLY=https://whop.com/checkout/...
   NEXT_PUBLIC_WHOP_CHECKOUT_PRO_ANNUAL=https://whop.com/checkout/...
   NEXT_PUBLIC_WHOP_CHECKOUT_RECHARGE_50=https://whop.com/checkout/...
   NEXT_PUBLIC_WHOP_CHECKOUT_RECHARGE_200=https://whop.com/checkout/...
   NEXT_PUBLIC_WHOP_CHECKOUT_RECHARGE_UNLIMITED=https://whop.com/checkout/...
   ```
   These are `NEXT_PUBLIC_` because the Pricing and Settings pages link to them
   directly from the browser — no secret is exposed, checkout links are safe to
   be public.
5. **Get your API key** — Dashboard → *Settings → API keys* → create a key with
   read access to memberships/payments. Put it in `WHOP_API_KEY`.
6. **Set up the webhook** — Dashboard → *Settings → Webhooks* → *Add endpoint*:
   - URL: `https://your-domain.com/api/webhooks/whop` (use an `ngrok`/similar
     tunnel URL while testing locally)
   - Events: subscribe to at least `membership.went_valid` and
     `membership.went_invalid`
   - Copy the signing secret shown into `WHOP_WEBHOOK_SECRET`
7. **Test it** — buy your own product in test mode (Whop supports test payments),
   confirm the webhook fires and that the buyer's `subscriptions` row in Supabase
   updates to the right plan.

That's it — once these are set, the Pricing and Settings pages automatically
start linking to real Whop checkouts instead of falling back to `/signup`.

### Configuring the other services

- **Supabase**: Project Settings → API → copy the *Project URL*,
  *anon public key*, and *service_role key* into `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. Never expose
  the service role key to the browser — it's only used in server-side routes.
- **Gemini**: [aistudio.google.com/apikey](https://aistudio.google.com/apikey) →
  *Create API key* → paste into `GEMINI_API_KEY`. Free tier is enough for
  development. The app calls `gemini-3.7-flash` (default) and
  `gemini-3.1-pro-preview` (the "Pro" model option) — Google periodically
  retires older model IDs (Gemini 1.5 and 2.5 are already/soon deprecated as of
  mid-2026), so if you start seeing 404 "model not found" errors, check
  [ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models)
  for the current model IDs and update `src/lib/gemini/client.ts`
  (`resolveModel`).
- **Resend**: [resend.com](https://resend.com) → *API Keys → Create* → paste into
  `RESEND_API_KEY`. Verify a sending domain (or use their test domain while
  developing) and set `RESEND_FROM_EMAIL` accordingly.
- **Serper** (optional, live web search): [serper.dev](https://serper.dev) →
  copy your API key into `SERPER_API_KEY`. 2,500 free searches/month.

Whop webhook endpoint: `POST /api/webhooks/whop` — configure this URL in your
Whop dashboard and copy the signing secret into `WHOP_WEBHOOK_SECRET`.

Monthly credit reset cron: `POST /api/cron/reset-credits` with header
`Authorization: Bearer <CRON_SECRET>` — call this daily from Vercel Cron, GitHub
Actions, or any scheduler.

## 7. Architecture

```
src/
  app/
    (auth)/          — login, signup, forgot-password (Supabase auth)
    (app)/            — protected app shell: chat, notes, practice, visualize,
                         studio, spaces, scan, progress, settings, admin
    (legal)/          — privacy, terms, cookies, refund
    api/              — all server routes (Supabase + Gemini + Whop + Resend)
  components/         — UI kit, app shell, marketing, feature components
  hooks/              — React Query hooks wrapping the API routes
  lib/                — Supabase/Gemini/Whop/Resend/Serper clients, SM-2, security
  stores/             — Zustand: auth session cache + local UI/preference state
  types/               — shared TypeScript types (mirrors the SQL schema)
supabase/
  schema.sql          — full Postgres schema + RLS policies + triggers
```

Data flow: every domain (chat, notes, flashcards, spaces, visualize, studio,
scans, gamification, admin) is backed by real Postgres tables via Supabase, with
Row Level Security enforcing that users can only ever read/write their own data
(admins get broader read access via an `is_admin()` policy helper). AI-powered
routes call Gemini directly server-side — there is no cached or generated
fallback content anywhere in the codebase.

## 8. Deployment

Any Next.js host works (Vercel is the simplest). Set the same environment
variables in your host's dashboard, point your Supabase Auth redirect URL at
your production domain, and set `NEXT_PUBLIC_APP_URL` accordingly.

## 9. Security notes

- Rate limiting is in-memory (`src/lib/security.ts`) — fine for a single
  instance; swap for Upstash Redis if you deploy multiple serverless regions.
- The Content-Security-Policy in `next.config.js` allows `'unsafe-eval'` for
  Mermaid.js diagram rendering — tighten this if you remove that dependency.
- All admin routes double-check `role = 'admin'` both in middleware and via RLS.
