// JSON API for accounts, lesson progress and the student / parent / teacher dashboards.
const crypto = require("crypto");
const { promisify } = require("util");
const db = require("./db");
const mail = require("./mail");
const curriculum = require("../curriculum.json");

const scrypt = promisify(crypto.scrypt);
const ROLES = ["student", "parent", "teacher"];
const LESSON_IDS = [...curriculum.lessons, ...(curriculum.electives || [])].map((l) => l.id);
const SESSION_DAYS = 30;
const COOKIE = "mintly_session";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || null;
// The site owner's login. Set both in .env; the admin area stays off if either is missing.
const ADMIN_USER = process.env.ADMIN_USER || "";
const ADMIN_PASS = process.env.ADMIN_PASS || "";
const ADMIN_COOKIE = "mintly_admin";
const ADMIN_HOURS = 8;
const STARTED = Date.now();
// Links in emails use this, never the request's Host header (which a visitor can fake).
const BASE_URL = (process.env.BASE_URL || `http://localhost:${process.env.PORT || 8000}`).replace(/\/$/, "");

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const bad = (msg) => new HttpError(400, msg);

// ---------- helpers ----------

function send(res, status, body, headers = {}) {
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.method === "GET") return {};
  const isJson = (req.headers["content-type"] || "").startsWith("application/json");
  if (req.method === "DELETE" && !isJson) return {}; // most deletes carry no body
  // JSON-only POST/PUT, together with SameSite=Lax cookies, stops other sites submitting forms as the user
  if (!isJson) throw bad("Expected JSON");
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 100000) throw new HttpError(413, "Request too large");
  }
  try {
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    throw bad("Invalid JSON");
  }
}

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return salt.toString("hex") + ":" + hash.toString("hex");
}

async function checkPassword(password, stored) {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  const test = await scrypt(password, Buffer.from(salt, "hex"), 64);
  return crypto.timingSafeEqual(test, Buffer.from(hash, "hex"));
}

function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

function startSession(req, res, user) {
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  for (const [k, s] of Object.entries(db.data.sessions)) if (s.exp < now) delete db.data.sessions[k];
  db.data.sessions[sha(token)] = { userId: user.id, exp: now + SESSION_DAYS * 86400000 };
  db.save();
  const secure = req.headers["x-forwarded-proto"] === "https" || process.env.COOKIE_SECURE === "1";
  return `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 86400}${secure ? "; Secure" : ""}`;
}

const safeEq = (a, b) => crypto.timingSafeEqual(Buffer.from(sha(String(a))), Buffer.from(sha(String(b))));

function startAdminSession(req) {
  const token = crypto.randomBytes(32).toString("hex");
  db.data.sessions[sha(token)] = { admin: true, exp: Date.now() + ADMIN_HOURS * 3600000 };
  db.save();
  const secure = req.headers["x-forwarded-proto"] === "https" || process.env.COOKIE_SECURE === "1";
  return `${ADMIN_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${ADMIN_HOURS * 3600}${secure ? "; Secure" : ""}`;
}

function requireAdmin(req) {
  const token = parseCookies(req)[ADMIN_COOKIE];
  const s = token && db.data.sessions[sha(token)];
  if (!ADMIN_USER || !ADMIN_PASS || !s || !s.admin || s.exp < Date.now()) throw new HttpError(401, "Admin sign-in required");
}

// Remember when a student was active (used for streaks). One entry per 5 minutes at most.
function touch(user) {
  const log = (user.activityLog = user.activityLog || []);
  const now = Date.now();
  if (!log.length || now - log[log.length - 1] > 300000) log.push(now);
  if (log.length > 600) log.splice(0, log.length - 600);
}

function dropSessions(userId) {
  for (const [k, s] of Object.entries(db.data.sessions)) if (s.userId === userId) delete db.data.sessions[k];
}

function sessionUser(req) {
  const token = parseCookies(req)[COOKIE];
  const s = token && db.data.sessions[sha(token)];
  if (!s || s.exp < Date.now()) return null;
  return db.data.users[s.userId] || null;
}

function requireUser(req, role) {
  const user = sessionUser(req);
  if (!user) throw new HttpError(401, "Please sign in");
  if (role && user.role !== role) throw new HttpError(403, "This is only available to " + role + " accounts");
  return user;
}

