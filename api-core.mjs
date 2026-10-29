// Mintly analytics core, shared by the Cloudflare Worker (worker.js) and the local dev server (server.js).
// It also runs in the browser so the admin console can draw sample data when no backend is connected.
//
// Privacy by design: events are topics and activity only. Nothing a learner types is ever sent or stored,
// and learners are pseudonymous (a random id kept in their own browser), not names or emails.

export const TYPES = new Set(["page_view", "lesson_view", "lesson_complete", "quiz", "film_play", "leaf_topic", "explore_interest", "game"]);
export const ROLES = new Set(["guest", "student", "parent", "teacher", "admin"]);
export const CATS = ["basics", "budgeting", "saving", "banking", "borrowing", "investing", "crypto", "collectibles", "earning", "scams", "planning"];
export const LESSON_CAT = { "lesson-1": "basics", "lesson-2": "budgeting", "lesson-3": "saving", "lesson-4": "banking", "lesson-5": "investing", "lesson-6": "borrowing", "lesson-7": "investing", "lesson-8": "earning", "lesson-9": "scams", "lesson-10": "planning", "lesson-11": "basics", "lesson-12": "earning", "lesson-13": "planning", "lesson-14": "investing", "lesson-15": "borrowing" };
export const LESSONS = Object.keys(LESSON_CAT);
// how much each kind of activity says about what someone is interested in
const WEIGHT = { lesson_view: 1, film_play: 1, lesson_complete: 3, leaf_topic: 3, explore_interest: 5 };

const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store", ...extra } });

// ---------------------------------------------------------------- validation
export function clean(body, now = Date.now()) {
  if (!body || typeof body !== "object") return null;
  const uid = String(body.uid || "");
  if (!/^[a-z0-9]{8,32}$/.test(uid)) return null;
  const role = ROLES.has(body.role) ? body.role : "guest";
  const plan = body.plan ? String(body.plan).slice(0, 16).replace(/[^a-z0-9_-]/gi, "") : null;
  const rows = [];
  for (const e of Array.isArray(body.events) ? body.events.slice(0, 40) : []) {
    if (!e || !TYPES.has(e.type)) continue;
    const key = String(e.key == null ? "" : e.key).slice(0, 64).replace(/[^a-z0-9:_\-./ ]/gi, "");
    const value = typeof e.value === "number" && isFinite(e.value) ? Math.round(e.value * 100) / 100 : null;
    const ts = typeof e.ts === "number" && e.ts > now - 864e5 * 2 && e.ts <= now + 6e4 ? Math.round(e.ts) : now;
    rows.push({ ts, uid, role, plan, type: e.type, key, value });
  }
  return rows;
}

// ---------------------------------------------------------------- aggregation
function categoryOf(r) {
  if (r.type === "lesson_view" || r.type === "lesson_complete" || r.type === "film_play") return LESSON_CAT[r.key] || null;
  if (r.type === "leaf_topic" || r.type === "explore_interest") return CATS.includes(r.key) ? r.key : null;
  return null;
}

