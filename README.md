# mintly

Mintly is a financial-learning site for teens (13–18): short lessons, then practice decisions.
Students research a stock, ask Leaf (the AI learning partner) questions, decide whether to
Buy, Sell or Wait, and get a Decision Score. Everything uses practice money.

## Run it locally

Requires Node 18 or newer (the server uses the built-in `fetch`). There are no npm dependencies.

```bash
npm start            # serves the site at http://localhost:8000
```

Open http://localhost:8000. Every page works without a key; the stock price and chart fall back
to mock data and the page says so.

## Live NVDA prices (Alpha Vantage)

`server.js` proxies quotes and charts from [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
so the key stays on the server and is never sent to the browser. Get a free key, then:

```bash
ALPHA_VANTAGE_API_KEY=your_key_here npm start
```

Optional settings:

| Variable | What it does |
| --- | --- |
| `ALPHA_VANTAGE_PREMIUM=1` | Premium key: unlocks intraday 1D/1W charts |
| `QUOTE_REFRESH_SECONDS` | How often the server re-fetches the live price (default 3600 on free keys, 10 on premium) |
| `PORT` | Port to serve on (default 8000) |

Never commit a key. If you keep it in a `.env` file, load it yourself (for example
`set -a; . ./.env; set +a; npm start`); `.env` is not served by the site.

API routes: `/api/status` (is a key set?), `/api/quote?symbol=NVDA`, `/api/chart?symbol=NVDA&range=1M`
(`1D` premium only, `1W`, `1M`, `1Y`).

## Accounts: students, parents, teachers

Mintly has real accounts, stored by the server in `.data/db.json` (gitignored and never served).
Passwords are hashed with scrypt and sessions use an HttpOnly cookie.

- **Student** takes the courses; progress (lessons, quiz answers, matches, written answers) is saved to the account.
  Their dashboard shows a six-character code to share with a parent, and a field to join a class.
- **Parent** enters the student's code on `parent-dashboard.html` to follow lesson progress.
- **Teacher** creates classes on `teacher-dashboard.html`; each class has a join code, and the roster shows
  completion per student and per lesson.

Everyone is free during early access (billing is not live; picking a plan on the pricing page just saves a preference).
The JSON file store is fine for one server. Before real launch, move it to a database, add email verification and
password reset, get parental consent for under-13s (COPPA) and review privacy requirements for student data (FERPA, GDPR).

## Sign in with Google

Create an OAuth client ID (type "Web application") in the [Google Cloud console](https://console.cloud.google.com/apis/credentials),
add `http://localhost:8000` (and your real domain) as authorized JavaScript origins, then put it in a `.env` file next to `server.js`:

```
GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com
```

and restart `npm start`. The browser gets the public client ID from `/api/config`; the server verifies the ID token Google
returns at `/api/auth/google`. New Google users pick student, parent or teacher on the Sign up tab first. Until a client ID
is set, the "Continue with Google" button explains what is missing; email sign-up works either way.

## Settings (environment variables or a `.env` file)

| Variable | What it does |
| --- | --- |
| `HOST`, `PORT` | Where to listen. Default `127.0.0.1:8000`; use `HOST=0.0.0.0` when deployed |
| `BASE_URL` | Public address (e.g. `https://mintly.example`); used in links inside emails |
| `DATA_DIR` | Where accounts and progress are saved. Point it at a persistent volume, outside the site folder |
| `COOKIE_SECURE=1` | Mark the session cookie Secure (automatic behind a proxy that sets `X-Forwarded-Proto: https`) |
| `ADMIN_USER`, `ADMIN_PASS` | The site owner's login for `/admin.html`. Type them into the normal log-in form. Use a long random password; the admin area is off if either is missing. Keep them only in `.env` or your host's secrets, never in the repo |
| `RESEND_API_KEY`, `MAIL_FROM` | Send real email (verification and password reset) through [Resend](https://resend.com). Without a key the email is printed in the server log |
| `CONTACT_EMAIL` | Shown on the Privacy and Terms pages |
| `GOOGLE_CLIENT_ID` | Turns on "Continue with Google" |
| `ALPHA_VANTAGE_API_KEY` | Live prices (see above) |

## Deploying

Any host that runs Node 18+ or Docker works (Render, Fly.io, Railway, a VPS). With Docker:

```bash
docker build -t mintly .
docker run -p 8000:8000 -v mintly-data:/data -e BASE_URL=https://your-domain -e CONTACT_EMAIL=you@your-domain mintly
```

Put it behind HTTPS (most hosts do this for you). `GET /healthz` is a health check.

## What's in the product

- Student: courses with saved progress, simulation decisions saved with their reasoning, class and parent links
- Parent: follows linked teens' lessons and the reasoning behind their decisions
- Teacher: classes, join codes, per-student and per-lesson progress, decision scores
- Everyone: email sign-up or Google, email confirmation, password reset, account page (rename, change password,
  download data, delete account), Privacy and Terms pages

## Before a public launch

- The Privacy Policy and Terms are plain-language drafts that match what the code does. Have a lawyer review them
  for your country, especially COPPA/FERPA/GDPR for a service used by minors and in schools.
- Move the JSON store (`server/db.js`) to a real database if you run more than one server or expect heavy use.
- Set up a real email sender (`RESEND_API_KEY`) and a domain, and test password reset end to end.
- Billing is not built; plans on the pricing page are placeholders.

## Pages

- `index.html` home with the interactive demo, `mintly.demo.html` standalone demo
- `pricing.html` (Starter $10, Plus $15, Family Pro $20 per month, School $8 per student per month for 50+ students; billing is not live)
- `signin.html` sign up / log in (role picker, Google); `dashboard.html` sends you to `student-dashboard.html`,
  `parent-dashboard.html` or `teacher-dashboard.html`
- `parents.html`, `teachers.html` marketing pages; `account.html` settings; `reset.html`, `verify.html`; `privacy.html`, `terms.html`
- `lessons/financial-literacy.html` course page with progress, lessons 1–10, `explore.html`,
  locked electives `collectables.html` and `cryptocurrencies.html`
- `tools/device-simulator.html` previews the site in phone frames

To add a lesson, add it to `curriculum.json` (the server and every dashboard read it) and to the list in `lessons/financial-literacy.html`.

## Admin dashboard

Log in at `/signin.html` with the `ADMIN_USER` and `ADMIN_PASS` from `.env`. You land on `/admin.html`:

- **Overview**: accounts by role, new sign-ups, active students, lessons completed, simulation scores, a 30-day sign-up chart and a lesson-by-lesson drop-off view.
- **Users**: search and filter, open any account to see progress, mark an email verified, make a one-hour password reset link (handy before email is set up), or delete an account.
- **System**: shows what is switched on (email, Google, market data, secure cookies) and what still needs setting up.

Admin sessions last 8 hours, use a separate `SameSite=Strict` cookie, and allow 5 wrong tries per 15 minutes per address.

## Lesson extras

- Animated explainers in lessons 6–10 live in `lessons/explainer.js` (add `<div data-explainer="paycheck|debt|compound|scam|plan"></div>`).
- `slides.html` plays a one-minute recap per lesson with captions and optional browser narration. The content is in `slides.json`, and `video-scripts.md` holds the same text as scripts for recording real videos.
- To embed a video in a lesson, add `"video": "<YouTube id>"` to that lesson in `curriculum.json`.

## Electives, certificate and glossary

- Six elective lessons (Collectables and Cryptocurrencies, three each) are listed under `electives` in `curriculum.json`. They open for students once the ten core lessons are finished; parents and teachers can preview them.
- `certificate.html` shows a printable certificate when a student finishes the core course.
- `glossary.html` is built from `glossary.json`, which collects the "Key words" from every lesson. Regenerate it after adding lessons.
- The footer on every page comes from `renderFooter()` in `script.js`.