const publicUser = (u) => ({
  id: u.id, role: u.role, name: u.name, email: u.email, plan: u.plan || null, picture: u.picture || null,
  verified: !!u.verified, hasPassword: !!u.passHash,
});

// One-time links for email verification and password reset. Only a hash is stored.
function makeToken(user, kind, hours) {
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  for (const [k, t] of Object.entries(db.data.tokens)) if (t.exp < now) delete db.data.tokens[k];
  db.data.tokens[sha(token)] = { userId: user.id, kind, exp: now + hours * 3600000 };
  db.save();
  return token;
}
function useToken(token, kind) {
  const key = sha(str(token, 100));
  const t = db.data.tokens[key];
  if (!t || t.kind !== kind || t.exp < Date.now() || !db.data.users[t.userId]) throw bad("That link is invalid or has expired.");
  delete db.data.tokens[key];
  db.save();
  return db.data.users[t.userId];
}
function sendVerification(user) {
  const link = `${BASE_URL}/verify.html?token=${makeToken(user, "verify", 72)}`;
  return mail.send({ to: user.email, subject: "Confirm your Mintly email", text: `Hi ${user.name},\n\nConfirm your email for Mintly:\n${link}\n\nThe link works for 3 days. If you didn't sign up, ignore this email.` });
}

// 10 failed sign-ins per address and email in 15 minutes, then wait. In memory, resets on restart.
const attempts = new Map();
function throttle(key, max = 10) {
  const now = Date.now();
  const list = (attempts.get(key) || []).filter((t) => now - t < 15 * 60000);
  if (list.length >= max) throw new HttpError(429, "Too many attempts. Try again in a few minutes.");
  list.push(now);
  attempts.set(key, list);
}
const clearThrottle = (key) => attempts.delete(key);

// ---------- progress ----------

function lessonRecord(user, lessonId) {
  user.progress = user.progress || { lessons: {} };
  return (user.progress.lessons[lessonId] = user.progress.lessons[lessonId] || {});
}

// Simulation decisions (the demo posts one when a student reaches their Decision Score).
function decisionSummary(user) {
  const list = user.decisions || [];
  return {
    count: list.length,
    avgScore: list.length ? Math.round(list.reduce((a, d) => a + d.score, 0) / list.length) : null,
    recent: list.slice(-5).reverse(),
  };
}

function progressSummary(user) {
  const lessons = curriculum.lessons.map((l) => {
    const rec = (user.progress && user.progress.lessons[l.id]) || {};
    const st = rec.state || {};
    const complete = !!rec.completedAt;
    const pct = complete ? 100 : st.total ? Math.round((st.done / st.total) * 100) : 0;
    return {
      id: l.id,
      title: l.title,
      status: complete ? "complete" : pct > 0 ? "in-progress" : "not-started",
      pct,
      completedAt: rec.completedAt || null,
      updatedAt: rec.updatedAt || null,
    };
  });
  const times = lessons.map((l) => l.updatedAt).filter(Boolean);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    completed: lessons.filter((l) => l.status === "complete").length,
    total: lessons.length,
    lessons,
    decisions: decisionSummary(user),
    lastActive: Math.max(0, ...times, ...((user.decisions || []).map((d) => d.at))) || null,
  };
}

// ---------- accounts ----------

async function createAccount({ role, name, email, password, googleId, picture, plan }) {
  const user = {
    id: db.id(),
    role,
    name,
    email,
    passHash: password ? await hashPassword(password) : null,
    googleId: googleId || null,
    picture: picture || null,
    plan: plan || null,
    verified: !!googleId, // Google has already verified the address
    createdAt: Date.now(),
  };
  if (role === "student") {
    user.linkCode = db.newCode();
    user.progress = { lessons: {} };
  }
  if (role === "parent") user.childIds = [];
  db.data.users[user.id] = user;
  db.save();
  return user;
}

const PLANS = ["family", "premium", "pro", "school"];
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254;

async function verifyGoogle(credential) {
  if (!GOOGLE_CLIENT_ID) throw new HttpError(503, "Google sign-in isn't set up on this server");
  const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  const info = await r.json().catch(() => ({}));
  if (!r.ok || info.aud !== GOOGLE_CLIENT_ID || info.email_verified !== "true") {
    throw new HttpError(401, "Google sign-in failed");
  }
  return info;
}

