/* Mintly dashboards: one page, three roles. The role comes from ?role=, the saved choice, or the account.
   Student numbers (lessons, XP, streak, quiz accuracy) are the viewer's real progress from script.js.
   Parent and teacher views, and scores that only a live class would produce, use clearly labelled sample data. */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const KEY = "mintly:dash:";
  const read = (k, d) => { try { const v = localStorage.getItem(KEY + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) {} };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ICON = {
    home: I('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>'), book: I('<path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1Z"/><path d="M12 6v14"/>'),
    chart: I('<path d="M4 20V4M4 20h16"/><path d="M8 15l4-4 3 3 5-6"/>'), award: I('<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 21l5-3 5 3-1.500-7"/>'),
    users: I('<circle cx="9" cy="8" r="3.5"/><path d="M2.500 20c.5-4 3-6 6.500-6s6 2 6.500 6"/><path d="M16 4.500a3.500 3.500 0 0 1 0 7M18 14c2 .8 3.500 2.600 4 6"/>'),
    chat: I('<path d="M4 5h16v11H9l-5 4Z"/>'), shield: I('<path d="M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6Z"/><path d="M8.500 12l2.500 2.500 4.500-5"/>'),
    clip: I('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>'), grid: I('<rect x="4" y="4" width="7" height="7" rx="1.500"/><rect x="13" y="4" width="7" height="7" rx="1.500"/><rect x="4" y="13" width="7" height="7" rx="1.500"/><rect x="13" y="13" width="7" height="7" rx="1.500"/>'),
    flame: I('<path d="M12 3c1 4 5 5.500 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .300 1.500 1 2 2 2-1-3-.500-5 1-8Z"/>'), check: I('<path d="M5 12.500l4.500 4.500L19 7.500"/>'),
    copy: I('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'), mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>')
  };

  const user = Mintly.currentUser();
  const st = Mintly.stats();
  const signedIn = !!user;
  const firstName = user ? user.name.split(" ")[0] : null;

  // ---------- helpers ----------
  const ring = (pct, big, small, size) => {
    const r = 54, c = 2 * Math.PI * r;
    return `<div class="ring" style="${size ? `width:${size}px;height:${size}px` : ""}"><svg viewBox="0 0 132 132"><circle class="t" cx="66" cy="66" r="${r}"/><circle class="f" cx="66" cy="66" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-off="${c * (1 - pct / 100)}"/></svg><div class="v"><div>${big}<small>${small}</small></div></div></div>`;
  };
  const bar = (v) => `<div class="bar"><i data-w="${v}"></i></div>`;
  const skillRow = (n, v) => `<div class="skill"><span>${n}</span>${bar(v)}<span>${v}</span></div>`;
  const line = (vals, w, h, labels) => {
    const pad = 28, mn = 40, mx = 100, step = (w - pad * 2) / (vals.length - 1);
    const pts = vals.map((v, i) => [pad + i * step, h - 26 - ((v - mn) / (mx - mn)) * (h - 50)]);
    const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const grid = [50, 70, 90].map((g) => { const y = h - 26 - ((g - mn) / (mx - mn)) * (h - 50); return `<line class="grid-l" x1="${pad}" x2="${w - pad}" y1="${y}" y2="${y}"/><text x="0" y="${y + 4}">${g}</text>`; }).join("");
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Score trend">${grid}<path class="ar" d="${d} L${pts[pts.length - 1][0]} ${h - 26} L${pts[0][0]} ${h - 26}Z"/><path class="ln" d="${d}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" style="transition:stroke-dashoffset 1.4s var(--ease)" data-draw/>${pts.map((p, i) => `<circle class="dot" cx="${p[0]}" cy="${p[1]}" r="5"><title>${labels[i]}: ${vals[i]}</title></circle>`).join("")}${labels.map((l, i) => `<text x="${pts[i][0]}" y="${h - 6}" text-anchor="middle">${l}</text>`).join("")}</svg>`;
  };
  const animate = (root) => requestAnimationFrame(() => requestAnimationFrame(() => {
    $$("[data-w]", root).forEach((e) => (e.style.width = e.dataset.w + "%"));
    $$("circle.f[data-off]", root).forEach((e) => (e.style.strokeDashoffset = e.dataset.off));
    $$("[data-draw]", root).forEach((e) => (e.style.strokeDashoffset = 0));
  }));

  // ---------- sample data ----------
  const SKILLS = [["Research", 82], ["Evidence", 76], ["Risk awareness", 68], ["Reasoning", 88]];
  const TREND = [58, 64, 61, 70, 74, 72, 79, 82];
  const TREND_L = ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8"];
  const ROSTER = [["Ava Thompson", 5, 91, "Evidence"], ["Noah Okafor", 4, 84, "Risk"], ["Mia Chen", 5, 88, "Risk"], ["Liam Patel", 3, 72, "Evidence"], ["Zoe Martin", 2, 61, "Risk"], ["Ethan Brooks", 4, 79, "Reasoning"], ["Isla Rivera", 1, 48, "Research"], ["Lucas Kim", 3, 70, "Risk"], ["Sofia Nguyen", 5, 93, "Reasoning"], ["Owen Hall", 2, 55, "Evidence"], ["Chloe Adams", 4, 82, "Risk"], ["Jack Diaz", 0, 39, "Research"]].map((r) => ({ name: r[0], done: r[1], score: r[2], weak: r[3] }));
  const HEAT = [["Research", [88, 82, 79, 91, 74, 86]], ["Evidence", [72, 68, 74, 80, 61, 70]], ["Risk", [54, 49, 60, 58, 46, 52]], ["Reasoning", [80, 77, 84, 86, 70, 78]]];
  const BADGES = [["First Look", "Open a lesson", () => st.done >= 0 && (st.quizTotal > 0 || st.done > 0), "1"], ["Quick Learner", "Finish a lesson", () => st.done >= 1, "Q"], ["On a Roll", "3 day streak", () => st.streak >= 3, "3"], ["Sharp Mind", "80%+ quiz accuracy", () => (st.accuracy || 0) >= 80, "S"], ["Halfway", "Finish 3 lessons", () => st.done >= 3, "H"], ["Graduate", "Finish the course", () => st.done >= st.total, "G"], ["Risk Spotter", "Name a risk in a decision", () => false, "R"], ["Devil's Advocate", "Ask Leaf for the case against", () => false, "D"]];
  const STARTERS = ["What would make you wait instead of buy?", "Which article disagreed with you, and what did it say?", "If this dropped 20% tomorrow, what would you do?", "How did you decide what was a need and what was a want this week?"];

  // ---------- views ----------
  const VIEWS = {
    student: {
      title: () => (firstName ? `Good to see you, ${esc(firstName)}.` : "Your learning dashboard"),
      sub: () => (signedIn ? "Here is where you stand today." : "You're browsing as a guest. Your progress here is saved on this device. Sign in to keep it."),
      nav: [["overview", "Overview", "home"], ["lessons", "Lessons", "book"], ["badges", "Badges", "award"], ["leaf", "Ask Leaf", "chat"]],
      pages: {
        overview() {
          const next = Mintly.nextLesson(), pct = Math.round((st.done / st.total) * 100);
          const goals = read("goals", [false, false, false]);
          const G = ["Finish one lesson today", "Answer every quiz question", "Ask Leaf one hard question"];
          return `<div class="grid">
            <section class="card hl c8"><div class="card-h"><h3 style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.8">${st.done ? "Continue learning" : "Start here"}</h3></div>
              <h2 style="font-size:34px;font-weight:500;margin:0 0 6px;letter-spacing:-.02em">${esc(next.title)}</h2><p class="muted" style="margin:0 0 20px">Lesson ${Mintly.LESSON_IDS.indexOf(next.id) + 1} of ${st.total} &middot; ${next.mins} minutes</p>
              <div style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn" href="lessons/${next.id}.html">${st.done ? "Resume" : "Start lesson"} →</a><a class="btn btn-ghost" href="simulation.html">Try a simulation</a></div></section>
            <section class="card c4"><div class="card-h"><h3>Level ${st.level}</h3><span class="pill">${st.xp} XP</span></div><div class="row">${ring(Math.round((st.intoLevel / 150) * 100), st.level, "level")}<div><div class="stat-big">${150 - st.intoLevel}</div><div class="stat-sub">XP to level ${st.level + 1}</div></div></div></section>
            <section class="card c3"><div class="kpi"><span class="lbl">Day streak</span><div class="stat-big">${st.streak}</div><span class="stat-sub">${st.streak ? "Keep it going tomorrow" : "Finish a quiz question to start one"}</span></div></section>
            <section class="card c3"><div class="kpi"><span class="lbl">Course progress</span><div class="stat-big">${pct}%</div>${bar(pct)}<span class="stat-sub">${st.done} of ${st.total} lessons</span></div></section>
            <section class="card c3"><div class="kpi"><span class="lbl">Quiz accuracy</span><div class="stat-big">${st.accuracy === null ? "&ndash;" : st.accuracy + "%"}</div><span class="stat-sub">${st.quizTotal ? st.quizCorrect + " of " + st.quizTotal + " correct" : "Take a quiz to see this"}</span></div></section>
            <section class="card c3"><div class="kpi"><span class="lbl">Decision Score</span><div class="stat-big">82</div><span class="delta up">▲ 3 since last round</span><span class="stat-sub">Sample round</span></div></section>
            <section class="card c8"><div class="card-h"><h3>Decision Score over time</h3><span class="pill mute">Sample data</span></div>${line(TREND, 640, 220, TREND_L)}</section>
            <section class="card c4"><div class="card-h"><h3>Today's goals</h3></div><ul class="list">${G.map((g, i) => `<li><label class="toggle"><input type="checkbox" data-goal="${i}" ${goals[i] ? "checked" : ""} aria-label="${g}"><i></i></label><div class="tx"><b>${g}</b></div></li>`).join("")}</ul></section>
            <section class="card c6"><div class="card-h"><h3>Your skills</h3><span class="pill mute">Sample data</span></div>${SKILLS.map((s) => skillRow(s[0], s[1])).join("")}</section>
            <section class="card c6"><div class="card-h"><h3>Leaf suggests</h3></div><div style="display:flex;gap:14px;align-items:flex-start"><div class="art" style="width:56px;flex:none" data-art="leaf"></div><div><p class="quote">&ldquo;Your risk score is your lowest. Try naming the biggest downside before you decide.&rdquo;</p><a class="btn btn-secondary btn-small" href="leaf.html">Ask Leaf about it</a></div></div></section>
          </div>`;
        },
        lessons() {
          return `<div class="card"><div class="card-h"><h3>Financial Literacy</h3><span class="pill">${st.done}/${st.total} complete</span></div><ul class="list">${Mintly.LESSONS.map((l, i) => {
            const d = Mintly.isLessonComplete(l.id), q = Mintly.quizResult(l.id);
            return `<li><div class="ic">${d ? ICON.check : i + 1}</div><div class="tx"><b>${esc(l.title)}</b><span>${l.mins} min${q ? ` &middot; quiz ${q.c}/${q.t}` : ""}</span></div><a class="btn ${d ? "btn-secondary" : ""} btn-small" href="lessons/${l.id}.html">${d ? "Review" : "Start"}</a></li>`;
          }).join("")}</ul></div>`;
        },
        badges() {
          return `<div class="card"><div class="card-h"><h3>Badges</h3><span class="pill">${BADGES.filter((b) => b[2]()).length} of ${BADGES.length} earned</span></div><div class="badges">${BADGES.map((b) => `<div class="badge ${b[2]() ? "" : "locked"}" title="${esc(b[1])}"><i>${b[3]}</i>${esc(b[0])}<div class="muted" style="font-weight:400;font-size:11.5px;margin-top:2px">${esc(b[1])}</div></div>`).join("")}</div></div>`;
        },
        leaf() {
          return `<div class="grid"><section class="card c7"><div class="card-h"><h3>Conversation starters for Leaf</h3></div><ul class="list">${["Summarize the bullish article.", "What's the strongest argument against buying?", "Are these two articles actually disagreeing?", "What haven't I checked yet?"].map((q) => `<li><div class="ic">${ICON.chat}</div><div class="tx"><b>${q}</b></div><a class="btn btn-secondary btn-small" href="leaf.html">Ask</a></li>`).join("")}</ul></section><section class="card c5"><div class="art" data-art="leaf" style="width:120px;margin:0 auto 12px"></div><p class="quote" style="text-align:center">&ldquo;Leaf never says buy or sell. It asks what you think, and why.&rdquo;</p></section></div>`;
        }
      }
    },

    parent: {
      title: () => (firstName ? `${esc(firstName)}'s family overview` : "Family overview"),
      sub: () => "A calm look at how your teen is learning. Sample data is shown until a learner is linked to your account.",
      nav: [["week", "This week", "home"], ["skills", "Skills", "chart"], ["talk", "Conversations", "chat"], ["safety", "Safety & settings", "shield"]],
      pages: {
        week() {
          const kid = read("kid", 0), K = [["Maya", 82, [34, 52, 44, 66, 58, 40, 72], 3], ["Eli", 71, [20, 30, 62, 48, 70, 25, 38], 2]][kid];
          return `<div class="grid">
            <section class="card c12" style="padding:14px 18px"><div class="row" style="justify-content:space-between"><div class="seg" role="group" aria-label="Choose a learner">${["Maya", "Eli"].map((n, i) => `<button type="button" data-kid="${i}" aria-pressed="${i === kid}">${n}</button>`).join("")}</div><span class="pill mute">Sample data</span></div></section>
            <section class="card c4"><div class="kpi"><span class="lbl">Reasoning score</span><div class="stat-big">${K[1]}</div><span class="delta up">▲ 4 this week</span></div></section>
            <section class="card c4"><div class="kpi"><span class="lbl">Lessons this week</span><div class="stat-big">${K[3]}</div><span class="stat-sub">of 5 in the course</span></div></section>
            <section class="card c4"><div class="kpi"><span class="lbl">Time practising</span><div class="stat-big">${kid ? "52" : "74"} min</div><span class="stat-sub">Under the 90 minute limit you set</span></div></section>
            <section class="card c7"><div class="card-h"><h3>Activity this week</h3></div><div class="week-bars" style="height:150px">${K[2].map((x) => `<i style="height:${x}%"></i>`).join("")}</div><div class="week-labels">${"MTWTFSS".split("").map((d) => `<span>${d}</span>`).join("")}</div></section>
            <section class="card c5"><div class="card-h"><h3>What they did</h3></div><ol class="timeline"><li><b>Finished: needs vs. wants</b><span>Tuesday</span></li><li><b>Read both sides on AI chips</b><span>Wednesday</span></li><li><b>Named the downside before deciding</b><span>Friday</span></li></ol></section>
            <section class="card c12"><div class="card-h"><h3>Ready for real money?</h3><span class="pill warn">Not yet, and that is normal</span></div><p class="muted" style="margin:0 0 14px">Mintly never moves to real money on its own. These are the signals most families wait for first.</p>${[["Finished the core course", 60], ["Decision Score above 80 for three rounds", 66], ["Can name the risk without a prompt", 40], ["You both feel ready", 0]].map((s) => skillRow(s[0], s[1])).join("")}</section>
          </div>`;
        },
        skills() { return `<div class="grid"><section class="card c6"><div class="card-h"><h3>Skills</h3></div>${SKILLS.map((s) => skillRow(s[0], s[1])).join("")}</section><section class="card c6"><div class="card-h"><h3>Trend</h3></div>${line(TREND, 560, 220, TREND_L)}</section></div>`; },
        talk() {
          return `<div class="card"><div class="card-h"><h3>Conversation starters</h3></div><p class="muted" style="margin:0 0 10px">Based on what they worked on this week. The best question is one you do not know the answer to.</p><ul class="list">${STARTERS.map((q) => `<li><div class="ic">${ICON.chat}</div><div class="tx"><b>${q}</b></div><button class="btn btn-secondary btn-small" data-copy="${esc(q)}">Copy</button></li>`).join("")}</ul></div>`;
        },
        safety() {
          const s = read("safety", { digest: true, limit: "90", quiet: false });
          return `<div class="grid"><section class="card c7"><div class="card-h"><h3>Safety & settings</h3></div><ul class="list">
            <li><div class="ic">${ICON.shield}</div><div class="tx"><b>Practice money only</b><span>Always on. Real money needs both of you to agree first.</span></div><label class="toggle"><input type="checkbox" checked disabled aria-label="Practice money only"><i></i></label></li>
            <li><div class="ic">${ICON.mail}</div><div class="tx"><b>Weekly email summary</b><span>Sundays, one short read.</span></div><label class="toggle"><input type="checkbox" data-s="digest" ${s.digest ? "checked" : ""} aria-label="Weekly email summary"><i></i></label></li>
            <li><div class="ic">${ICON.flame}</div><div class="tx"><b>Quiet hours</b><span>No notifications after 8pm.</span></div><label class="toggle"><input type="checkbox" data-s="quiet" ${s.quiet ? "checked" : ""} aria-label="Quiet hours"><i></i></label></li>
            <li><div class="ic">${ICON.clip}</div><div class="tx"><b>Daily practice limit</b><span>Mintly reminds them to take a break.</span></div><select data-s="limit" aria-label="Daily limit" class="field" style="border:1.5px solid var(--border);border-radius:10px;padding:8px;background:var(--bg)">${["30", "60", "90", "120"].map((m) => `<option ${s.limit === m ? "selected" : ""} value="${m}">${m} min</option>`).join("")}</select></li></ul></section>
            <section class="card c5"><div class="art" data-art="shield" style="width:84px;margin-bottom:14px"></div><h3 style="font-size:24px;margin:0 0 8px">Built for understanding, not surveillance.</h3><p class="muted" style="margin:0">You see progress and reasoning. You never see private messages to Leaf, and nothing is shared outside your family.</p></section></div>`;
        }
      }
    },

    teacher: {
      title: () => "Period 3 · Personal Finance",
      sub: () => "12 students shown. Sample class data.",
      nav: [["class", "Class", "home"], ["roster", "Roster", "users"], ["assign", "Assignments", "clip"], ["skills", "Skills", "grid"]],
      pages: {
        class() {
          const avg = Math.round(ROSTER.reduce((a, r) => a + r.score, 0) / ROSTER.length), behind = ROSTER.filter((r) => r.score < 60);
          return `<div class="grid">
            <section class="card c3"><div class="kpi"><span class="lbl">Class average</span><div class="stat-big">${avg}</div><span class="delta up">▲ 5 this month</span></div></section>
            <section class="card c3"><div class="kpi"><span class="lbl">Unit complete</span><div class="stat-big">${Math.round(ROSTER.reduce((a, r) => a + r.done, 0) / (ROSTER.length * 5) * 100)}%</div>${bar(64)}</div></section>
            <section class="card c3"><div class="kpi"><span class="lbl">Need support</span><div class="stat-big">${behind.length}</div><span class="stat-sub">scoring under 60</span></div></section>
            <section class="card c3"><div class="kpi"><span class="lbl">Due Friday</span><div class="stat-big">Quiz 3</div><span class="stat-sub">9 of 12 submitted</span></div></section>
            <section class="card c7"><div class="card-h"><h3>Needs a conversation</h3><button class="link" data-goto="roster">Open roster</button></div><ul class="list">${behind.map((r) => `<li><div class="ic">${esc(r.name[0])}</div><div class="tx"><b>${esc(r.name)}</b><span>${r.done} of 5 lessons &middot; weakest in ${r.weak.toLowerCase()}</span></div><span class="pill warn">${r.score}</span></li>`).join("")}</ul></section>
            <section class="card c5"><div class="card-h"><h3>Class insight</h3></div><div class="art" data-art="target" style="width:64px;margin-bottom:10px"></div><p class="quote">&ldquo;Risk awareness is the weakest skill across the class. Try a risk-first warm-up on Monday.&rdquo;</p><button class="btn btn-secondary btn-small" data-goto="assign">Assign a risk lesson</button></section>
          </div>`;
        },
        roster() {
          return `<div class="card"><div class="card-h" style="flex-wrap:wrap"><h3>Roster</h3><div class="row" style="gap:10px"><input id="rq" placeholder="Search students" aria-label="Search students" style="border:1.5px solid var(--border);border-radius:10px;padding:8px 12px;background:var(--bg);font-size:14px"><div class="seg" role="group" aria-label="Filter"><button type="button" data-f="all" aria-pressed="true">All</button><button type="button" data-f="low" aria-pressed="false">Need support</button></div></div></div><div class="table-wrap"><table class="tbl" id="roster"><thead><tr><th data-c="name">Student</th><th data-c="done">Lessons</th><th data-c="score">Score</th><th data-c="weak">Weakest skill</th></tr></thead><tbody></tbody></table></div></div>`;
        },
        assign() {
          const list = read("assign", [{ t: "Lesson 4: How banks work", d: "Fri, Nov 7", n: 9 }, { t: "Quiz 3: Saving and goals", d: "Fri, Oct 31", n: 12 }]);
          return `<div class="grid"><section class="card c7"><div class="card-h"><h3>Assignments</h3></div><ul class="list" id="alist">${list.map((a) => `<li><div class="ic">${ICON.clip}</div><div class="tx"><b>${esc(a.t)}</b><span>Due ${esc(a.d)}</span></div><span class="pill mute">${a.n}/12 done</span></li>`).join("")}</ul></section>
            <section class="card c5"><div class="card-h"><h3>New assignment</h3></div><form id="aform" style="display:grid;gap:12px"><div class="field"><label for="at">Lesson</label><select id="at">${Mintly.LESSONS.map((l, i) => `<option>Lesson ${i + 1}: ${esc(l.title)}</option>`).join("")}</select></div><div class="field"><label for="ad">Due date</label><input id="ad" type="date" required></div><button class="btn" type="submit">Assign to class</button></form></section></div>`;
        },
        skills() {
          return `<div class="card"><div class="card-h"><h3>Skill heatmap</h3><span class="pill mute">Average score by unit</span></div><div class="hm"><span></span>${["U1", "U2", "U3", "U4", "U5", "U6"].map((u) => `<span class="hd">${u}</span>`).join("")}${HEAT.map((r) => `<span class="rl">${r[0]}</span>${r[1].map((v) => `<span class="cell ${v > 75 ? "hi" : ""}" style="--v:${v}">${v}</span>`).join("")}`).join("")}</div><p class="muted" style="margin:16px 0 0;font-size:14px">Darker means stronger. Risk is the paler row, so that is where the next lesson should go.</p></div>`;
        }
      }
    }
  };

  // ---------- render ----------
  let role = MintlyTheme.getRole(), page = null;

  function renderSide() {
    const v = VIEWS[role];
    const nm = signedIn ? user.name : { student: "Maya Lopez", parent: "The Lopez family", teacher: "Ms. Alvarez" }[role];
    $("#dash-side").innerHTML = `<div class="dash-who"><div class="avatar">${esc(nm[0])}</div><div><b>${esc(nm)}</b><span>${role[0].toUpperCase() + role.slice(1)}${signedIn ? "" : " · guest"}</span></div></div>
      <div class="side-sec">Menu</div>${v.nav.map((n) => `<button class="side-link" data-page="${n[0]}" aria-current="${n[0] === page}">${ICON[n[2]]}${n[1]}</button>`).join("")}
      <div class="side-foot"><b>${signedIn ? "You're signed in" : "Save your progress"}</b>${signedIn ? "Progress is saved to this browser." : "<a href='signin.html' style='color:var(--acc);font-weight:600'>Create a free account →</a>"}</div>`;
  }

  function render(first) {
    const v = VIEWS[role];
    if (!page || !v.pages[page]) page = v.nav[0][0];
    renderSide();
    const main = $("#dash-main");
    main.innerHTML = `<div class="dash-top"><div><h1>${v.title()}</h1><p>${v.sub()}</p></div><div class="dash-actions"><div class="seg" role="group" aria-label="View as">${["student", "parent", "teacher"].map((r) => `<button type="button" data-role="${r}" aria-pressed="${r === role}">${r[0].toUpperCase() + r.slice(1)}</button>`).join("")}</div></div></div><div id="view" class="tabs-p on">${v.pages[page]()}</div>`;
    document.title = (v.nav.find((n) => n[0] === page) || [0, "Dashboard"])[1] + " · Mintly";
    MintlyArt.mount(); animate(main); wire(main);
    if (!first) main.focus({ preventScroll: true });
  }

  function wire(main) {
    $$("[data-goal]", main).forEach((c) => c.addEventListener("change", () => { const g = read("goals", [false, false, false]); g[c.dataset.goal] = c.checked; write("goals", g); if (g.every(Boolean)) { Mintly.confetti(60); Mintly.toast("All goals done. Nice."); } }));
    $$("[data-kid]", main).forEach((b) => b.addEventListener("click", () => { write("kid", +b.dataset.kid); render(); }));
    $$("[data-copy]", main).forEach((b) => b.addEventListener("click", () => { (navigator.clipboard ? navigator.clipboard.writeText(b.dataset.copy) : Promise.reject()).catch(() => {}); Mintly.toast("Copied. Try it at dinner."); }));
    $$("[data-goto]", main).forEach((b) => b.addEventListener("click", () => { page = b.dataset.goto; render(); }));
    $$("[data-s]", main).forEach((c) => c.addEventListener("change", () => { const s = read("safety", { digest: true, limit: "90", quiet: false }); s[c.dataset.s] = c.type === "checkbox" ? c.checked : c.value; write("safety", s); Mintly.toast("Setting saved"); }));
    const form = $("#aform", main);
    if (form) form.addEventListener("submit", (e) => {
      e.preventDefault();
      const list = read("assign", [{ t: "Lesson 4: How banks work", d: "Fri, Nov 7", n: 9 }, { t: "Quiz 3: Saving and goals", d: "Fri, Oct 31", n: 12 }]);
      const d = new Date($("#ad").value + "T12:00");
      list.unshift({ t: $("#at").value, d: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }), n: 0 });
      write("assign", list); Mintly.toast("Assigned to all 12 students"); render();
    });
    const table = $("#roster", main);
    if (table) {
      let key = "score", dir = -1, filter = "all", q = "";
      const paint = () => {
        const rows = ROSTER.filter((r) => (filter === "all" || r.score < 60) && r.name.toLowerCase().includes(q)).sort((a, b) => (typeof a[key] === "string" ? a[key].localeCompare(b[key]) : a[key] - b[key]) * dir);
        $("tbody", table).innerHTML = rows.map((r) => `<tr><td><div class="nm"><span class="avatar">${esc(r.name[0])}</span>${esc(r.name)}</div></td><td>${r.done}/5</td><td><div style="display:flex;gap:10px;align-items:center"><div class="bar"><i style="width:${r.score}%"></i></div><b>${r.score}</b></div></td><td><span class="pill ${r.score < 60 ? "warn" : ""}">${r.weak}</span></td></tr>`).join("") || `<tr><td colspan="4" class="muted">No students match.</td></tr>`;
        $$("th", table).forEach((th) => { if (th.dataset.c === key) th.setAttribute("aria-sort", dir > 0 ? "ascending" : "descending"); else th.removeAttribute("aria-sort"); });
      };
      $$("th", table).forEach((th) => th.addEventListener("click", () => { dir = key === th.dataset.c ? -dir : 1; key = th.dataset.c; paint(); }));
      $("#rq", main).addEventListener("input", (e) => { q = e.target.value.toLowerCase(); paint(); });
      $$("[data-f]", main).forEach((b) => b.addEventListener("click", () => { filter = b.dataset.f; $$("[data-f]", main).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); paint(); }));
      paint();
    }
  }

  document.addEventListener("click", (e) => {
    const r = e.target.closest("[data-role]"), p = e.target.closest("[data-page]");
    if (r && r.closest("#dash-main")) { role = r.dataset.role; MintlyTheme.setRole(role); page = null; history.replaceState(null, "", "?role=" + role); render(); }
    else if (p) { page = p.dataset.page; render(); }
  });

  render(true);
})();
