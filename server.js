// Local dev server: serves the static site and proxies live quotes and charts from Alpha Vantage.
// The API key is read from the environment and never sent to the browser.
//
// Env:
//   HOST, PORT, BASE_URL, DATA_DIR, CONTACT_EMAIL, RESEND_API_KEY, MAIL_FROM, COOKIE_SECURE: see README
//   GOOGLE_CLIENT_ID         enables "Continue with Google" (see README)
//   ALPHA_VANTAGE_API_KEY    required
//   ALPHA_VANTAGE_PREMIUM=1  unlocks intraday bars for the 1D and 1W charts
//   QUOTE_REFRESH_SECONDS    how often to call Alpha Vantage for the live price
//                            (default 3600 on free keys, 10 on premium)
const http = require("http");
const fs0 = require("fs");
// Read a .env file next to this script (KEY=value per line) without overriding real environment variables.
try {
  for (const line of fs0.readFileSync(require("path").join(__dirname, ".env"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(["'])(.*)\1$/, "$2");
  }
} catch (e) {}
const api = require("./server/api");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8000;
const KEY = process.env.ALPHA_VANTAGE_API_KEY;
const PREMIUM = process.env.ALPHA_VANTAGE_PREMIUM === "1";
const ROOT = __dirname;

// The page polls every 10s, but the free tier allows ~25 calls/day, so we only go upstream
// when the cached copy is older than these limits. Daily/weekly bars barely change in a day.
const QUOTE_TTL = (+process.env.QUOTE_REFRESH_SECONDS || (PREMIUM ? 10 : 3600)) * 1000;
const HISTORY_TTL = 24 * 3600 * 1000;

const SOURCES = {
  daily: { fn: "function=TIME_SERIES_DAILY", ttl: HISTORY_TTL },
  weekly: { fn: "function=TIME_SERIES_WEEKLY", ttl: HISTORY_TTL },
  i5: { fn: "function=TIME_SERIES_INTRADAY&interval=5min&extended_hours=false", ttl: QUOTE_TTL },
  i60: { fn: "function=TIME_SERIES_INTRADAY&interval=60min&extended_hours=false", ttl: QUOTE_TTL },
};
// range -> [source, trading days to show]
const RANGES = {
  "1D": PREMIUM ? ["i5", 1] : null,
  "1W": PREMIUM ? ["i60", 5] : ["daily", 5],
  "1M": ["daily", 22],
  "1Y": ["weekly", 52],
};

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

function send(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    // lets the demo call the API even when opened from file://
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(body));
}

// Free keys also reject bursts faster than 1 request/second, so upstream calls go out one at a time.
let gate = Promise.resolve();
function av(params) {
  const run = gate.then(() => callAv(params));
  gate = run.catch(() => {}).then(() => new Promise((r) => setTimeout(r, 1100)));
  return run;
}

async function callAv(params) {
  const json = await (await fetch(`https://www.alphavantage.co/query?${params}&apikey=${KEY}`)).json();
  // rate-limit, premium and error responses come back as {Information|Note|Error Message}
  const msg = json.Information || json.Note || json["Error Message"];
  if (msg) throw Error(msg);
  return json;
}

// Returns {at, data, stale}. Concurrent requests share one upstream call, and if Alpha Vantage
// fails (usually the daily limit) we keep serving the last good copy, marked stale. After a
// failure we wait RETRY_MS before trying again, so 10s polling can't burn through the quota.
const RETRY_MS = 60 * 1000;
// The cache is saved to disk, so restarting the server doesn't spend more of the free daily quota
// (about 25 calls a day) re-fetching charts that are still fresh. The file is gitignored.
const CACHE_FILE = path.join(ROOT, ".av-cache.json");
const cache = new Map();
try {
  for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")))) cache.set(k, v);
} catch (e) {}
let saveTimer;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => fs.writeFile(CACHE_FILE, JSON.stringify(Object.fromEntries(cache)), () => {}), 500);
}
const inflight = new Map();
const failed = new Map();
async function cached(key, ttl, load) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return { ...hit, stale: false };
  const f = failed.get(key);
  if (f && Date.now() - f.at < RETRY_MS) {
    if (hit) return { ...hit, stale: true };
    throw f.error;
  }
  if (!inflight.has(key)) {
    const p = load()
      .then((data) => {
        const entry = { at: Date.now(), data };
        cache.set(key, entry);
        persist();
        failed.delete(key);
        return entry;
      })
      .catch((error) => {
        failed.set(key, { at: Date.now(), error });
        throw error;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, p);
  }
  try {
    return { ...(await inflight.get(key)), stale: false };
  } catch (e) {
    if (hit) return { ...hit, stale: true };
    throw e;
  }
}

const getQuote = (symbol) =>
  cached(`quote:${symbol}`, QUOTE_TTL, async () => {
    const q = (await av(`function=GLOBAL_QUOTE&symbol=${symbol}`))["Global Quote"];
    if (!q || !q["05. price"]) throw Error("No quote returned");
    return {
      symbol: q["01. symbol"],
      price: +q["05. price"],
      change: +q["09. change"],
      changePercent: q["10. change percent"],
      open: +q["02. open"],
      high: +q["03. high"],
      low: +q["04. low"],
      previousClose: +q["08. previous close"],
      day: q["07. latest trading day"],
    };
  });

const getSeries = (symbol, src) =>
  cached(`${src}:${symbol}`, SOURCES[src].ttl, async () => {
    const json = await av(`${SOURCES[src].fn}&symbol=${symbol}`);
    const bars = json[Object.keys(json).find((k) => k.includes("Series"))];
    if (!bars) throw Error("No chart data returned");
    return Object.keys(bars)
      .sort()
      .map((t) => ({ t, c: +bars[t]["4. close"] }));
  });

const validSymbol = (s) => /^[A-Z.]{1,10}$/.test(s);

async function quote(res, symbol) {
  if (!KEY) return send(res, 500, { error: "ALPHA_VANTAGE_API_KEY is not set" });
  if (!validSymbol(symbol)) return send(res, 400, { error: "Invalid symbol" });
  try {
    send(res, 200, (await getQuote(symbol)).data);
  } catch (e) {
    send(res, 502, { error: e.message || "Could not reach Alpha Vantage" });
  }
}

async function chart(res, symbol, range) {
  if (!KEY) return send(res, 500, { error: "ALPHA_VANTAGE_API_KEY is not set" });
  if (!validSymbol(symbol)) return send(res, 400, { error: "Invalid symbol" });
  if (!(range in RANGES)) return send(res, 400, { error: "Invalid range" });
  if (!RANGES[range]) return send(res, 403, { error: `${range} needs a premium Alpha Vantage key` });

  const [src, days] = RANGES[range];
  try {
    const [q, s] = await Promise.all([getQuote(symbol), getSeries(symbol, src)]);
    const dates = [...new Set(s.data.map((p) => p.t.slice(0, 10)))].slice(-days);
    const points = s.data.filter((p) => p.t.slice(0, 10) >= dates[0]).map((p) => ({ ...p }));
    // end the line on the live price: update the latest bar, or add today if it isn't in the history yet
    const last = points[points.length - 1];
    if (last.t.slice(0, 10) >= q.data.day) last.c = q.data.price;
    else points.push({ t: q.data.day, c: q.data.price });

    send(res, 200, {
      symbol,
      range,
      points,
      quote: q.data,
      ranges: Object.keys(RANGES).filter((r) => RANGES[r]),
      refreshedAt: new Date(q.at).toISOString(),
      stale: q.stale || s.stale,
    });
  } catch (e) {
    send(res, 502, { error: e.message || "Could not reach Alpha Vantage" });
  }
}

http
  .createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (req.headers["x-forwarded-proto"] === "https") res.setHeader("Strict-Transport-Security", "max-age=15552000");
    // a malformed path ("//x", "/%E0") throws here; answer 400 instead of crashing the server
    let url, pathname;
    try {
      url = new URL(req.url, "http://localhost");
      pathname = decodeURIComponent(url.pathname);
    } catch (e) {
      res.writeHead(400);
      return res.end("Bad request");
    }
    if (pathname === "/healthz") return send(res, 200, { ok: true });
    if (await api.handle(req, res, pathname)) return;
    const symbol = (url.searchParams.get("symbol") || "").toUpperCase();
    // lets the page check for a key before polling, so a keyless server doesn't log errors every 10s
    if (pathname === "/api/status") return send(res, 200, { live: !!KEY, premium: PREMIUM });
    if (pathname === "/api/quote") return quote(res, symbol);
    if (pathname === "/api/chart") return chart(res, symbol, url.searchParams.get("range") || "1M");

    const file = path.join(ROOT, pathname === "/" ? "/index.html" : pathname);
    // refuse anything outside the site and any hidden path (.git/, .claude/, .env)
    if (!file.startsWith(ROOT + path.sep) || path.relative(ROOT, file).split(path.sep).some((s) => s.startsWith(".") || s === "server") || path.basename(file) === "server.js") {
      res.writeHead(403);
      return res.end();
    }
    fs.readFile(file, (err, buf) => {
      if (err) {
        // pages get the friendly 404; assets just a plain one
        return fs.readFile(path.join(ROOT, "404.html"), (e2, page) => {
          res.writeHead(404, { "Content-Type": e2 || path.extname(file) ? "text/plain" : "text/html; charset=utf-8" });
          res.end(e2 || path.extname(file) ? "Not found" : page);
        });
      }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
      res.end(buf);
    });
  })
  // HOST=0.0.0.0 when deployed (a container or host must be reachable from outside); localhost-only on your computer
  .listen(PORT, process.env.HOST || "127.0.0.1", () => {
    console.log(`Mintly running at http://localhost:${PORT}`);
    console.log(`Live price refreshes from Alpha Vantage every ${QUOTE_TTL / 1000}s (${PREMIUM ? "premium" : "free"} key)`);
    if (!KEY) console.warn("Warning: ALPHA_VANTAGE_API_KEY is not set; live data will fail.");
  });