// ---------- routes ----------

const routes = [];
const route = (method, pattern, handler) => routes.push({ method, re: new RegExp("^" + pattern + "$"), handler });

route("GET", "/api/config", async () => ({ googleClientId: GOOGLE_CLIENT_ID || null, contactEmail: CONTACT_EMAIL }));

route("GET", "/api/me", async ({ req }) => {
  const user = sessionUser(req);
  return { user: user ? publicUser(user) : null };
});

route("POST", "/api/auth/signup", async ({ req, res, body }) => {
  const role = str(body.role, 20);
  const name = str(body.name, 80);
  const email = str(body.email, 254).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  if (!ROLES.includes(role)) throw bad("Choose student, parent or teacher.");
  if (!name) throw bad("Please enter your name.");
  if (!validEmail(email)) throw bad("Please enter a valid email.");
  if (password.length < 8 || password.length > 200) throw bad("Password must be at least 8 characters.");
  if (body.agree !== true) throw bad("Please agree to the Terms and Privacy Policy.");
  if (role === "student" && body.age13 !== true) throw bad("Mintly is for people 13 and older. Please ask a parent or teacher to help you.");
  throttle("signup|" + (req.socket.remoteAddress || ""), 60); // a whole class may sign up from one school network
  if (db.userByEmail(email)) throw new HttpError(409, "An account with that email already exists.");
  const user = await createAccount({ role, name, email, password, plan: PLANS.includes(body.plan) ? body.plan : null });
  user.consentAt = Date.now();
  sendVerification(user).catch(() => {});
  return { user: publicUser(user) , cookie: startSession(req, res, user) };
});

route("POST", "/api/auth/login", async ({ req, res, body }) => {
  const email = str(body.email, 254).toLowerCase();
  const key = (req.socket.remoteAddress || "") + "|" + email;
  if (ADMIN_USER && ADMIN_PASS && safeEq(str(body.email, 254), ADMIN_USER)) {
    throttle("admin|" + (req.socket.remoteAddress || ""), 5);
    if (!safeEq(typeof body.password === "string" ? body.password : "", ADMIN_PASS)) throw new HttpError(401, "That email and password don't match.");
    clearThrottle("admin|" + (req.socket.remoteAddress || ""));
    return { admin: true, cookie: startAdminSession(req) };
  }
  throttle(key);
  const user = db.userByEmail(email);
  const ok = user && (await checkPassword(typeof body.password === "string" ? body.password : "", user.passHash));
  if (!ok) throw new HttpError(401, "That email and password don't match.");
  clearThrottle(key);
  if (PLANS.includes(body.plan)) { user.plan = body.plan; db.save(); }
  return { user: publicUser(user), cookie: startSession(req, res, user) };
});

route("POST", "/api/auth/google", async ({ req, res, body }) => {
  const info = await verifyGoogle(str(body.credential, 5000));
  const email = info.email.toLowerCase();
  let user = db.userByEmail(email);
  if (user) {
    // Google verified this email, so link it to the existing account
    if (!user.googleId) user.googleId = info.sub;
    user.verified = true;
    if (!user.picture && info.picture) user.picture = info.picture;
    db.save();
  } else {
    const role = str(body.role, 20);
    if (!ROLES.includes(role)) throw new HttpError(404, "role_required");
    if (body.agree !== true) throw bad("Please agree to the Terms and Privacy Policy.");
    if (role === "student" && body.age13 !== true) throw bad("Mintly is for people 13 and older. Please ask a parent or teacher to help you.");
    user = await createAccount({
      role,
      name: str(info.name, 80) || email.split("@")[0],
      email,
      googleId: info.sub,
      picture: info.picture,
      plan: PLANS.includes(body.plan) ? body.plan : null,
    });
    user.consentAt = Date.now();
  }
  return { user: publicUser(user), cookie: startSession(req, res, user) };
});

route("POST", "/api/auth/logout", async ({ req }) => {
  const token = parseCookies(req)[COOKIE];
  if (token) delete db.data.sessions[sha(token)];
  db.save();
  return { ok: true, cookie: `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0` };
});

// --- email verification, password reset, account settings ---

route("POST", "/api/auth/verify", async ({ body }) => {
  const user = useToken(body.token, "verify");
  user.verified = true;
  db.save();
  return { ok: true };
});