export function insights(rows, now = Date.now()) {
  const by = new Map();
  for (const r of rows) {
    let l = by.get(r.uid);
    if (!l) by.set(r.uid, (l = { uid: r.uid, role: r.role, plan: r.plan, events: 0, firstSeen: r.ts, lastSeen: r.ts, interests: {}, lessons: {}, topics: {} }));
    l.events++; l.lastSeen = Math.max(l.lastSeen, r.ts); l.firstSeen = Math.min(l.firstSeen, r.ts);
    if (r.role && r.role !== "guest") l.role = r.role;
    if (r.plan) l.plan = r.plan;
    const cat = categoryOf(r);
    if (cat && WEIGHT[r.type]) l.interests[cat] = (l.interests[cat] || 0) + WEIGHT[r.type];
    if (r.type === "leaf_topic") l.topics[r.key] = (l.topics[r.key] || 0) + 1;
    if (LESSON_CAT[r.key] && (r.type === "lesson_view" || r.type === "lesson_complete" || r.type === "film_play" || r.type === "quiz")) {
      const x = (l.lessons[r.key] ||= { views: 0, films: 0, complete: 0, quiz: null });
      if (r.type === "lesson_view") x.views++; else if (r.type === "film_play") x.films++; else if (r.type === "lesson_complete") x.complete++; else if (r.type === "quiz" && r.value != null) x.quiz = x.quiz == null ? r.value : Math.max(x.quiz, r.value);
    }
  }
  const learners = [...by.values()].filter((l) => l.role !== "admin").sort((a, b) => b.events - a.events).slice(0, 250);
  const catStats = new Map(CATS.map((c) => [c, { cat: c, score: 0, learners: 0 }]));
  const links = [];
  for (const l of learners) {
    const entries = Object.entries(l.interests).sort((a, b) => b[1] - a[1]);
    l.top = entries.length ? entries[0][0] : null;
    const max = entries.length ? entries[0][1] : 1;
    for (const [cat, score] of entries) { const s = catStats.get(cat); s.score += score; s.learners++; }
    for (const [cat, score] of entries.slice(0, 3)) links.push({ uid: l.uid, cat, w: Math.round((score / max) * 100) / 100 });
    l.completed = Object.values(l.lessons).filter((x) => x.complete).length;
  }
  const lessons = LESSONS.map((id) => {
    let views = 0, films = 0, complete = 0, q = 0, qn = 0;
    for (const l of learners) { const x = l.lessons[id]; if (!x) continue; if (x.views) views++; if (x.films) films++; if (x.complete) complete++; if (x.quiz != null) { q += x.quiz; qn++; } }
    return { id, cat: LESSON_CAT[id], views, films, complete, avgQuiz: qn ? Math.round(q / qn) : null };
  });
  const topics = {};
  for (const r of rows) if (r.type === "leaf_topic" && r.role !== "admin") topics[r.key] = (topics[r.key] || 0) + 1;
  const week = now - 7 * 864e5;
  return {
    generatedAt: now,
    totals: { learners: learners.length, events: rows.length, active7d: learners.filter((l) => l.lastSeen >= week).length, completions: lessons.reduce((a, b) => a + b.complete, 0) },
    interests: [...catStats.values()].filter((c) => c.score > 0).sort((a, b) => b.score - a.score),
    links, learners, lessons,
    leafTopics: Object.entries(topics).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count).slice(0, 12)
  };
}

export function toCsv(data) {
  const head = ["learner", "role", "plan", "events", "lessons_completed", "top_interest", ...CATS];
  const lines = [head.join(",")];
  for (const l of data.learners) lines.push([l.uid.slice(-8), l.role, l.plan || "", l.events, l.completed, l.top || "", ...CATS.map((c) => l.interests[c] || 0)].join(","));
  return lines.join("\n");
}

// ---------------------------------------------------------------- sample data (admin console preview)
export function sampleEvents(now = Date.now(), n = 40) {
  let s = 1234567; const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const personas = [["investing", "crypto"], ["collectibles", "investing"], ["saving", "budgeting"], ["scams", "banking"], ["earning", "planning"], ["borrowing", "banking"], ["crypto", "collectibles"], ["investing", "saving"]];
  const rows = [];
  for (let i = 0; i < n; i++) {
    const uid = ("sample" + (1000 + i)).padEnd(10, "0"), p = personas[i % personas.length], role = rnd() < .12 ? "teacher" : "student";
    const push = (type, key, value) => rows.push({ ts: now - Math.floor(rnd() * 20 * 864e5), uid, role, plan: rnd() < .6 ? "family" : null, type, key, value: value ?? null });
    const reach = 2 + Math.floor(rnd() * 8);
    for (let k = 1; k <= reach; k++) { const id = "lesson-" + k; push("lesson_view", id); if (rnd() < .7) push("film_play", id); if (rnd() < .6) { push("quiz", id, 50 + Math.floor(rnd() * 50)); push("lesson_complete", id); } }
    const strong = 2 + Math.floor(rnd() * 5);
    for (let k = 0; k < strong; k++) push("leaf_topic", rnd() < .65 ? p[0] : rnd() < .6 ? p[1] : CATS[Math.floor(rnd() * CATS.length)]);
    if (rnd() < .5) push("explore_interest", p[0]);
  }
  return rows;
}


