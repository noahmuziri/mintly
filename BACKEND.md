# Mintly backend: learner insights

A small analytics backend so the admin can see **what learners are interested in**: a graph connecting learners to topics (investing, saving, scams, crypto and so on), lesson funnels, and what Leaf gets asked about.

## What it collects, and what it doesn't

| Collected (only after the learner taps "Okay") | Never collected |
| --- | --- |
| Which lessons are opened, which films are played, quiz scores | Anything a learner types (Leaf messages, lesson answers, written reasoning) |
| The *category* of each Leaf topic (e.g. `scams`, `investing`) | Names or emails alongside activity |
| Which preset interest is picked on Explore (sneakers, cards, crypto) | Card or payment details |
| Page views, role and plan | Free-text interests |

Learners are **pseudonymous**: a random ID stored in their own browser. The admin sees "Learner 3fa91c", not a name.
Declining the notice sends nothing. Admin accounts are never counted.

> This is a product for minors. Before real teens use it, have a lawyer review `privacy.html` and your consent flow for COPPA (under 13), GDPR-K / UK Children's Code (if you serve the EU or UK), and any school-district rules (FERPA, state student-privacy laws). Showing names next to interests would need real accounts, parental consent and a stronger legal basis. The current design deliberately avoids it.

## How it fits together

- `api-core.mjs`: the logic (validation, interest scoring, graph data). Runs in the Worker, the dev server and the browser (for sample data).
- `worker.js`: Cloudflare Worker. Serves the site, handles `/api/*`, stores events in a **D1** database.
- `schema.sql`: the one table.
- `wrangler.backend.jsonc`: the config that turns the Worker on. The normal `wrangler.jsonc` still deploys the static site only, so nothing changes until you opt in.
- Admin console → **Insights** tab: the graph, interest ranking, lesson funnel, CSV export.

Interest score per learner and topic: Leaf question = 3, lesson completed = 3, Explore pick = 5, lesson opened = 1, film played = 1.

## Run it locally

```bash
ADMIN_KEY=choose-a-long-secret npm start     # http://localhost:8000
```

Events are written to `.data/events.jsonl` (git-ignored). Sign in as `admin@mintly.demo` (password `mintly-demo`), open **Admin → Insights**, and enter your admin key. Without `ADMIN_KEY` set, the dev key is printed in the terminal.

With no backend at all, the Insights tab shows clearly-labelled **sample data**, so you can preview it.

## Put it live on Cloudflare

You need a Cloudflare account (the free plan is enough to start).

```bash
# 1. create the database and copy the database_id it prints
npx wrangler d1 create mintly

# 2. paste that id into wrangler.backend.jsonc (replace PASTE_YOUR_D1_DATABASE_ID)

# 3. create the table
npx wrangler d1 execute mintly --remote --file=schema.sql -c wrangler.backend.jsonc

# 4. set the admin key: a long random string, at least 12 characters
npx wrangler secret put ADMIN_KEY -c wrangler.backend.jsonc

# 5. deploy
npx wrangler deploy -c wrangler.backend.jsonc
```

Then open your site, sign in as the admin, go to **Insights**, and enter the key. The pill changes from "Sample data" to "Live data".

## Honest limitations

- **The demo admin login is browser-only.** The real protection for learner data is `ADMIN_KEY` on the server. Treat that key like a password and don't share the console with it saved on a shared computer (it's kept in `sessionStorage` and cleared when the tab closes).
- **Real accounts are still a to-do.** User accounts, plans and the paywall live in each browser, so the backend can't tie activity to a paying customer or verify a plan. Auth and billing (Stripe + a users table) are the next backend steps.
- **Scale.** Insights are computed in JS from up to 50,000 recent events, which is fine for thousands of learners. At larger scale, move the aggregation into SQL.
- **Retention.** Delete old data on a schedule, for example:
  `npx wrangler d1 execute mintly --remote --command "DELETE FROM events WHERE ts < strftime('%s','now','-180 days')*1000" -c wrangler.backend.jsonc`
- **Abuse.** Anyone can POST events. Add Cloudflare rate limiting on `/api/events` before a public launch.