route("POST", "/api/auth/resend-verification", async ({ req }) => {
  const user = requireUser(req);
  throttle("resend|" + user.id);
  if (!user.verified) await sendVerification(user);
  return { ok: true };
});

// Always answers the same way, so nobody can use this to find out which emails have accounts.
route("POST", "/api/auth/forgot", async ({ req, body }) => {
  throttle("forgot|" + (req.socket.remoteAddress || ""));
  const user = db.userByEmail(str(body.email, 254).toLowerCase());
  if (user) {
    const link = `${BASE_URL}/reset.html?token=${makeToken(user, "reset", 1)}`;
    mail.send({ to: user.email, subject: "Reset your Mintly password", text: `Hi ${user.name},\n\nChoose a new password:\n${link}\n\nThe link works for 1 hour. If you didn't ask for this, ignore this email; your password hasn't changed.` }).catch(() => {});
  }
  return { ok: true };
});

route("POST", "/api/auth/reset", async ({ req, res, body }) => {
  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < 8 || password.length > 200) throw bad("Password must be at least 8 characters.");
  const user = useToken(body.token, "reset");
  user.passHash = await hashPassword(password);
  user.verified = true; // they received mail at this address
  dropSessions(user.id); // signs out anyone else who had the old password
  db.save();
  return { user: publicUser(user), cookie: startSession(req, res, user) };
});

route("PUT", "/api/account", async ({ req, body }) => {
  const user = requireUser(req);
  const name = str(body.name, 80);
  if (!name) throw bad("Please enter your name.");
  user.name = name;
  db.save();
  return { user: publicUser(user) };
});

route("PUT", "/api/account/password", async ({ req, res, body }) => {
  const user = requireUser(req);
  throttle("pw|" + user.id);
  const next = typeof body.newPassword === "string" ? body.newPassword : "";
  if (next.length < 8 || next.length > 200) throw bad("New password must be at least 8 characters.");
  if (user.passHash && !(await checkPassword(typeof body.currentPassword === "string" ? body.currentPassword : "", user.passHash))) {
    throw new HttpError(401, "Your current password isn't right.");
  }
  user.passHash = await hashPassword(next);
  dropSessions(user.id);
  db.save();
  return { user: publicUser(user), cookie: startSession(req, res, user) };
});

// Everything Mintly holds about the account, as a download.
route("GET", "/api/account/export", async ({ req }) => {
  const user = requireUser(req);
  const { passHash, ...mine } = user;
  const classes = Object.values(db.data.classes).filter((c) => c.teacherId === user.id || c.studentIds.includes(user.id));
  return { exportedAt: new Date().toISOString(), account: mine, classes: classes.map((c) => ({ name: c.name, code: c.code })) };
});

function removeUser(user) {
  for (const c of Object.values(db.data.classes)) {
    if (c.teacherId === user.id) delete db.data.classes[c.id];
    else c.studentIds = c.studentIds.filter((s) => s !== user.id);
  }
  for (const u of Object.values(db.data.users)) if (u.childIds) u.childIds = u.childIds.filter((c) => c !== user.id);
  dropSessions(user.id);
  for (const [k, t] of Object.entries(db.data.tokens)) if (t.userId === user.id) delete db.data.tokens[k];
  delete db.data.users[user.id];
  db.save();
}

route("DELETE", "/api/account", async ({ req, body }) => {
  const user = requireUser(req);
  if (user.passHash && !(await checkPassword(typeof body.password === "string" ? body.password : "", user.passHash))) {
    throw new HttpError(401, "Enter your password to delete the account.");
  }
  removeUser(user);
  return { ok: true, cookie: `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0` };
});

// --- student ---

route("POST", "/api/decisions", async ({ req, body }) => {
  const user = requireUser(req, "student");
  const choice = str(body.choice, 10).toUpperCase();
  if (!["BUY", "SELL", "WAIT"].includes(choice)) throw bad("Unknown choice");
  const score = Number.isInteger(body.score) && body.score >= 0 && body.score <= 100 ? body.score : null;
  if (score === null) throw bad("Bad score");
  user.decisions = user.decisions || [];
  user.decisions.push({
    at: Date.now(),
    company: str(body.company, 60),
    ticker: str(body.ticker, 10),
    choice,
    reasoning: str(body.reasoning, 3000),
    confidence: Number.isInteger(body.confidence) ? Math.min(100, Math.max(0, body.confidence)) : null,
    score,
    scores: (Array.isArray(body.scores) ? body.scores : []).slice(0, 6).map((x) => [str(x[0], 30), Number.isInteger(x[1]) ? x[1] : 0]),
  });
  if (user.decisions.length > 200) user.decisions.shift();
  touch(user);
  db.save();
  return { ok: true };
});

