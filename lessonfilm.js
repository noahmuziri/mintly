/* Mintly lesson films: short animated explainers, one per lesson, built from plain data (films-data.js).
   MintlyFilm.mount(el, spec) turns an empty element into a player: poster, play/pause, scene scrubber,
   fullscreen. Scenes run on a pausable clock and animate with transforms only, so they stay smooth.
   Scene types: title, points, compare, steps, calc, chart, split, stat, flags, quiz, outro. */
(function () {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (p) => 1 - Math.pow(1 - p, 3);
  const SPEED = 1.1;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const words = (t, t0, gap) => esc(t).split(" ").map((w, i) => `<span class="lf-w" style="animation-delay:${t0 + i * gap}ms">${w}</span>`).join(" ");
  const head = (s, delay) => `<p class="lf-k">${esc(s.kicker || "")}</p><h3 class="lf-big">${words(s.big || "", delay || 100, 90)}</h3>`;
  const art = (n) => (window.MintlyArt ? MintlyArt.render(n) : "");

  /* each renderer returns { html, dur, run(ctx) } */
  const R = {
    title: (s) => ({ dur: 3600, html: `<div class="lf-c">${s.art ? `<div class="lf-art lf-pop">${art(s.art)}</div>` : ""}${head(s)}${s.sub ? `<p class="lf-sub lf-pop" style="animation-delay:${400 + (s.big || "").split(" ").length * 90}ms">${esc(s.sub)}</p>` : ""}</div>` }),

    points: (s) => ({ dur: 2200 + s.items.length * 750, html: `<div class="lf-split"><div class="lf-copy">${head(s)}</div><ol class="lf-list${s.items.length > 4 ? " many" : ""}">${s.items.map((it, i) => { const o = typeof it === "string" ? { h: it } : it; return `<li class="lf-it"><b>${i + 1}</b><div><strong>${esc(o.h)}</strong>${o.p ? `<span>${esc(o.p)}</span>` : ""}</div></li>`; }).join("")}</ol></div>`,
      run(c) { c.$$(".lf-it").forEach((e, i) => c.at(700 + i * 650, () => e.classList.add("go"))); } }),

    compare: (s) => ({ dur: 2600 + Math.max(s.left.items.length, s.right.items.length) * 1000, html: `<div class="lf-c lf-wide">${head(s)}<div class="lf-two"><div class="lf-col good"><h4>${esc(s.left.h)}</h4>${s.left.items.map((t) => `<p class="lf-it">${esc(t)}</p>`).join("")}</div><div class="lf-col bad"><h4>${esc(s.right.h)}</h4>${s.right.items.map((t) => `<p class="lf-it">${esc(t)}</p>`).join("")}</div></div></div>`,
      run(c) { const L = c.$$(".lf-col.good .lf-it"), Rr = c.$$(".lf-col.bad .lf-it"); L.forEach((e, i) => c.at(900 + i * 1000, () => e.classList.add("go"))); Rr.forEach((e, i) => c.at(1400 + i * 1000, () => e.classList.add("go"))); c.at(500, () => c.$$(".lf-col").forEach((e) => e.classList.add("go"))); } }),

    steps: (s) => ({ dur: 2400 + s.items.length * 900, html: `<div class="lf-c lf-wide">${head(s)}<div class="lf-steps" style="--n:${s.items.length}"><i class="lf-line"></i>${s.items.map((t, i) => { const o = typeof t === "string" ? { h: t } : t; return `<div class="lf-step"><b>${i + 1}</b><strong>${esc(o.h)}</strong>${o.p ? `<span>${esc(o.p)}</span>` : ""}</div>`; }).join("")}</div></div>`,
      run(c) { c.at(700, () => c.$(".lf-line").style.transform = "scaleX(1)"); c.$$(".lf-step").forEach((e, i) => c.at(800 + i * (s.items.length > 3 ? 700 : 850), () => e.classList.add("go"))); } }),

    calc: (s) => ({ dur: 2400 + s.tokens.length * 650, html: `<div class="lf-c">${head(s)}<div class="lf-calc">${s.tokens.map((t) => `<div class="lf-tok${t.hl ? " hl" : ""}${t.c ? "" : " op"}"><b>${esc(t.t)}</b>${t.c ? `<span>${esc(t.c)}</span>` : ""}</div>`).join("")}</div>${s.note ? `<p class="lf-sub lf-note">${esc(s.note)}</p>` : ""}</div>`,
      run(c) { c.$$(".lf-tok").forEach((e, i) => c.at(900 + i * 650, () => e.classList.add("go"))); const n = c.$(".lf-note"); if (n) c.at(1100 + s.tokens.length * 650, () => n.classList.add("go")); } }),

    chart: (s) => {
      const W = 600, H = 260, pad = 16, all = s.series.flatMap((x) => x.v), mx = Math.max(...all), mn = Math.min(0, ...all);
      const pt = (v, i, n) => [pad + (i / (n - 1)) * (W - pad * 2), H - 30 - ((v - mn) / (mx - mn || 1)) * (H - 60)];
      const paths = s.series.map((x) => { const p = x.v.map((v, i) => pt(v, i, x.v.length)); return { d: p.map((q, i) => (i ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1)).join(" "), end: p[p.length - 1], x }; });
      return { dur: 4600, html: `<div class="lf-split"><div class="lf-copy">${head(s)}${s.sub ? `<p class="lf-sub">${esc(s.sub)}</p>` : ""}</div><div class="lf-panel"><svg viewBox="0 0 ${W} ${H}" class="lf-chart"><path class="lf-axis" d="M${pad} ${H - 30}H${W - pad}"/>${paths.map((p, i) => `<path class="lf-ln s${i}" d="${p.d}" pathLength="1"/>`).join("")}${paths.map((p, i) => `<circle class="lf-dot s${i}" cx="${p.end[0]}" cy="${p.end[1]}" r="7"/><text class="lf-lbl s${i}" x="${p.end[0] - 10}" y="${p.end[1] - 14}" text-anchor="end">${esc(p.x.end || "")}</text>`).join("")}<text class="lf-ax" x="${pad}" y="${H - 8}">${esc(s.x0 || "")}</text><text class="lf-ax" x="${W - pad}" y="${H - 8}" text-anchor="end">${esc(s.x1 || "")}</text></svg><div class="lf-legend">${s.series.map((x, i) => `<span><i class="s${i}"></i>${esc(x.name)}</span>`).join("")}</div></div></div>`,
        run(c) { c.$$(".lf-ln").forEach((e, i) => c.at(600 + i * 400, () => e.classList.add("go"))); c.at(2400, () => c.$$(".lf-dot,.lf-lbl").forEach((e) => e.classList.add("go"))); } };
    },

    split: (s) => ({ dur: 2800 + s.parts.length * 800, html: `<div class="lf-c lf-wide">${head(s)}<div class="lf-bar2">${s.parts.map((p, i) => `<div class="lf-seg p${i}" style="flex:${p[1]}"><i></i><b>${p[1]}%</b></div>`).join("")}</div><div class="lf-keys">${s.parts.map((p, i) => `<div class="lf-key p${i}"><b>${esc(p[0])}</b><span>${esc(p[2] || "")}</span></div>`).join("")}</div></div>`,
      run(c) { c.$$(".lf-seg").forEach((e, i) => c.at(800 + i * 800, () => e.classList.add("go"))); c.$$(".lf-key").forEach((e, i) => c.at(1000 + i * 800, () => e.classList.add("go"))); } }),

    stat: (s) => ({ dur: 3800, html: `<div class="lf-c">${s.kicker ? `<p class="lf-k">${esc(s.kicker)}</p>` : ""}<div class="lf-stat"><span class="n" data-n="${s.n}" data-pre="${esc(s.pre || "")}" data-suf="${esc(s.suf || "")}">${esc(s.pre || "")}0${esc(s.suf || "")}</span></div><p class="lf-sub lf-pop" style="animation-delay:1.6s">${esc(s.caption)}</p></div>`,
      run(c) { const e = c.$(".n"); let last = -1; c.frame((t) => { const v = Math.round(s.n * ease(clamp((t - 500) / 1800, 0, 1))); if (v !== last) { last = v; e.textContent = (s.pre || "") + v.toLocaleString("en-US") + (s.suf || ""); } }); } }),

    flags: (s) => ({ dur: 2400 + s.items.length * 800, html: `<div class="lf-split"><div class="lf-copy">${head(s)}</div><ul class="lf-flags${s.items.length > 4 ? " many" : ""}">${s.items.map((t) => `<li class="lf-it"><i>!</i>${esc(t)}</li>`).join("")}</ul></div>`,
      run(c) { c.$$(".lf-it").forEach((e, i) => c.at(800 + i * 800, () => e.classList.add("go"))); } }),

    quiz: (s) => ({ dur: 5600, html: `<div class="lf-c lf-wide"><p class="lf-k">${esc(s.kicker || "Quick check")}</p><h3 class="lf-big lf-q">${words(s.q, 100, 60)}</h3><div class="lf-opts">${s.opts.map((o, i) => `<div class="lf-opt" data-i="${i}"><b>${"ABCD"[i]}</b>${esc(o)}</div>`).join("")}</div><p class="lf-sub lf-note">${esc(s.why || "")}</p></div>`,
      run(c) { c.$$(".lf-opt").forEach((e, i) => c.at(900 + i * 350, () => e.classList.add("go"))); c.at(3300, () => { c.$$(".lf-opt").forEach((e) => e.classList.add(+e.dataset.i === s.a ? "ok" : "dim")); const n = c.$(".lf-note"); if (n) n.classList.add("go"); }); } }),

    outro: (s) => ({ dur: 3600, html: `<div class="lf-c">${head(s)}${s.sub ? `<p class="lf-sub lf-pop" style="animation-delay:.9s">${esc(s.sub)}</p>` : ""}</div>` })
  };

  const fmt = (ms) => { const s = Math.round(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

  function mount(host, spec) {
    host.classList.add("lf");
    const scenes = spec.scenes.map((s) => Object.assign({ tone: "light" }, s));
    const rendered = scenes.map((s) => R[s.type](s));
    const total = rendered.reduce((a, r) => a + r.dur, 0) / SPEED;
    host.innerHTML = `<div class="lf-stage"></div><div class="lf-wipe"></div>
      <button class="lf-poster" type="button" aria-label="Play video: ${esc(spec.title)}"><div class="lf-art">${art(spec.art || "book")}</div><span class="lf-ptag">Video · ${fmt(total)}</span><strong>${esc(spec.title)}</strong><span class="lf-playbtn" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 4.5v15l12-7.5Z"/></svg></span></button>
      <div class="lf-ctl"><button type="button" class="lf-b" data-a="play" aria-label="Pause"><svg class="ip" viewBox="0 0 24 24" fill="currentColor"><path d="M8 4.5v15l12-7.500Z"/></svg><svg class="iz" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"><path d="M8 5v14M16 5v14"/></svg></button><div class="lf-segs"></div><span class="lf-time">0:00</span><button type="button" class="lf-b" data-a="replay" aria-label="Replay"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 4v5h5"/></svg></button><button type="button" class="lf-b" data-a="full" aria-label="Fullscreen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button></div>`;
    host.dataset.state = "idle";
    const stage = host.querySelector(".lf-stage"), wipe = host.querySelector(".lf-wipe"), segsEl = host.querySelector(".lf-segs"), timeEl = host.querySelector(".lf-time"), playB = host.querySelector('[data-a="play"]');
    let idx = -1, st = 0, state = "idle", last = 0, cur = null, ctx = null, elapsedBefore = 0, visible = true;
    const scaled = new WeakSet();
    scenes.forEach((s, i) => { const b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", "Scene " + (i + 1)); b.addEventListener("click", () => goTo(i)); segsEl.appendChild(b); });

    function makeCtx(el) {
      const events = [], frames = [];
      return { events, frames, $: (q) => el.querySelector(q), $$: (q) => Array.from(el.querySelectorAll(q)), at: (ms, fn) => events.push({ ms, fn, done: false }), frame: (fn) => frames.push(fn) };
    }
    function enter(i) {
      i = clamp(i, 0, scenes.length - 1);
      if (cur) { const old = cur; old.classList.add("off"); setTimeout(() => old.remove(), 380); wipe.classList.remove("go"); void wipe.offsetWidth; wipe.classList.add("go"); }
      const el = document.createElement("section");
      el.className = "lf-scene on tone-" + scenes[i].tone; stage.appendChild(el); cur = el; idx = i; st = 0;
      const r = rendered[i]; el.innerHTML = r.html; ctx = makeCtx(el); if (r.run) r.run(ctx);
      elapsedBefore = rendered.slice(0, i).reduce((a, x) => a + x.dur, 0);
      segsEl.querySelectorAll("button").forEach((b, k) => b.style.setProperty("--p", k < i ? "100%" : "0%"));
    }
    function setState(s) { state = s; host.dataset.state = s; playB.setAttribute("aria-label", s === "playing" ? "Pause" : "Play"); }
    function goTo(i) { if (state === "idle" || state === "done") { setState("playing"); } enter(i); if (state === "paused") setState("playing"); }
    function toggle() { if (state === "playing") setState("paused"); else if (state === "paused") setState("playing"); else if (state === "idle" || state === "done") { setState("playing"); enter(0); } }
    function tick(ts) {
      const dt = Math.min(64, ts - last); last = ts;
      if (state === "playing" && ctx && visible) {
        st += dt * SPEED;
        ctx.events.forEach((e) => { if (!e.done && e.ms <= st) { e.done = true; e.fn(); } });
        ctx.frames.forEach((f) => f(st));
        if (Math.round(ts / 90) !== tick.k) { tick.k = Math.round(ts / 90); document.getAnimations({ subtree: true }).forEach((a) => { if (!scaled.has(a) && a.effect && a.effect.target && host.contains(a.effect.target)) { scaled.add(a); try { a.playbackRate = SPEED; } catch (e) {} } }); }
        const dur = rendered[idx].dur, p = clamp(st / dur, 0, 1);
        const b = segsEl.children[idx]; if (b) b.style.setProperty("--p", p * 100 + "%");
        timeEl.textContent = fmt((elapsedBefore + Math.min(st, dur)) / SPEED);
        if (st >= dur) { if (idx < scenes.length - 1) enter(idx + 1); else { setState("done"); } }
      }
      requestAnimationFrame(tick);
    }
    host.querySelector(".lf-poster").addEventListener("click", () => { setState("playing"); enter(0); host.dispatchEvent(new CustomEvent("lf:play", { bubbles: true })); });
    host.querySelector(".lf-ctl").addEventListener("click", (e) => {
      const b = e.target.closest("[data-a]"); if (!b) return;
      const a = b.dataset.a;
      if (a === "play") toggle(); else if (a === "replay") { setState("playing"); enter(0); }
      else if (a === "full") { if (document.fullscreenElement) document.exitFullscreen(); else if (host.requestFullscreen) host.requestFullscreen(); }
    });
    host.addEventListener("click", (e) => { if (e.target.closest(".lf-ctl, .lf-poster")) return; if (state === "playing" || state === "paused") toggle(); });
    host.tabIndex = 0;
    host.addEventListener("keydown", (e) => { if (e.key === " ") { e.preventDefault(); toggle(); } else if (e.key === "ArrowRight" && idx >= 0) goTo(idx + 1); else if (e.key === "ArrowLeft" && idx >= 0) goTo(idx - 1); });
    document.addEventListener("visibilitychange", () => { if (document.hidden && state === "playing") setState("paused"); });
    if ("IntersectionObserver" in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (!visible && state === "playing") setState("paused"); }).observe(host);
    requestAnimationFrame((t) => { last = t; requestAnimationFrame(tick); });
    const api = { play: () => { setState("playing"); enter(0); }, goTo, get state() { return state; }, scenes };
    host.__film = api;
    return api;
  }

  window.MintlyFilm = { mount, TYPES: Object.keys(R) };
})();
