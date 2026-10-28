// Cloudflare Worker: serves the static site and the analytics API (/api/*), backed by a D1 database.
// Setup is in BACKEND.md. Secrets: ADMIN_KEY (npx wrangler secret put ADMIN_KEY -c wrangler.backend.jsonc).
import { handle } from "./api-core.mjs";

export default {
  async fetch(request, env) {
    const store = {
      async insert(rows) {
        const stmt = env.DB.prepare("INSERT INTO events (ts, uid, role, plan, type, key, value) VALUES (?, ?, ?, ?, ?, ?, ?)");
        await env.DB.batch(rows.map((r) => stmt.bind(r.ts, r.uid, r.role, r.plan, r.type, r.key, r.value)));
      },
      async since(ts, limit) {
        const { results } = await env.DB.prepare("SELECT ts, uid, role, plan, type, key, value FROM events WHERE ts >= ? ORDER BY ts DESC LIMIT ?").bind(ts, limit).all();
        return results;
      },
    };
    const db = env.DB, one = async (sql, ...a) => (await db.prepare(sql).bind(...a).first()) || null;
    Object.assign(store, {
      getUser: (email) => one("SELECT * FROM users WHERE email = ?", email),
      async putUser(u) { await db.prepare("INSERT INTO users (email, name, role, plan, salt, hash, created) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET name=excluded.name, role=excluded.role, plan=excluded.plan").bind(u.email, u.name, u.role, u.plan, u.salt, u.hash, u.created).run(); },
      async deleteUser(email) { await db.batch([db.prepare("DELETE FROM sessions WHERE email = ?").bind(email), db.prepare("DELETE FROM userdata WHERE email = ?").bind(email), db.prepare("DELETE FROM users WHERE email = ?").bind(email)]); },
      async putSession(h, email, exp) { await db.prepare("INSERT INTO sessions (token_hash, email, exp) VALUES (?, ?, ?)").bind(h, email, exp).run(); },
      getSession: (h) => one("SELECT email, exp FROM sessions WHERE token_hash = ?", h),
      async delSession(h) { await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(h).run(); },
      async getData(email) { const r = await one("SELECT json FROM userdata WHERE email = ?", email); return r ? JSON.parse(r.json) : null; },
      async putData(email, obj, now) { await db.prepare("INSERT INTO userdata (email, json, updated) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET json=excluded.json, updated=excluded.updated").bind(email, JSON.stringify(obj), now).run(); },
      async listUsers() { return (await db.prepare("SELECT email, name, role, plan, created FROM users ORDER BY created DESC LIMIT 1000").all()).results; },
    });
    const res = await handle(request, { store, adminKey: env.ADMIN_KEY, selfPlan: env.PLAN_SELF_SERVICE !== "0" });
    if (res) return res;
    return env.ASSETS.fetch(request);
  },
};