route("GET", "/api/decisions", async ({ req }) => {
  const user = requireUser(req, "student");
  return { decisions: (user.decisions || []).slice().reverse() };
});

route("GET", "/api/progress", async ({ req }) => {
  const user = requireUser(req, "student");
  return { lessons: (user.progress && user.progress.lessons) || {}, interest: user.interest || null };
});

route("PUT", "/api/progress/([a-z0-9-]+)", async ({ req, body, params }) => {
  const user = requireUser(req, "student");
  const lessonId = params[0];
  if (!LESSON_IDS.includes(lessonId)) throw new HttpError(404, "Unknown lesson");
  const rec = lessonRecord(user, lessonId);
  const num = (v) => (Number.isInteger(v) && v >= 0 && v <= 1000 ? v : 0);
  if (body.state && typeof body.state === "object") {
    const s = body.state;
    rec.state = {
      quiz: Object.fromEntries(Object.entries(s.quiz || {}).slice(0, 50).map(([k, v]) => [str(k, 10), num(v)])),
      blanks: (Array.isArray(s.blanks) ? s.blanks : []).slice(0, 50).map(num),
      match: (Array.isArray(s.match) ? s.match : []).slice(0, 50).map((k) => str(k, 40)),
      done: num(s.done),
      total: num(s.total),
    };
  }
  if (body.answers && typeof body.answers === "object") {
    rec.answers = Object.fromEntries(
      Object.entries(body.answers).slice(0, 20).map(([k, v]) => [str(k, 40), str(v, 4000)])
    );
  }
  if (body.completed === true && !rec.completedAt) rec.completedAt = Date.now();
  rec.updatedAt = Date.now();
  touch(user);
  db.save();
  return { ok: true };
});

route("PUT", "/api/interest", async ({ req, body }) => {
  const user = requireUser(req, "student");
  const text = JSON.stringify(body.interest ?? null);
  if (text.length > 2000) throw bad("Too large");
  user.interest = body.interest ?? null;
  db.save();
  return { ok: true };
});

function classInfo(c) {
  const teacher = db.data.users[c.teacherId];
  return { id: c.id, name: c.name, teacher: teacher ? teacher.name : "" };
}

route("GET", "/api/student/summary", async ({ req }) => {
  const user = requireUser(req, "student");
  const classes = Object.values(db.data.classes).filter((c) => c.studentIds.includes(user.id));
  const parents = Object.values(db.data.users).filter((u) => u.role === "parent" && u.childIds.includes(user.id));
  const times = [...(user.activityLog || [])];
  for (const rec of Object.values((user.progress && user.progress.lessons) || {})) times.push(rec.updatedAt, rec.completedAt);
  for (const d of user.decisions || []) times.push(d.at);
  return {
    linkCode: user.linkCode, classes: classes.map(classInfo), parents: parents.map((p) => p.name),
    activity: times.filter(Boolean), joined: user.createdAt || null,
  };
});

route("POST", "/api/student/classes", async ({ req, body }) => {
  const user = requireUser(req, "student");
  const c = db.classByCode(str(body.code, 12).toUpperCase());
  if (!c) throw new HttpError(404, "No class has that code. Check it with your teacher.");
  if (!c.studentIds.includes(user.id)) c.studentIds.push(user.id);
  db.save();
  return { class: classInfo(c) };
});

route("DELETE", "/api/student/classes/([a-f0-9]+)", async ({ req, params }) => {
  const user = requireUser(req, "student");
  const c = db.data.classes[params[0]];
  if (c) c.studentIds = c.studentIds.filter((s) => s !== user.id);
  db.save();
  return { ok: true };
});

// --- parent ---

const childrenOf = (parent) => parent.childIds.map((id) => db.data.users[id]).filter(Boolean);

route("GET", "/api/parent/children", async ({ req }) => {
  const parent = requireUser(req, "parent");
  return { children: childrenOf(parent).map(progressSummary) };
});

