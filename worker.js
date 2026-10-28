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
    const res = await handle(request, { store, adminKey: env.ADMIN_KEY });
    if (res) return res;
    return env.ASSETS.fetch(request);
  },
};
