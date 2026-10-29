/* Homepage only (index.html): the role switch, the live Decision Score, lesson tiles and Leaf's chat.
   Switching role re-colours the whole page (theme.js sets <html data-role>) and swaps the hero's
   illustration, copy and product card. Motion is skipped for people who ask for reduced motion. */
(function () {
  const $ = (id) => document.getElementById(id);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const COPY = {
    student: { h: "The money class <em>school skipped.</em>", lead: "Fifteen short lessons, practice with pretend money, and Leaf, who never lets you off easy. By the end you'll know what an APR is, why your first paycheck is smaller than you expected, and how to spot a scam in about four seconds.", cta: ["Try Lesson 1 free", "lessons/lesson-1.html"], cta2: ["Watch the demo", "mintly.demo.html?from=site"] },
    parent: { h: "Raise a kid who's <em>good with money.</em>", lead: "Your teen practises real decisions with pretend money, and you get a weekly look at how they think. Plus a better dinner-table question than \"how was school?\"", cta: ["See the parent view", "dashboard.html?role=parent"], cta2: ["How it keeps them safe", "parents.html"] },
    teacher: { h: "A personal finance unit <em>that runs itself.</em>", lead: "Fifteen lessons with films and quizzes, plus a class dashboard that shows you who's stuck before the test does. Assign it Monday and watch it work.", cta: ["See the class view", "dashboard.html?role=teacher"], cta2: ["School pricing", "pricing.html"] }
  };

  // ---- Decision Score: a gently drifting random walk. The number, arc and bars all read the same value. ----
  const score = { cur: 62, target: 82, bars: [70, 64, 58, 74], btarget: [78, 70, 66, 80], next: 0 };
  let gaugeLen = 100;
  function tickScore(now) {
    if (now > score.next) {
      score.target = clamp(score.target + rand(-14, 14), 52, 97);
      score.btarget = score.btarget.map((b, i) => clamp(score.target + [-6, -12, -18, 2][i] + rand(-9, 9), 30, 99));
      score.next = now + rand(1100, 2000);
    }
    score.cur += (score.target - score.cur) * 0.06;
    score.bars = score.bars.map((b, i) => b + (score.btarget[i] - b) * 0.05);
    const v = Math.round(score.cur);
    $("g-num").textContent = v;
    $("g-fill").style.strokeDashoffset = String(gaugeLen - score.cur);
    document.querySelectorAll("#mini-bars .mini-bar").forEach((row, i) => {
      const b = Math.round(score.bars[i]);
      row.querySelector("b").style.width = b + "%";
      row.lastElementChild.textContent = b;
    });
    if (!reduce) requestAnimationFrame(tickScore);
  }

  // ---- Parent and teacher cards also breathe a little ----
  function buildParent() {
    const bars = $("p-bars"), h = [34, 52, 44, 66, 58, 40, 72];
    bars.innerHTML = h.map((x) => `<i style="height:${x}%"></i>`).join("");
    if (reduce) return;
    setInterval(() => {
      if (document.hidden) return;
      const els = bars.children;
      Array.from(els).forEach((e, i) => { const n = clamp(parseFloat(e.style.height) + rand(-14, 14), 18, 92); e.style.height = n.toFixed(0) + "%"; });
      const s = clamp(+$("p-score").textContent + Math.round(rand(-3, 3)), 66, 91); $("p-score").textContent = s;
    }, 1700);
  }
  function buildTeacher() {
    const heat = $("t-heat");
    heat.innerHTML = Array.from({ length: 24 }, () => `<i style="opacity:${rand(.35, 1).toFixed(2)}"></i>`).join("");
    if (reduce) return;
    setInterval(() => {
      if (document.hidden) return;
      const cells = heat.children;
      for (let n = 0; n < 5; n++) {
        const c = cells[Math.floor(Math.random() * cells.length)];
        const low = Math.random() < .12; c.classList.toggle("lo", low); c.style.opacity = low ? 0.9 : rand(.4, 1).toFixed(2);
      }
      const d = clamp(+$("t-done").textContent.replace("%", "") + Math.round(rand(-2, 2)), 62, 84); $("t-done").textContent = d + "%";
    }, 1500);
  }

  // ---- Role switch ----
  function placeThumb() {
    const sw = $("role-switch"), on = sw.querySelector('[aria-pressed="true"]'), th = sw.querySelector(".thumb");
    th.style.width = on.offsetWidth + "px";
    th.style.transform = "translateX(" + (on.offsetLeft - 4) + "px)";
  }
  function showRole(role, first) {
    const copy = $("hero-copy");
    document.querySelectorAll("#role-switch button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.role === role)));
    placeThumb();
    document.querySelectorAll("[data-scene]").forEach((s) => s.classList.toggle("off", s.dataset.scene !== role));
    document.querySelectorAll("[data-card]").forEach((s) => s.classList.toggle("off", s.dataset.card !== role));
    const c = COPY[role];
    const apply = () => {
      $("hero-h1").innerHTML = c.h; $("hero-lead").textContent = c.lead;
      $("hero-cta").textContent = c.cta[0]; $("hero-cta").href = c.cta[1];
      $("hero-cta2").textContent = c.cta2[0]; $("hero-cta2").href = c.cta2[1];
      copy.classList.remove("swap");
    };
    if (first || reduce) apply(); else { copy.classList.add("swap"); setTimeout(apply, 230); }
  }

  function initRoles() {
    const start = ["student", "parent", "teacher"].includes(MintlyTheme.getRole()) ? MintlyTheme.getRole() : "student";
    showRole(start, true);
    $("role-switch").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-role]"); if (!b) return;
      MintlyTheme.setRole(b.dataset.role); showRole(b.dataset.role);
    });
    addEventListener("resize", placeThumb);
    document.fonts && document.fonts.ready.then(placeThumb);
  }

  // ---- Lesson tiles with the viewer's real progress ----
  function initLessons() {
    const icons = ["book", "piggy", "target", "bank", "chart", "card", "percent", "wallet", "alert", "plan"];
    const tiles = $("lesson-tiles");
    tiles.innerHTML = Mintly.LESSONS.map((l, i) => {
      const done = Mintly.isLessonComplete(l.id);
      return `<a class="tile${done ? " done" : ""}" href="lessons/${l.id}.html"><span class="tick" aria-label="Completed">&#10003;</span><div class="art" data-art="${icons[i]}"></div><div class="k">Lesson ${i + 1}</div><h3>${l.title}</h3><div class="foot"><span>${l.mins} min</span><span class="go">${done ? "Review" : "Start"} &rarr;</span></div></a>`;
    }).join("");
    MintlyArt.mount();
    const st = Mintly.stats();
    $("hm-progress").textContent = st.done ? `${st.done} of ${st.total} lessons complete. Keep going.` : "Fifteen lessons, each with a film, something to do and a quiz. The first one is free.";
  }

  // ---- Leaf's looping conversation ----
  function initChat() {
    const log = $("chat-log");
    const script = [["me", "I want to buy NVIDIA. Everyone says it's going up."], ["leaf", "What would need to be true for it to keep going up?"], ["me", "Customers keep buying chips, I guess."], ["leaf", "Good. What if the big customers slow down? Which article covers that?"], ["me", "The bearish one. It says spending may be a bubble."], ["leaf", "So what would change your mind?"]];
    let i = 0;
    function step() {
      if (document.hidden) return setTimeout(step, 1500);
      if (i >= script.length) { setTimeout(() => { log.innerHTML = ""; i = 0; step(); }, 3200); return; }
      const [who, text] = script[i++];
      if (who === "leaf") {
        const t = document.createElement("div"); t.className = "bubble leaf typing"; t.innerHTML = "<i></i><i></i><i></i>"; log.appendChild(t);
        setTimeout(() => { t.className = "bubble leaf"; t.textContent = text; setTimeout(step, 1500); }, 900);
      } else {
        const b = document.createElement("div"); b.className = "bubble me"; b.textContent = text; log.appendChild(b); setTimeout(step, 1300);
      }
    }
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); step(); } }, { threshold: .3 });
    io.observe(log);
  }

  // ---- Topic ticker, counting stats, and a live sample film ----
  function initTicker() {
    const words = ["Budgeting", "Saving", "Compound interest", "Credit", "Paychecks", "Scams", "Investing", "Risk", "Diversifying", "Leaf", "Decision Score", "Your money plan"];
    const html = words.map((w, i) => `<span>${w}</span><i>${i % 2 ? "\u2766" : "\u2022"}</i>`).join("");
    $("ticker").innerHTML = html + html;
  }
  function initCounts() {
    const els = document.querySelectorAll("[data-count]");
    const run = (el) => {
      const to = +el.dataset.count, pre = el.dataset.pre || "";
      if (reduce || !to) { el.textContent = pre + to; return; }
      const t0 = performance.now();
      (function f(t) { const p = Math.min(1, (t - t0) / 1200); el.textContent = pre + Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); })(t0);
    };
    if (!("IntersectionObserver" in window)) return els.forEach(run);
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }), { threshold: .6 });
    els.forEach((e) => io.observe(e));
  }
  function initAgeTry() {
    const box = $("age-try"); if (!box) return;
    const mark = () => box.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.age === MintlyTheme.getAge()));
    box.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { MintlyTheme.setAge(b.dataset.age); mark(); } });
    document.addEventListener("mintly:age", mark); mark();
  }
  function initFilm() {
    const host = $("home-film");
    if (host && window.MintlyFilm && window.MINTLY_FILMS) MintlyFilm.mount(host, MINTLY_FILMS["lesson-7"]);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTicker(); initCounts(); initFilm(); initAgeTry();
    gaugeLen = 100;
    initRoles(); buildParent(); buildTeacher(); initLessons(); initChat();
    if (reduce) { score.cur = 82; tickScore(0); } else requestAnimationFrame(tickScore);
  });
})();