route("POST", "/api/parent/children", async ({ req, body }) => {
  const parent = requireUser(req, "parent");
  const child = db.userByLinkCode(str(body.code, 12).toUpperCase());
  if (!child) throw new HttpError(404, "No student has that code. Ask your teen for the code on their dashboard.");
  if (!parent.childIds.includes(child.id)) parent.childIds.push(child.id);
  db.save();
  return { child: progressSummary(child) };
});

route("DELETE", "/api/parent/children/([a-f0-9]+)", async ({ req, params }) => {
  const parent = requireUser(req, "parent");
  parent.childIds = parent.childIds.filter((id) => id !== params[0]);
  db.save();
  return { ok: true };
});

// --- teacher ---

function classDetail(c) {
  const students = c.studentIds.map((id) => db.data.users[id]).filter(Boolean).map(progressSummary);
  const perLesson = curriculum.lessons.map((l, i) => ({
    id: l.id,
    title: l.title,
    complete: students.filter((s) => s.lessons[i].status === "complete").length,
  }));
  return { id: c.id, name: c.name, code: c.code, students, perLesson };
}

route("GET", "/api/teacher/classes", async ({ req }) => {
  const teacher = requireUser(req, "teacher");
  return { classes: Object.values(db.data.classes).filter((c) => c.teacherId === teacher.id).map(classDetail) };
});

route("POST", "/api/teacher/classes", async ({ req, body }) => {
  const teacher = requireUser(req, "teacher");
  const name = str(body.name, 80);
  if (!name) throw bad("Give the class a name.");
  const c = { id: db.id(), teacherId: teacher.id, name, code: db.newCode(), studentIds: [], createdAt: Date.now() };
  db.data.classes[c.id] = c;
  db.save();
  return { class: classDetail(c) };
});

route("DELETE", "/api/teacher/classes/([a-f0-9]+)", async ({ req, params }) => {
  const teacher = requireUser(req, "teacher");
  const c = db.data.classes[params[0]];
  if (c && c.teacherId === teacher.id) delete db.data.classes[c.id];
  db.save();
  return { ok: true };
});

route("DELETE", "/api/teacher/classes/([a-f0-9]+)/students/([a-f0-9]+)", async ({ req, params }) => {
  const teacher = requireUser(req, "teacher");
  const c = db.data.classes[params[0]];
  if (c && c.teacherId === teacher.id) c.studentIds = c.studentIds.filter((s) => s !== params[1]);
  db.save();
  return { ok: true };
});

// --- admin (site owner) ---

const lastActive = (u) => (u.role === "student" ? progressSummary(u).lastActive : null) || (u.activityLog || []).slice(-1)[0] || null;

route("POST", "/api/admin/logout", async ({ req }) => {
  const token = parseCookies(req)[ADMIN_COOKIE];
  if (token) delete db.data.sessions[sha(token)];
  db.save();
  return { ok: true, cookie: `${ADMIN_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0` };
});

route("GET", "/api/admin/overview", async ({ req }) => {
  requireAdmin(req);
  const users = Object.values(db.data.users);
  const now = Date.now();
  const students = users.filter((u) => u.role === "student");
  const byRole = { student: 0, parent: 0, teacher: 0 };
  users.forEach((u) => byRole[u.role]++);
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 86400000).toISOString().slice(0, 10);
    days.push({ day: d, count: users.filter((u) => u.createdAt && new Date(u.createdAt).toISOString().slice(0, 10) === d).length });
  }
  const sums = students.map(progressSummary);
  const decisions = students.flatMap((u) => u.decisions || []);
  return {
    totals: {
      users: users.length, ...byRole,
      verified: users.filter((u) => u.verified).length,
      google: users.filter((u) => u.googleId).length,
      classes: Object.keys(db.data.classes).length,
      new7: users.filter((u) => now - (u.createdAt || 0) < 7 * 86400000).length,
      new30: users.filter((u) => now - (u.createdAt || 0) < 30 * 86400000).length,
      active7: sums.filter((s) => s.lastActive && now - s.lastActive < 7 * 86400000).length,
      lessonsCompleted: sums.reduce((a, s) => a + s.completed, 0),
      decisions: decisions.length,
      avgScore: decisions.length ? Math.round(decisions.reduce((a, d) => a + d.score, 0) / decisions.length) : null,
    },
    signups: days,
    funnel: curriculum.lessons.map((l, i) => ({
      id: l.id, title: l.title,
      started: sums.filter((s) => s.lessons[i].status !== "not-started").length,
      completed: sums.filter((s) => s.lessons[i].status === "complete").length,
    })),
    recent: users.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 8)
      .map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt })),
    system: {
      uptimeSec: Math.round((now - STARTED) / 1000), node: process.version, baseUrl: BASE_URL,
      email: !!process.env.RESEND_API_KEY, google: !!GOOGLE_CLIENT_ID, marketData: !!process.env.ALPHA_VANTAGE_API_KEY,
      secureCookies: process.env.COOKIE_SECURE === "1",
    },
  };
});