// ---------------------------------------------------------------- accounts and cloud sync
const enc = new TextEncoder();
const toHex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const fromHex = (h) => Uint8Array.from(h.match(/../g) || [], (x) => parseInt(x, 16));
const randHex = (n) => toHex(crypto.getRandomValues(new Uint8Array(n)));
async function pbkdf2(pw, saltHex) {
  const key = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  return toHex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: fromHex(saltHex), iterations: 100000 }, key, 256));
}
const sha256 = async (s) => toHex(await crypto.subtle.digest("SHA-256", enc.encode(s)));
const SESSION_MS = 30 * 864e5;
const PLANS = new Set(["family", "premium", "pro", "school"]);
const SELF_ROLES = new Set(["student", "parent", "teacher"]); // nobody can sign themselves up as admin
const publicUser = (u) => ({ name: u.name, email: u.email, role: u.role, plan: u.plan || null });
const failures = new Map(); // best-effort login throttle (per server instance)

// Learner data is a bag of "mintly:*" browser keys, merged key by key: the newest write wins.
export function mergeData(stored, incoming) {
  const kv = { ...(stored && stored.kv) }, t = { ...(stored && stored.t) };
  let size = 0;
  for (const [k, v] of Object.entries((incoming && incoming.kv) || {})) {
    if (!/^mintly:[a-zA-Z0-9:_.@+\-]{1,110}$/.test(k)) continue;
    if (v !== null && (typeof v !== "string" || v.length > 60000)) continue;
    const it = Number(incoming.t && incoming.t[k]) || 0;
    if (it > (t[k] || 0) || !(k in t)) { kv[k] = v; t[k] = it || Date.now(); }
  }
  for (const k of Object.keys(kv)) { size += k.length + (kv[k] ? kv[k].length : 0); }
  if (size > 400000) return null;
  return { kv, t };
}

async function authed(request, store, now, bodyToken) {
  const raw = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "") || bodyToken || "";
  if (!/^[a-f0-9]{64}$/.test(raw)) return null;
  const s = await store.getSession(await sha256(raw));
  if (!s || s.exp < now) return null;
  const u = await store.getUser(s.email);
  return u ? { user: u, hash: await sha256(raw) } : null;
}

async function accountRoutes(request, p, { store, now, selfPlan }) {
  const body = request.method === "GET" ? {} : await request.json().catch(() => ({}));
  if (p === "/api/auth/signup" && request.method === "POST") {
    const email = String(body.email || "").trim().toLowerCase(), name = String(body.name || "").trim().slice(0, 60), pw = String(body.password || "");
    if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(email) || email.endsWith("@mintly.demo")) return json({ error: "Please use a valid email address." }, 400);
    if (!name) return json({ error: "Please add your name." }, 400);
    if (pw.length < 8 || pw.length > 200) return json({ error: "Passwords need at least 8 characters." }, 400);
    if (await store.getUser(email)) return json({ error: "An account with that email already exists." }, 409);
    const role = SELF_ROLES.has(body.role) ? body.role : "student", plan = selfPlan && PLANS.has(body.plan) ? body.plan : null;
    const salt = randHex(16), user = { email, name, role, plan, salt, hash: await pbkdf2(pw, salt), created: now };
    await store.putUser(user);
    const token = randHex(32); await store.putSession(await sha256(token), email, now + SESSION_MS);
    return json({ token, user: publicUser(user) });
  }
  if (p === "/api/auth/login" && request.method === "POST") {
    const email = String(body.email || "").trim().toLowerCase(), f = failures.get(email) || { n: 0, at: now };
    if (now - f.at > 600000) { f.n = 0; f.at = now; }
    if (f.n >= 8) return json({ error: "Too many attempts. Try again in a few minutes." }, 429);
    const u = await store.getUser(email);
    const ok = u && (await pbkdf2(String(body.password || ""), u.salt)) === u.hash;
    if (!ok) { failures.set(email, { n: f.n + 1, at: f.at }); return json({ error: "That email and password don't match." }, 401); }
    failures.delete(email);
    const token = randHex(32); await store.putSession(await sha256(token), email, now + SESSION_MS);
    return json({ token, user: publicUser(u) });
  }
  if (p === "/api/auth/logout" && request.method === "POST") {
    const a = await authed(request, store, now, body.token); if (a) await store.delSession(a.hash);
    return json({ ok: true });
  }
  if (p === "/api/me") {
    const a = await authed(request, store, now, body.token); if (!a) return json({ error: "unauthorized" }, 401);
    if (request.method === "DELETE") { await store.deleteUser(a.user.email); return json({ ok: true }); }
    if (request.method === "POST" && body.plan !== undefined) {
      if (!selfPlan || !(body.plan === null || PLANS.has(body.plan))) return json({ error: "Plan changes are handled by billing." }, 403);
      a.user.plan = body.plan; await store.putUser(a.user);
    }
    return json({ user: publicUser(a.user) });
  }
  if (p === "/api/data" && request.method === "POST") {
    const a = await authed(request, store, now, body.token); if (!a) return json({ error: "unauthorized" }, 401);
    const merged = mergeData(await store.getData(a.user.email), body);
    if (!merged) return json({ error: "too large" }, 413);
    await store.putData(a.user.email, merged, now);
    return json(merged);
  }
  return null;
}


