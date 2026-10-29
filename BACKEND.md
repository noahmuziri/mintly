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

## Accounts and cloud sync (nothing gets lost)

Signed-in learners now have real server accounts, and everything they do is saved to the server:

- **What's saved:** lesson progress, quiz results, streaks, plan, dashboard settings, saved plans, answers typed in lessons and Leaf chat history: every `mintly:*` browser key except device preferences (theme, consent) and guest data.
- **When:** about 1.5 seconds after any change, and again when the person leaves the page or switches tabs, so closing the tab doesn't lose work.
- **New device or cleared browser:** logging in pulls everything back down. Each key carries a timestamp and the newest write wins, so two devices merge cleanly.
- **Logout:** saves first, then wipes the saved data and cached profile from that browser, so the next person on a shared computer starts clean.
- **Delete:** "Delete my account and data" in the dashboard removes the account, sessions and saved data from the server.
- **Passwords** are hashed with PBKDF2-SHA256 (100,000 rounds, random salt). Sessions store only a hash of the token and last 30 days. Nobody can sign themselves up as an admin.
- **Privacy:** this saved work is private to the learner and **never appears in admin Insights**. The demo accounts (`@mintly.demo`) stay browser-only. Without a backend, the site falls back to the old browser-only accounts.

The admin **Accounts** tab also lists real server accounts once you've entered your admin key on the Insights tab.

## Classes and family links (real teacher and parent dashboards)

- A **teacher** account creates a class and gets a 6-character code. A **student** enters it under *Sharing* on their dashboard to join. The teacher's dashboard then shows the real roster.
- A student can make a **parent code**. A **parent** account enters it to link, and sees that teen's progress.
- Students are always the ones who opt in, and can leave or stop sharing at any time. What teachers and parents see is a numbers-only summary computed on the server (lessons finished, quiz accuracy, XP, streak, last active day). Chats and typed work are never included.
- Guests and the demo accounts still see clearly-labelled sample data in the teacher and parent views.
- For schools: using this with students under 13, or inside a district, usually needs school or parental consent and a data-processing agreement (COPPA, FERPA). Get that reviewed before a classroom rollout.

## How it fits together

- `api-core.mjs`: the logic (validation, interest scoring, graph data). Runs in the Worker, the dev server and the browser (for sample data).
- `worker.js`: Cloudflare Worker. Serves the site, handles `/api/*`, stores events in a **D1** database.
- `schema.sql`: the tables (events, users, sessions, userdata).
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
- **Billing isn't connected.** Right now a learner picking a plan is taken at their word (`PLAN_SELF_SERVICE`, on by default so the demo works). When you add Stripe, set `PLAN_SELF_SERVICE=0` (`npx wrangler secret put PLAN_SELF_SERVICE` with value `0`) and have a Stripe webhook set `users.plan`. The paywall in the browser is a product experience; real enforcement means checking the plan on the server.
- **No password reset or email verification yet.** Both need an email service (e.g. Resend, Postmark, or Cloudflare Email). Until then, a forgotten password can't be recovered.
- **Login protection is basic.** Eight wrong attempts per email per ten minutes are blocked per server instance. Add Cloudflare rate limiting or Turnstile before a public launch.
- **Sessions live in `localStorage`**, which a cross-site-scripting bug could read. The site has no user-generated HTML, but keep dependencies minimal and add a Content-Security-Policy before launch.
- **Scale.** Insights are computed in JS from up to 50,000 recent events, which is fine for thousands of learners. At larger scale, move the aggregation into SQL.
- **Retention.** Delete old data on a schedule, for example:
  `npx wrangler d1 execute mintly --remote --command "DELETE FROM events WHERE ts < strftime('%s','now','-180 days')*1000" -c wrangler.backend.jsonc`
- **Abuse.** Anyone can POST events. Add Cloudflare rate limiting on `/api/events` before a public launch.