route("GET", "/api/admin/users", async ({ req }) => {
  requireAdmin(req);
  const q = new URL(req.url, "http://x").searchParams;
  const term = (q.get("q") || "").toLowerCase().slice(0, 80);
  const role = q.get("role") || "";
  const list = Object.values(db.data.users)
    .filter((u) => (!role || u.role === role) && (!term || u.name.toLowerCase().includes(term) || u.email.includes(term)))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return {
    total: list.length,
    users: list.slice(0, 200).map((u) => ({
      id: u.id, name: u.name, email: u.email, role: u.role, verified: !!u.verified, google: !!u.googleId,
      createdAt: u.createdAt || null, lastActive: lastActive(u),
      completed: u.role === "student" ? progressSummary(u).completed : null,
    })),
  };
});

route("GET", "/api/admin/users/([a-f0-9]+)", async ({ req, params }) => {
  requireAdmin(req);
  const u = db.data.users[params[0]];
  if (!u) throw new HttpError(404, "No such user");
  const out = { id: u.id, name: u.name, email: u.email, role: u.role, verified: !!u.verified, google: !!u.googleId, createdAt: u.createdAt || null, plan: u.plan || null };
  if (u.role === "student") {
    out.progress = progressSummary(u);
    out.linkCode = u.linkCode;
    out.classes = Object.values(db.data.classes).filter((c) => c.studentIds.includes(u.id)).map((c) => c.name);
  }
  if (u.role === "parent") out.children = childrenOf(u).map((c) => c.name);
  if (u.role === "teacher") out.classes = Object.values(db.data.classes).filter((c) => c.teacherId === u.id).map((c) => c.name + " (" + c.studentIds.length + " students)");
  return out;
});

route("POST", "/api/admin/users/([a-f0-9]+)/verify", async ({ req, params }) => {
  requireAdmin(req);
  const u = db.data.users[params[0]];
  if (!u) throw new HttpError(404, "No such user");
  u.verified = true;
  db.save();
  return { ok: true };
});

// For support when email isn't set up: make a one-hour reset link to pass on yourself.
route("POST", "/api/admin/users/([a-f0-9]+)/reset-link", async ({ req, params }) => {
  requireAdmin(req);
  const u = db.data.users[params[0]];
  if (!u) throw new HttpError(404, "No such user");
  return { link: `${BASE_URL}/reset.html?token=${makeToken(u, "reset", 1)}` };
});

route("DELETE", "/api/admin/users/([a-f0-9]+)", async ({ req, params }) => {
  requireAdmin(req);
  const u = db.data.users[params[0]];
  if (!u) throw new HttpError(404, "No such user");
  removeUser(u);
  return { ok: true };
});

// Returns true if the request was an API request we handled.
async function handle(req, res, pathname) {
  if (!pathname.startsWith("/api/") || pathname === "/api/status" || pathname === "/api/quote" || pathname === "/api/chart") return false;
  try {
    for (const r of routes) {
      const m = r.method === req.method && pathname.match(r.re);
      if (!m) continue;
      const body = await readBody(req);
      const { cookie, ...out } = await r.handler({ req, res, body, params: m.slice(1) });
      send(res, 200, out, cookie ? { "Set-Cookie": cookie } : {});
      return true;
    }
    send(res, 404, { error: "Not found" });
  } catch (e) {
    if (!(e instanceof HttpError)) console.error(e);
    send(res, e.status || 500, { error: e.status ? e.message : "Something went wrong" });
  }
  return true;
}

module.exports = { handle };