// ---------------------------------------------------------------- classes and family links
// Students choose who sees their progress: they join a class with a teacher's code, or hand a parent a code.
// Teachers and parents get a summary of numbers only. Chats and typed work are never part of it.
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const newCode = (n = 6) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
const opaque = async (email) => (await sha256("mintly-link:" + email)).slice(0, 10);
const isoDay = (d) => d.toISOString().slice(0, 10);

export function summarizeUser(email, data, now = Date.now()) {
  const kv = (data && data.kv) || {};
  let done = 0, qc = 0, qt = 0;
  for (const id of LESSONS) {
    if (kv[`mintly:completed:${email}:${id}`] === "true") done++;
    try { const q = JSON.parse(kv[`mintly:quiz:${email}:${id}`] || "null"); if (q && q.t) { qc += +q.c || 0; qt += +q.t || 0; } } catch (e) {}
  }
  let days = []; try { days = JSON.parse(kv[`mintly:days:${email}`] || "[]"); } catch (e) {}
  days = (Array.isArray(days) ? days : []).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  const set = new Set(days), d = new Date(now); let streak = 0;
  if (!set.has(isoDay(d))) d.setUTCDate(d.getUTCDate() - 1);
  while (set.has(isoDay(d))) { streak++; d.setUTCDate(d.getUTCDate() - 1); }
  const xp = done * 100 + qc * 10 + (+kv[`mintly:bonusxp:${email}`] || 0);
  return { lessonsDone: done, lessonsTotal: LESSONS.length, quizAccuracy: qt ? Math.round((qc / qt) * 100) : null, xp, level: Math.floor(xp / 150) + 1, streak, lastActive: days.length ? days[days.length - 1] : null, days: days.slice(-30) };
}

