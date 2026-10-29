/* Mintly demo film: a pausable timeline of scenes. Each scene builds its own DOM and schedules
   events on a scene clock (ctx.at) or per-frame updates (ctx.frame). The clock only runs while playing,
   so pause, skip, jump and replay all just work. Nothing here touches real data or the saved role. */
(function () {
  const root = document.documentElement;
  const film = document.getElementById("film"), stage = document.getElementById("stage");
  const cursor = document.getElementById("cursor"), segsEl = document.getElementById("segs"), label = document.getElementById("label");
  const originalRole = root.dataset.role;
  const ease = (p) => 1 - Math.pow(1 - p, 3);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const art = (n) => (window.MintlyArt ? MintlyArt.render(n) : "");

  const words = (txt, t0, gap, cls) => txt.split(" ").map((w, i) => `<span class="word ${cls || ""}" style="animation-delay:${t0 + i * gap}ms">${w}</span>`).join(" ");

  function burst(n) {
    const acc = getComputedStyle(root).getPropertyValue("--acc").trim() || "#1C6847", cols = [acc, "#F5C65A", "#A8DDC0", "#F6B8A8", "#10241B"];
    for (let i = 0; i < (n || 70); i++) {
      const p = document.createElement("i"); p.className = "confetti-piece";
      p.style.left = Math.random() * 100 + "vw"; p.style.background = cols[i % cols.length];
      p.style.animationDuration = 1.6 + Math.random() * 1.3 + "s"; p.style.animationDelay = Math.random() * .3 + "s";
      document.body.appendChild(p); setTimeout(() => p.remove(), 3200);
    }
  }

  /* ------------------------------------------------------------------ scenes */
  const SCENES = [
    { id: "hook", label: "The problem", dur: 5000, cls: "s-dark center", role: "student", build(c) {
      c.html(`<div><h1 class="big"><span class="slam" style="animation-delay:.2s">Teens meet money</span><span class="slam" style="animation-delay:1.7s">long before</span><span class="slam" style="animation-delay:3.2s"><em>anyone teaches them.</em></span></h1></div>`);
    } },

    { id: "reveal", label: "Meet Mintly", dur: 3600, cls: "center", role: "student", build(c) {
      c.html(`<div><img class="pop" src="assets/logo.svg" alt="" style="width:clamp(90px,18vh,170px);animation-delay:.1s;animation-duration:.8s"><h1 class="big" style="margin-top:2vh">${words("mintly", 500, 0)}</h1><p class="sub" style="margin-inline:auto;max-width:none"><span class="word" style="animation-delay:1.3s">Learn how to <em style="font-family:var(--fh);color:var(--acc)">use</em> money.</span></p></div>`);
    } },

    { id: "learn", label: "Learn", dur: 7400, cls: "split2", role: "student", build(c) {
      c.html(`<div class="copy"><p class="kick">01 · Learn</p><h2 class="big">${words("Learn it in minutes.", 100, 160)}</h2><p class="sub">Short lessons with practice built in.</p></div>
        <div class="ui pop" style="animation-delay:.4s"><span class="cap">Lesson 2 · 10 min</span><h4 style="font:500 1.9em var(--fh);margin:.1em 0 0">Needs vs. wants</h4>
          <div class="prog"><i id="lp"></i></div><h4>A bus pass to get to school</h4>
          <div class="opt" id="o1">Need</div><div class="opt" id="o2">Want</div>
          <div id="done" style="margin-top:1.2em;min-height:2.6em"><span class="done-badge" id="db">✓ Lesson complete · +100 XP</span></div><span class="xpfloat" id="xp">+10 XP</span></div>`);
      c.at(500, () => { c.$("#lp").style.transform = "scaleX(.4)"; });
      c.at(2200, () => c.cursor("#o1", 0));
      c.at(3200, () => { c.click(); c.$("#o1").classList.add("ok"); c.$("#xp").classList.add("go"); c.$("#lp").style.transform = "scaleX(.75)"; });
      c.at(4800, () => { c.$("#lp").style.transform = "scaleX(1)"; });
      c.at(5300, () => { c.$("#db").classList.add("go"); burst(36); c.hideCursor(); });
    } },

    { id: "films", label: "Lesson films", dur: 6000, cls: "center", role: "student", build(c) {
      const T = [["book", "What is financial literacy?"], ["piggy", "Needs vs. wants"], ["target", "Saving for a goal"], ["bank", "How banks work"], ["chart", "Intro to investing"], ["card", "Credit and debt"], ["percent", "Compound interest"], ["wallet", "Paychecks and taxes"], ["alert", "Scams and safety"], ["plan", "Your money plan"]];
      c.html(`<div style="width:min(1060px,100%)"><p class="kick">Fifteen lessons</p><h2 class="mid">${words("Every lesson has a film.", 100, 110)}</h2>
        <div class="vgrid">${T.map((t, i) => `<div class="vtile" style="--d:${500 + i * 110}ms"><div class="art">${art(t[0])}</div><b>${t[1]}</b><span class="vplay"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 4.500v15l12-7.500Z"/></svg></span></div>`).join("")}</div></div>`);
    } },

    { id: "research", label: "Research", dur: 6600, cls: "split2", role: "student", build(c) {
      c.html(`<div class="copy"><p class="kick">02 · Research</p><h2 class="big">${words("Read both sides.", 100, 200)}</h2><p class="sub">Bulls and bears, side by side.</p></div>
        <div class="ui pop" style="animation-delay:.3s"><div style="display:flex;justify-content:space-between;align-items:baseline"><h4 style="margin:0">NVIDIA · NVDA</h4><span class="cap">Practice data</span></div>
          <svg class="spark" viewBox="0 0 300 70"><path pathLength="1" id="sp" stroke-dasharray="1" stroke-dashoffset="1" style="transition:stroke-dashoffset 2s var(--ease)" d="M2 58 L28 50 L52 54 L80 38 L108 42 L138 26 L166 32 L196 18 L226 24 L258 10 L298 14"/></svg>
          <div class="article pop" style="animation-delay:1.1s"><span class="pill good">Bullish</span> <span class="cap">MarketLine</span><p>Big cloud companies are spending record amounts on data centers. <span class="hl-mark" id="h1">NVIDIA supplies most of the chips.</span></p></div>
          <div class="article pop" style="animation-delay:2.3s;margin-bottom:0"><span class="pill warn">Bearish</span> <span class="cap">The Daily Ledger</span><p>Critics say <span class="hl-mark" id="h2">customers are spending far more than AI products currently earn.</span></p></div></div>`);
      c.at(400, () => { c.$("#sp").style.strokeDashoffset = 0; });
      c.at(3000, () => c.$("#h1").classList.add("go"));
      c.at(5000, () => c.$("#h2").classList.add("go"));
    } },

    { id: "leaf", label: "Meet Leaf", dur: 5000, cls: "split2", role: "student", build(c) {
      c.html(`<div class="copy"><p class="kick">03 · Ask Leaf</p><h2 class="big">${words("It asks.", 100, 200)}<br>${words("You think.", 700, 200, "")}</h2><p class="sub">Leaf never says buy or sell.</p></div>
        <div class="ui pop" style="animation-delay:.3s"><div style="display:flex;gap:.8em;align-items:center;padding-bottom:.9em;border-bottom:1px solid var(--border);margin-bottom:1em"><div class="art" style="width:2.8em">${art("leaf")}</div><div><b>Leaf</b><div class="cap">Reading 2 articles</div></div></div><div class="chat-log" id="log" style="min-height:15em"></div></div>`);
      const log = c.$("#log");
      const me = (t) => { const b = document.createElement("div"); b.className = "bubble me"; b.textContent = t; log.appendChild(b); };
      const leaf = (t) => { const b = document.createElement("div"); b.className = "bubble leaf typing"; b.innerHTML = "<i></i><i></i><i></i>"; log.appendChild(b); setTimeout(() => { b.className = "bubble leaf"; b.textContent = t; }, 900); };
      c.at(900, () => me("Everyone says buy NVIDIA."));
      c.at(2100, () => leaf("What would need to be true for it to keep growing?"));
      c.at(4400, () => me("The big customers keep spending."));
      c.at(5600, () => leaf("And if they slow down? Which article covers that?"));
      c.at(7800, () => me("The bearish one. Hm."));
    } },

    { id: "decide", label: "Decide", dur: 8200, cls: "split2", role: "student", build(c) {
      const txt = "I'd wait. Demand is strong, but the bearish article says spending may slow. I'll buy if earnings confirm it.";
      c.html(`<div class="copy"><p class="kick">04 · Decide</p><h2 class="big">${words("Make the call.", 100, 200)}</h2><p class="sub">Pick a side. Then say why.</p></div>
        <div class="ui pop" style="animation-delay:.3s"><h4>Your decision</h4><div class="choice"><span id="c1">Buy</span><span id="c2">Wait</span><span id="c3">Pass</span></div>
          <div style="display:flex;justify-content:space-between"><h4 style="margin:0">Confidence</h4><b id="cf">50%</b></div><div class="slider"><i id="si"></i><b id="sb" style="left:50%"></b></div>
          <h4>Why?</h4><div class="textarea caret" id="ta"></div>
          <div style="margin-top:1em;min-height:2em;display:flex;gap:.6em;flex-wrap:wrap"><span class="pill good pop" id="k1" style="animation:none">✓ Used evidence</span><span class="pill pop" id="k2" style="animation:none">✓ Named a risk</span></div></div>`);
      c.$("#k1").style.visibility = c.$("#k2").style.visibility = "hidden";
      c.at(1800, () => c.cursor("#c2", 0));
      c.at(2700, () => { c.click(); c.$("#c2").classList.add("sel"); });
      c.at(3300, () => { c.hideCursor(); c.$("#si").style.transform = "scaleX(.64)"; c.$("#sb").style.transform = "translateX(" + c.$(".slider").clientWidth * .14 + "px)"; });
      let lastCf; c.frame((st) => { const v = Math.round(50 + 14 * ease(clamp((st - 3300) / 1200, 0, 1))); if (v !== lastCf) { lastCf = v; c.$("#cf").textContent = v + "%"; } });
      c.type("#ta", txt, 4000, 34);
      c.at(7600, () => { const k = c.$("#k1"); k.style.visibility = "visible"; k.style.animation = ""; });
      c.at(8300, () => { const k = c.$("#k2"); k.style.visibility = "visible"; k.style.animation = ""; });
    } },

    { id: "score", label: "Score", dur: 6600, cls: "split2", role: "student", build(c) {
      const rows = [["Research", 88], ["Evidence", 80], ["Risk", 76], ["Reasoning", 90]];
      c.html(`<div class="copy"><p class="kick">05 · Score</p><h2 class="big">${words("Scored on", 100, 180)} <em>${words("how you think.", 640, 180)}</em></h2><p class="sub">Not just whether the price went up.</p></div>
        <div class="ui pop" style="animation-delay:.3s"><h4 style="text-align:center">Decision Score</h4><div class="gauge-big"><svg viewBox="0 0 220 124"><path class="g-track" d="M20 110A90 90 0 0 1 200 110" pathLength="100"/><path class="g-fill" id="gf" d="M20 110A90 90 0 0 1 200 110" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/></svg><div class="num" id="gn">0</div></div>
          <div style="margin-top:1.4em">${rows.map((r, i) => `<div class="skillrow"><span>${r[0]}</span><span class="b"><i data-v="${r[1]}"></i></span><b>${r[1]}</b></div>`).join("")}</div>
          <div class="badge-pop" id="bp"><i>S</i><span>Sharp Thinker<br><span class="cap" style="color:inherit;opacity:.7">Badge earned</span></span></div></div>`);
      let lastG = -1; c.frame((st) => { const v = Math.round(84 * ease(clamp((st - 900) / 2200, 0, 1))); if (v !== lastG) { lastG = v; c.$("#gn").textContent = v; c.$("#gf").style.strokeDashoffset = 100 - v; } });
      c.at(1500, () => c.$$("[data-v]").forEach((e) => (e.style.transform = "scaleX(" + e.dataset.v / 100 + ")")));
      c.at(4300, () => { c.$("#bp").classList.add("go"); burst(28); });
    } },

    { id: "student", label: "Students", dur: 5800, cls: "center", role: "student", build(c) {
      c.html(`<div style="width:min(1000px,100%)"><p class="kick">Students</p><h2 class="mid">${words("Momentum, every day.", 100, 150)}</h2>
        <div class="dash-mini" style="margin-top:3vh;text-align:left">
          <div class="card c2"><div class="cap">Level</div><div style="display:flex;align-items:center;gap:.8em"><div class="ring"><svg viewBox="0 0 132 132"><circle class="t" cx="66" cy="66" r="54"/><circle class="f" id="rf" cx="66" cy="66" r="54" stroke-dasharray="339.3" stroke-dashoffset="339.3"/></svg><div class="v"><div>4</div></div></div><div><b>620 XP</b><div class="cap">80 to level 5</div></div></div></div>
          <div class="card c2"><div class="cap">Day streak</div><div class="stat-big" id="st">0</div><div class="cap">Keep it going</div></div>
          <div class="card c2"><div class="cap">Decision Score</div><div class="stat-big">84</div><div class="delta up">▲ 6 this week</div></div>
          <div class="card c4"><div class="cap">This week</div><div class="week-bars" id="wb"></div></div>
          <div class="card c2"><div class="cap">Today's goals</div><div style="margin-top:.6em;display:grid;gap:.5em"><span class="pill good">✓ Lesson done</span><span class="pill good">✓ Quiz 4/4</span><span class="pill mute">Ask Leaf</span></div></div></div></div>`);
      c.$("#wb").innerHTML = [30, 55, 42, 70, 62, 48, 84].map((h) => `<i data-h="${h}"></i>`).join("");
      c.$$(".dash-mini .card").forEach((e, i) => c.at(500 + i * 350, () => e.classList.add("go")));
      c.at(900, () => { c.$("#rf").style.transition = "stroke-dashoffset 1.4s var(--ease)"; c.$("#rf").style.strokeDashoffset = 339.3 * .28; });
      c.at(1400, () => c.$$("#wb i").forEach((e) => (e.style.transform = "scaleY(" + e.dataset.h / 100 + ")")));
      let lastS = -1; c.frame((st) => { const v = Math.round(12 * ease(clamp((st - 1000) / 1200, 0, 1))); if (v !== lastS) { lastS = v; c.$("#st").textContent = v; } });
    } },

    { id: "parent", label: "Parents", dur: 5800, cls: "center", role: "parent", build(c) {
      c.html(`<div style="width:min(1000px,100%)"><p class="kick">Parents</p><h2 class="mid">${words("Clarity, not surveillance.", 100, 150)}</h2>
        <div class="dash-mini" style="margin-top:3vh;text-align:left">
          <div class="card c4"><div class="cap">Maya's week</div><div class="week-bars" id="wb"></div><div class="week-labels">${"MTWTFSS".split("").map((d) => `<span>${d}</span>`).join("")}</div></div>
          <div class="card c2"><div class="cap">Reasoning score</div><div class="stat-big">82</div><div class="delta up">▲ 4 this week</div><div class="chip-row"><span class="pill good">Read both sides</span></div></div>
          <div class="card c3"><div class="cap">Ask tonight</div><p class="quote" style="font-size:1.3em;margin:.4em 0 0">“What would make you wait?”</p></div>
          <div class="card c3"><div class="cap">Ready for real money?</div><div style="margin-top:.7em"><div class="skillrow" style="grid-template-columns:1fr"><span class="b"><i data-v="62"></i></span></div><div class="cap" style="margin-top:.6em">Not yet. That's normal.</div></div></div></div></div>`);
      c.$("#wb").innerHTML = [34, 52, 44, 66, 58, 40, 72].map((h) => `<i data-h="${h}"></i>`).join("");
      c.$$(".dash-mini .card").forEach((e, i) => c.at(500 + i * 380, () => e.classList.add("go")));
      c.at(1300, () => { c.$$("#wb i").forEach((e) => (e.style.transform = "scaleY(" + e.dataset.h / 100 + ")")); c.$$("[data-v]").forEach((e) => (e.style.transform = "scaleX(" + e.dataset.v / 100 + ")")); });
    } },

    { id: "teacher", label: "Teachers", dur: 5000, cls: "center", role: "teacher", build(c) {
      const R = [["Ava T.", 91], ["Noah O.", 84], ["Liam P.", 72], ["Isla R.", 48]];
      c.html(`<div style="width:min(1000px,100%)"><p class="kick">Teachers</p><h2 class="mid">${words("A whole class, in view.", 100, 150)}</h2>
        <div class="dash-mini" style="margin-top:3vh;text-align:left">
          <div class="card c4"><div class="cap">Roster · Period 3</div>${R.map((r) => `<div class="rrow"><span class="avatar">${r[0][0]}</span><b>${r[0]}</b><span class="bar2"><i data-v="${r[1]}" style="${r[1] < 60 ? "background:var(--bad)" : ""}"></i></span><b>${r[1]}</b></div>`).join("")}</div>
          <div class="card c2"><div class="cap">Class average</div><div class="stat-big">72</div><div class="delta up">▲ 5 this month</div><div class="chip-row"><span class="pill warn">3 need support</span></div></div>
          <div class="card c6" style="display:flex;justify-content:space-between;align-items:center;gap:1em;flex-wrap:wrap"><div><div class="cap">Class insight</div><p class="quote" style="font-size:1.3em;margin:.3em 0 0">“Risk is the weakest skill. Try a risk-first warm-up.”</p></div><span class="btn-demo" id="ab">Assign a risk lesson</span></div></div>
          <div class="toast-demo" id="td">Assigned to all 12 students</div></div>`);
      c.$$(".dash-mini .card").forEach((e, i) => c.at(500 + i * 400, () => e.classList.add("go")));
      c.at(1300, () => c.$$("[data-v]").forEach((e) => (e.style.transform = "scaleX(" + e.dataset.v / 100 + ")")));
      c.at(3800, () => c.cursor("#ab", 0));
      c.at(4900, () => { c.click(); c.$("#ab").classList.add("press"); setTimeout(() => c.$("#ab") && c.$("#ab").classList.remove("press"), 160); c.$("#td").classList.add("go"); });
      c.at(6200, () => c.hideCursor());
    } },

    { id: "safe", label: "Safe by design", dur: 5000, cls: "s-dark center", role: "student", build(c) {
      c.html(`<div><div class="art pop" style="width:clamp(90px,16vh,160px);margin:0 auto 3vh;animation-delay:.1s">${art("shield")}</div><h2 class="big"><span class="slam" style="animation-delay:.4s">No real money.</span><span class="slam" style="animation-delay:1.8s"><em>Ever.</em></span></h2><p class="sub pop" style="margin-inline:auto;animation-delay:3.2s">Until you both decide it's time.</p></div>`);
    } },

    { id: "end", label: "Start now", dur: 600000, cls: "center", role: "student", build(c) {
      c.html(`<div><img class="pop" src="assets/logo.svg" alt="" style="width:clamp(80px,15vh,140px);animation-delay:.1s"><h1 class="big" style="margin-top:2vh">${words("Learn how to", 300, 140)} <em>${words("use money.", 760, 140)}</em></h1>
        <div class="end-actions"><a class="btn btn-lg" href="signin.html">Create an account</a><a class="btn btn-secondary btn-lg" href="simulation.html">Try it yourself</a><button class="btn btn-ghost btn-lg" id="again" type="button">Replay</button><a class="btn btn-ghost btn-lg" href="index.html">Back to site</a></div></div>`);
      c.$("#again").addEventListener("click", () => goTo(0));
      c.at(1200, () => burst(26));
    } }
  ];

  /* ------------------------------------------------------------------ engine */
  const SPEED = 1.4; // the whole film runs this much faster than its authored timings
  const scaled = new WeakSet();
  let idx = -1, st = 0, state = "idle", last = 0, ctx = null, curEl = null, speedT = 0;
  const wipe = document.getElementById("wipe");
  function speedUp() { document.getAnimations().forEach((a) => { if (!scaled.has(a)) { scaled.add(a); try { a.playbackRate = SPEED; } catch (e) {} } }); }

  function makeCtx(el) {
    const events = [], frames = [];
    const c = {
      el, events, frames, fired: 0,
      $: (s) => el.querySelector(s), $$: (s) => Array.from(el.querySelectorAll(s)),
      html: (h) => { el.innerHTML = h; },
      at: (ms, fn) => events.push({ ms, fn, done: false }),
      frame: (fn) => frames.push(fn),
      type: (sel, text, start, cps) => { const e = el.querySelector(sel); let ln = -1; frames.push((t) => { const n = clamp(Math.floor((t - start) / 1000 * cps), 0, text.length); if (n !== ln && e) { ln = n; e.textContent = text.slice(0, n); } }); },
      cursor: (sel, delay) => {
        const t = el.querySelector(sel); if (!t) return;
        const r = t.getBoundingClientRect(), f = film.getBoundingClientRect();
        cursor.classList.add("on");
        cursor.style.transform = `translate(${r.left - f.left + r.width * .55}px, ${r.top - f.top + r.height * .5}px)`;
      },
      click: () => { cursor.classList.remove("click"); void cursor.offsetWidth; cursor.classList.add("click"); },
      hideCursor: () => cursor.classList.remove("on")
    };
    return c;
  }

  function enter(i, fastTo) {
    i = clamp(i, 0, SCENES.length - 1);
    const S = SCENES[i];
    if (curEl && wipe && !fastTo) { wipe.classList.remove("go"); void wipe.offsetWidth; wipe.classList.add("go"); }
    if (curEl) { const old = curEl; old.classList.remove("on"); old.classList.add("off"); setTimeout(() => old.remove(), 420); }
    cursor.classList.remove("on"); cursor.style.transition = "none"; cursor.style.transform = "translate(-60px, 70vh)"; void cursor.offsetWidth; cursor.style.transition = "";
    const el = document.createElement("section");
    el.className = "scene on " + S.cls; el.setAttribute("aria-label", S.label);
    stage.appendChild(el); curEl = el; idx = i; st = 0;
    if (S.role) root.dataset.role = S.role;
    ctx = makeCtx(el); S.build(ctx);
    label.textContent = (i + 1) + " / " + SCENES.length + " · " + S.label;
    if (fastTo) { st = fastTo; run(0); }
    segs();
  }

  function run() {
    ctx.events.forEach((e) => { if (!e.done && e.ms <= st) { e.done = true; try { e.fn(); } catch (err) { console.error(err); } } });
    ctx.frames.forEach((f) => f(st));
  }

  function segs() {
    segsEl.querySelectorAll("button").forEach((b, i) => {
      const p = i < idx ? 100 : i === idx ? Math.min(100, st / Math.min(SCENES[i].dur, i === SCENES.length - 1 ? 1 : SCENES[i].dur) * 100) : 0;
      b.style.setProperty("--p", p + "%");
    });
  }

  function loop(ts) {
    const dt = Math.min(64, ts - last); last = ts;
    if (state === "playing" && ctx) {
      st += dt * SPEED; run();
      if (ts - speedT > 80) { speedT = ts; speedUp(); }
      if (st >= SCENES[idx].dur && idx < SCENES.length - 1) enter(idx + 1);
      segs();
    }
    requestAnimationFrame(loop);
  }

  function setState(s) { state = s; film.dataset.state = s; film.classList.toggle("paused", s === "paused"); document.getElementById("b-play").setAttribute("aria-label", s === "paused" ? "Play" : "Pause"); }
  function goTo(i, ms) { if (state === "idle" || state === "done") setState("playing"); enter(i, ms); }
  function start() { setState("playing"); enter(0); }
  function toggle() { if (state === "playing") setState("paused"); else if (state === "paused") setState("playing"); }

  // build segment buttons
  SCENES.forEach((S, i) => { const b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", "Go to " + S.label); b.title = S.label; b.addEventListener("click", () => goTo(i)); segsEl.appendChild(b); });
  document.getElementById("start").addEventListener("click", start);
  document.getElementById("b-play").addEventListener("click", toggle);
  document.getElementById("b-next").addEventListener("click", () => goTo(idx + 1));
  document.getElementById("b-prev").addEventListener("click", () => goTo(st > 1500 ? idx : idx - 1));
  document.getElementById("b-replay").addEventListener("click", () => goTo(0));

  addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest("a, button") && (e.key === " " || e.key === "Enter")) return;
    if (e.key === " " || e.key === "k") { e.preventDefault(); if (state === "idle") start(); else toggle(); }
    else if (e.key === "Enter" && state === "idle") start();
    else if (e.key === "ArrowRight" && state !== "idle") goTo(idx + 1);
    else if (e.key === "ArrowLeft" && state !== "idle") goTo(idx - 1);
    else if (e.key === "r" || e.key === "R") goTo(0);
    else if (e.key === "Escape") location.href = "index.html";
  });

  // controls fade after a moment of stillness while playing
  let hideT; const poke = () => { film.classList.remove("hide-ui"); clearTimeout(hideT); hideT = setTimeout(() => { if (state === "playing") film.classList.add("hide-ui"); }, 2600); };
  ["mousemove", "pointerdown", "touchstart", "keydown"].forEach((ev) => addEventListener(ev, poke, { passive: true }));
  poke();

  // leave the visitor's own colour choice exactly as it was
  addEventListener("pagehide", () => { if (originalRole) root.dataset.role = originalRole; });
  document.addEventListener("visibilitychange", () => { if (document.hidden && state === "playing") setState("paused"); });

  // the idle backdrop shows the first scene's title, blurred, behind the Start button
  enter(0); setState("idle"); st = 0;
  requestAnimationFrame((t) => { last = t; requestAnimationFrame(loop); });
  window.__demo = { goTo, SCENES, get state() { return state; }, pause: () => setState("paused"), play: () => setState("playing") };
})();