async function sharedRoutes(request, p, { store, now }) {
  const isGet = request.method === "GET";
  const body = isGet ? {} : await request.json().catch(() => ({}));
  const a = await authed(request, store, now, body.token); if (!a) return json({ error: "unauthorized" }, 401);
  const me = a.user, role = me.role;
  const summaryOf = async (u) => ({ name: u.name, ...summarizeUser(u.email, await store.getData(u.email), now) });

  if (p === "/api/classes" && isGet) {
    if (role !== "teacher") return json({ error: "Only teachers have classes." }, 403);
    const out = [];
    for (const c of await store.classesByTeacher(me.email)) {
      const students = [];
      for (const em of await store.classMembers(c.code)) { const u = await store.getUser(em); if (u) students.push(await summaryOf(u)); }
      out.push({ code: c.code, name: c.name, created: c.created, students });
    }
    return json({ classes: out });
  }
  if (p === "/api/classes" && request.method === "POST") {
    if (role !== "teacher") return json({ error: "Only teachers can create classes." }, 403);
    const name = String(body.name || "").trim().slice(0, 60); if (!name) return json({ error: "Give the class a name." }, 400);
    if ((await store.classesByTeacher(me.email)).length >= 12) return json({ error: "That's the limit of 12 classes." }, 400);
    for (let i = 0; i < 6; i++) { const code = newCode(6); if (!(await store.getClass(code))) { await store.createClass({ code, name, teacher: me.email, created: now }); return json({ code, name }); } }
    return json({ error: "Couldn't make a code. Try again." }, 500);
  }
  if (p === "/api/classes/join" && request.method === "POST") {
    if (role !== "student") return json({ error: "Only students join classes." }, 403);
    const code = String(body.code || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, ""), c = code && (await store.getClass(code));
    if (!c) return json({ error: "That code doesn't match a class. Check it with your teacher." }, 404);
    await store.joinClass(code, me.email, now); const t = await store.getUser(c.teacher);
    return json({ ok: true, name: c.name, teacher: t ? t.name : "your teacher" });
  }
  if (p === "/api/classes/leave" && request.method === "POST") { await store.leaveClass(String(body.code || "").toUpperCase(), me.email); return json({ ok: true }); }
  if (p === "/api/my/classes" && isGet) {
    const out = []; for (const c of await store.classesOfStudent(me.email)) { const t = await store.getUser(c.teacher); out.push({ code: c.code, name: c.name, teacher: t ? t.name : "" }); }
    return json({ classes: out });
  }
  if (p === "/api/links/code" && request.method === "POST") {
    if (role !== "student") return json({ error: "Only students can make a parent code." }, 403);
    let code = await store.getParentCode(me.email);
    if (!code || body.fresh) { for (let i = 0; i < 6; i++) { const c = newCode(8); if (!(await store.studentByParentCode(c))) { code = c; await store.putParentCode(me.email, c); break; } } }
    return json({ code });
  }
  if (p === "/api/links/join" && request.method === "POST") {
    if (role !== "parent") return json({ error: "Only parent accounts link to a teen." }, 403);
    const code = String(body.code || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, ""), st = code && (await store.studentByParentCode(code));
    const u = st && (await store.getUser(st));
    if (!u) return json({ error: "That code doesn't match anyone. Ask your teen for a fresh one." }, 404);
    await store.linkParent(me.email, u.email, now); return json({ ok: true, name: u.name });
  }
  if (p === "/api/links" && isGet) {
    if (role === "parent") { const kids = []; for (const em of await store.childrenOfParent(me.email)) { const u = await store.getUser(em); if (u) kids.push({ id: await opaque(u.email), ...(await summaryOf(u)) }); } return json({ children: kids }); }
    const ps = []; for (const em of await store.parentsOfStudent(me.email)) { const u = await store.getUser(em); if (u) ps.push({ id: await opaque(u.email), name: u.name }); } return json({ parents: ps });
  }
  if (p === "/api/links/unlink" && request.method === "POST") {
    const id = String(body.id || "");
    if (role === "parent") { for (const em of await store.childrenOfParent(me.email)) if ((await opaque(em)) === id) await store.unlinkParent(me.email, em); }
    else for (const em of await store.parentsOfStudent(me.email)) if ((await opaque(em)) === id) await store.unlinkParent(em, me.email);
    return json({ ok: true });
  }
  return null;
}

// ---------------------------------------------------------------- HTTP handler
function safeEqual(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
const isAdmin = (req, key) => !!key && key.length >= 12 && safeEqual((req.headers.get("authorization") || "").replace(/^Bearer\s+/i, ""), key);

// store: { insert(rows), since(ts, limit) }.  Returns a Response, or null when the path isn't an API route.
export async function handle(request, { store, adminKey, now = Date.now(), selfPlan = true }) {
  const url = new URL(request.url), p = url.pathname;
  if (!p.startsWith("/api/")) return null;
  if (p === "/api/health") return json({ backend: true, accounts: true });
  if (p.startsWith("/api/classes") || p.startsWith("/api/my/") || p.startsWith("/api/links")) { const r = await sharedRoutes(request, p, { store, now }); if (r) return r; }
  if (p.startsWith("/api/auth/") || p === "/api/me" || p === "/api/data") { const r = await accountRoutes(request, p, { store, now, selfPlan }); if (r) return r; }
  if (p === "/api/events" && request.method === "POST") {
    let body; try { body = JSON.parse(await request.text()); } catch (e) { return json({ error: "bad json" }, 400); }
    const rows = clean(body, now);
    if (!rows) return json({ error: "bad request" }, 400);
    if (rows.length) await store.insert(rows);
    return json({ ok: true, stored: rows.length });
  }
  if (p.startsWith("/api/admin/")) {
    if (!isAdmin(request, adminKey)) return json({ error: "unauthorized" }, 401);
    const days = Math.min(365, Math.max(1, +url.searchParams.get("days") || 30));
    if (p === "/api/admin/insights") return json(insights(await store.since(now - days * 864e5, 50000), now));
    if (p === "/api/admin/users") return json({ users: (await store.listUsers()).map(({ email, name, role, plan, created }) => ({ email, name, role, plan, created })) });
    if (p === "/api/admin/export.csv") return new Response(toCsv(insights(await store.since(now - days * 864e5, 50000), now)), { headers: { "content-type": "text/csv", "content-disposition": 'attachment; filename="mintly-learners.csv"', "cache-control": "no-store" } });
  }
  return null;
}
