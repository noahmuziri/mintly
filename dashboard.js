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
  const member = Mintly.hasActivePlan();
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
  const ROSTER = [["Ava Thompson", 10, 91, "Evidence"], ["Noah Okafor", 8, 84, "Risk"], ["Mia Chen", 9, 88, "Risk"], ["Liam Patel", 6, 72, "Evidence"], ["Zoe Martin", 4, 61, "Risk"], ["Ethan Brooks", 8, 79, "Reasoning"], ["Isla Rivera", 2, 48, "Research"], ["Lucas Kim", 6, 70, "Risk"], ["Sofia Nguyen", 10, 93, "Reasoning"], ["Owen Hall", 4, 55, "Evidence"], ["Chloe Adams", 8, 82, "Risk"], ["Jack Diaz", 0, 39, "Research"]].map((r) => ({ name: r[0], done: r[1], score: r[2], weak: r[3] }));
  const HEAT = [["Research", [88, 82, 79, 91, 74, 86]], ["Evidence", [72, 68, 74, 80, 61, 70]], ["Risk", [54, 49, 60, 58, 46, 52]], ["Reasoning", [80, 77, 84, 86, 70, 78]]];
  const BADGES = [["First Look", "Open a lesson", () => st.done >= 0 && (st.quizTotal > 0 || st.done > 0), "1"], ["Quick Learner", "Finish a lesson", () => st.done >= 1, "Q"], ["On a Roll", "3 day streak", () => st.streak >= 3, "3"], ["Sharp Mind", "80%+ quiz accuracy", () => (st.accuracy || 0) >= 80, "S"], ["Halfway", "Finish 5 lessons", () => st.done >= 5, "H"], ["Graduate", "Finish the course", () => st.done >= st.total, "G"], ["Risk Spotter", "Name a risk in a decision", () => false, "R"], ["Devil's Advocate", "Ask Leaf for the case against", () => false, "D"]];
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
            return `<li><div class="ic">${d ? ICON.check : i + 1}</div><div class="tx"><b>${esc(l.title)}</b><span>${l.mins} min${q ? ` &middot; quiz ${q.c}/${q.t}` : ""}</span></div><a class="btn ${d || !Mintly.canAccess(l.id) ? "btn-secondary" : ""} btn-small" href="lessons/${l.id}.html">${d ? "Review" : Mintly.canAccess(l.id) ? "Start" : "🔒 Unlock"}</a></li>`;
          }).join("")}</ul></div>`;
        },
        badges() {
          return `<div class="card"><div class="card-h"><h3>Badges</h3><span class="pill">${BADGES.filter((b) => b[2]()).length} of ${BADGES.length} earned</span></div><div class="badges">${BADGES.map((b) => `<div class="badge ${b[2]() ? "" : "locked"}" title="${esc(b[1])}"><i>${b[3]}</i>${esc(b[0])}<div class="muted" style="font-weight:400;font-size:11.5px;margin-top:2px">${esc(b[1])}</div></div>`).join("")}</div></div>`;
        },
        leaf() { return leafChat(); }
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
            <section class="card c4"><div class="kpi"><span class="lbl">Lessons this week</span><div class="stat-big">${K[3]}</div><span class="stat-sub">of 10 in the course</span></div></section>
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

    admin: {
      title: () => "Admin console",
      sub: () => "Manage accounts and content for this demo. Data here is stored in this browser only.",
      nav: [["overview", "Overview", "home"], ["insights", "Insights", "chart"], ["accounts", "Accounts", "users"], ["content", "Content", "book"], ["tools", "Tools", "shield"]],
      pages: {
        overview() {
          const users = Object.values(Mintly.allUsers()), by = (r) => users.filter((u) => u.role === r).length;
          return `<div class="grid">
            <section class="card c3"><div class="kpi"><span class="lbl">Accounts</span><div class="stat-big">${users.length}</div><span class="stat-sub">in this browser</span></div></section>
            <section class="card c3"><div class="kpi"><span class="lbl">Students</span><div class="stat-big">${by("student")}</div></div></section>
            <section class="card c3"><div class="kpi"><span class="lbl">Parents · Teachers</span><div class="stat-big">${by("parent")} · ${by("teacher")}</div></div></section>
            <section class="card c3"><div class="kpi"><span class="lbl">Lessons live</span><div class="stat-big">${st.total}</div><span class="stat-sub">each with a film</span></div></section>
            <section class="card c8"><div class="card-h"><h3>Lesson completions, last 8 weeks</h3><span class="pill mute">Sample data</span></div>${line([12, 18, 26, 31, 44, 52, 61, 74], 640, 220, ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"])}</section>
            <section class="card c4"><div class="card-h"><h3>Needs attention</h3></div><ul class="list"><li><div class="ic">${ICON.shield}</div><div class="tx"><b>Billing is not live</b><span>Plans create demo accounts only.</span></div></li><li><div class="ic">${ICON.users}</div><div class="tx"><b>Auth is browser-only</b><span>Add a backend before real students sign up.</span></div></li><li><div class="ic">${ICON.clip}</div><div class="tx"><b>Lessons need review</b><span>Have a finance educator check 6 to 10.</span></div></li></ul></section>
          </div>`;
        },
        insights() { return `<div id="insroot"><p class="muted">Loading insights…</p></div>`; },
        accounts() {
          const users = Object.values(Mintly.allUsers());
          return `<div class="card"><div class="card-h"><h3>Accounts</h3><span class="pill">${users.length} total</span></div><div class="table-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Plan</th><th></th></tr></thead><tbody>${users.map((u) => `<tr><td><div class="nm"><span class="avatar">${esc(u.name[0])}</span>${esc(u.name)}</div></td><td>${esc(u.email)}</td><td><span class="pill">${esc(u.role || "student")}</span></td><td>${esc(u.plan || "none")}</td><td style="white-space:nowrap"><button class="btn btn-secondary btn-small" data-reset="${esc(u.email)}">Reset progress</button> ${u.demo ? '<span class="pill mute">demo</span>' : `<button class="btn btn-secondary btn-small danger-btn" data-del="${esc(u.email)}">Delete</button>`}</td></tr>`).join("")}</tbody></table></div></div>`;
        },
        content() {
          return `<div class="card"><div class="card-h"><h3>Lessons</h3><span class="pill">${st.total} published</span></div><ul class="list">${Mintly.LESSONS.map((l, i) => `<li><div class="ic">${i + 1}</div><div class="tx"><b>${esc(l.title)}</b><span>Unit ${l.unit || 1} · ${l.mins} min · film + quiz</span></div><a class="btn btn-secondary btn-small" href="lessons/${l.id}.html">Open</a></li>`).join("")}</ul></div>`;
        },
        tools() {
          return `<div class="grid"><section class="card c6"><div class="card-h"><h3>Export</h3></div><p class="muted" style="margin:0 0 14px">Download every account stored in this browser as JSON (demo accounts excluded).</p><button class="btn" data-export>Download accounts</button></section>
            <section class="card c6"><div class="card-h"><h3>Reset this browser</h3></div><p class="muted" style="margin:0 0 14px">Clears accounts, progress, plans and settings saved by Mintly here, then signs you out.</p><button class="btn btn-secondary danger-btn" data-wipe>Erase all Mintly data</button></section></div>`;
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
            <section class="card c3"><div class="kpi"><span class="lbl">Unit complete</span><div class="stat-big">${Math.round(ROSTER.reduce((a, r) => a + r.done, 0) / (ROSTER.length * 10) * 100)}%</div>${bar(64)}</div></section>
            <section class="card c3"><div class="kpi"><span class="lbl">Need support</span><div class="stat-big">${behind.length}</div><span class="stat-sub">scoring under 60</span></div></section>
            <section class="card c3"><div class="kpi"><span class="lbl">Due Friday</span><div class="stat-big">Quiz 3</div><span class="stat-sub">9 of 12 submitted</span></div></section>
            <section class="card c7"><div class="card-h"><h3>Needs a conversation</h3><button class="link" data-goto="roster">Open roster</button></div><ul class="list">${behind.map((r) => `<li><div class="ic">${esc(r.name[0])}</div><div class="tx"><b>${esc(r.name)}</b><span>${r.done} of 10 lessons &middot; weakest in ${r.weak.toLowerCase()}</span></div><span class="pill warn">${r.score}</span></li>`).join("")}</ul></section>
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


  // ---------- Leaf chat: a Socratic thinking partner (runs entirely in the browser, no AI service) ----------
  const LEAF_KEY = "leaf:" + (user ? user.email : "guest");
  const TOPICS = [
    { re: /stock|share|nvidia|nvda|tesla|apple|invest|etf|crypto|bitcoin|market|fund/, label: "investing", qs: ["What does this company actually sell, and who pays for it?", "What would need to be true for the price to keep rising?", "If it fell 20% next month, what would you do, and why?", "Which article or source disagrees with you, and what does it say?"] },
    { re: /save|saving|goal|afford|bike|phone|game|sneaker|laptop|car/, label: "saving", qs: ["How much does it cost, and by what date do you want it?", "How many weeks does that take at what you can really save?", "What would you give up each week to make that happen?", "If you waited 24 hours, would you still want it?"] },
    { re: /budget|spend|allowance|needs|wants|money i get/, label: "budgeting", qs: ["Which of those would you call a need, and which a want?", "What's the cheapest version that still does the job?", "Where did your money actually go last week?", "What would you move into savings first?"] },
    { re: /loan|debt|credit|card|borrow|interest|apr/, label: "borrowing", qs: ["What's the total you'd repay, not just the monthly payment?", "What happens if you miss a payment?", "Is there a way to buy it without borrowing?", "What would the interest cost you in plain dollars?"] },
    { re: /scam|fraud|phish|gift card|giveaway|hack|password|code/, label: "scams", qs: ["What is the message pushing you to do quickly?", "Who could you check this with using a number you already trust?", "What are they asking for that a real company never would?"] },
    { re: /job|paycheck|tax|earn|wage|babysit|mow/, label: "earning", qs: ["How many hours would that take, and what's your take-home after deductions?", "What would you do with the first paycheck, and why?", "What does it cost you in time to earn it?"] }
  ];
  const GENERIC = ["What are you actually trying to decide?", "What would a good outcome look like, in numbers if you can?", "What do you already know, and what are you guessing?", "What's one thing you haven't checked yet?"];
  const SKILLS_CHAT = [["evidence", "Evidence", "Backs it up with a reason or a fact"], ["risk", "Risk", "Names what could go wrong"], ["other", "Other side", "Weighs a view that disagrees"], ["clarity", "Clarity", "Says it in a full thought"]];
  const DETECT = { evidence: /because|since|data|article|source|according|percent|%|\d|report|evidence|study|earnings/i, risk: /risk|lose|loss|downside|drop|fall|worst|wrong|crash|danger|scam/i, other: /but |however|although|on the other hand|critics|bears|against|disagree|counter|then again|except/i };
  const ADVICE = /(should i|tell me to|what should i|is it a good (buy|investment)|buy or sell|should we) /i;
  const pick = (a, n) => a[n % a.length];

  function leafLoad() { return read(LEAF_KEY, { msgs: [], hits: { evidence: 0, risk: 0, other: 0, clarity: 0 }, turns: 0, topic: null, celebrated: false }); }
  function leafSave(s) { write(LEAF_KEY, s); }

  function leafReply(text, s, intent) {
    const t = text.toLowerCase(), words = (text.match(/\S+/g) || []).length;
    const topic = TOPICS.find((x) => x.re.test(t));
    if (topic) s.topic = topic.label;
    const got = [];
    if (DETECT.evidence.test(text)) { s.hits.evidence++; got.push("evidence"); }
    if (DETECT.risk.test(text)) { s.hits.risk++; got.push("risk"); }
    if (DETECT.other.test(text)) { s.hits.other++; got.push("other"); }
    if (words >= 12) { s.hits.clarity++; got.push("clarity"); }
    s.turns++;
    const has = (k) => s.hits[k] > 0;
    const t0 = TOPICS.find((x) => x.label === s.topic);
    const lastUser = [...s.msgs].reverse().find((m) => m.who === "me");
    const quote = lastUser ? lastUser.text.replace(/\s+/g, " ").slice(0, 70) : "";

    const ack = got.includes("evidence") && got.includes("risk") ? "You gave a reason and named a risk. That's strong thinking. " : got.includes("other") ? "Good, you weighed a different view. " : got.includes("evidence") ? "That's a reason, which helps. " : got.includes("risk") ? "Naming the downside is the hard part. " : words < 5 ? "Say a bit more for me. " : "";
    let q;
    if (ADVICE.test(text + " ") && intent !== "chip") return "I don't tell anyone what to buy or sell, and I won't start now. That call has to be yours, or the thinking isn't yours either. Here's what I can do: " + (!has("evidence") ? "what's the strongest reason you could give for it?" : !has("risk") ? "what's the biggest way it could go wrong?" : "who would disagree with you, and why?");
    if (intent === "explain") return "Type a money word or question, like APR, inflation, diversification or \u201chow do taxes work?\u201d, and I'll explain it. Then I'll ask you something back.";
    // a topic Leaf knows about: explain it briefly, then ask a question back
    const known = intent ? null : (window.LEAF_BRAIN && LEAF_BRAIN.match(text));
    if (known) { s.topic = known.id; Mintly.track("leaf_topic", LEAF_BRAIN.catOf(known.id)); return (got.length ? ack : "") + known.a + " " + pick(known.q, s.turns + (text.length % 3)); }
    if (intent === "challenge") return quote ? "You said: “" + quote + "”. What's the strongest argument against that?" : "Tell me the idea first, in one sentence. Then I'll push on it.";
    if (intent === "other") return quote ? "Let's flip it. If someone smart disagreed with “" + quote + "”, what would they say?" : "Tell me what you're leaning toward first. Then we'll look at the other side.";
    if (intent === "missing" && !lastUser) return "Start with what you're trying to decide. I'll tell you what's missing as we go.";
    if (!has("evidence")) q = "What's the strongest reason or fact behind that, and where did you get it?";
    else if (!has("risk")) q = "What's the biggest way this could go wrong, and how would you notice early?";
    else if (!has("other")) q = "Who would disagree with you, and what would they say?";
    else if (has("evidence") && has("risk") && has("other") && !s.celebrated) { s.celebrated = true; s.celebrate = true; q = "You've covered a reason, a risk and the other side. That's a well-built argument. Last one: what would change your mind?"; return q; }
    else q = t0 ? pick(t0.qs, s.turns) : pick(GENERIC, s.turns);
    if (intent === "missing") q = !has("evidence") ? "What's missing is evidence. What fact or source backs this up?" : !has("risk") ? "What's missing is risk. What's the worst realistic outcome?" : !has("other") ? "What's missing is the other side. What would a critic say?" : "Nothing big. Try this: what would change your mind?";
    return ack + q;
  }

  function leafChat() {
    return `<div class="lc" id="leafchat">
      <section class="lc-board" aria-label="Conversation with Leaf"><div class="lc-path" id="lc-path" role="log" aria-live="polite"></div></section>
      <aside class="lc-side">
        <div class="lc-who"><div class="art" data-art="leaf"></div><div><b>Leaf</b><span>asks, never tells</span></div></div>
        <h4>Your thinking</h4>
        <div id="lc-skills">${SKILLS_CHAT.map((k) => `<div class="lc-skill" data-k="${k[0]}"><div><b>${k[1]}</b><span>${k[2]}</span></div><div class="bar thin"><i></i></div></div>`).join("")}</div>
        <p class="lc-tip" id="lc-tip">Leaf grows a question from each thought. Reasons, risks and the other side make your plant bloom.</p>
        <button class="btn btn-secondary btn-small" id="lc-reset" type="button">Start a fresh path</button>
      </aside>
      <form class="lc-pad" id="lc-form">
        <div class="lc-chips" id="lc-chips"><button type="button" data-i="challenge">Challenge my idea</button><button type="button" data-i="other">Show me the other side</button><button type="button" data-i="missing">What am I missing?</button><button type="button" data-i="explain">Explain a money word</button></div>
        <div class="lc-note"><textarea id="lc-in" rows="2" placeholder="Write a thought. Leaf will grow a question from it." aria-label="Your thought"></textarea><button class="btn" type="submit">Plant it</button></div>
        <p class="lc-fine">Leaf is a practice partner that runs in your browser. It asks questions to build your reasoning and never gives buy or sell advice.</p>
      </form>
    </div>`;
  }

  function initLeafChat(root) {
    const box = $("#leafchat", root); if (!box) return;
    const path = $("#lc-path", box), input = $("#lc-in", box), form = $("#lc-form", box);
    let s = leafLoad(), busy = false;
    const name = firstName || "there";
    const leafArt = () => window.MintlyArt ? MintlyArt.render("leaf") : "";

    function row(m, animate) {
      const r = document.createElement("div"); r.className = "lc-row " + (m.who === "me" ? "lc-me" : "lc-leaf") + (animate ? " grow" : "");
      r.innerHTML = m.who === "me" ? `<div class="lc-node"></div><div class="lc-card">${esc(m.text)}</div>` : `<div class="lc-card">${esc(m.text)}</div><div class="lc-node"><span class="art">${leafArt()}</span></div>`;
      path.appendChild(r); return r;
    }
    function skills() {
      $$(".lc-skill", box).forEach((e) => { const h = s.hits[e.dataset.k]; $(".bar i", e).style.width = Math.min(100, h * 45) + "%"; e.classList.toggle("on", h > 0); });
      const missing = SKILLS_CHAT.filter((k) => !s.hits[k[0]]).map((k) => k[1].toLowerCase());
      const left = Math.max(0, Mintly.FREE_LEAF_QUESTIONS - s.msgs.filter((m) => m.who === "me").length);
      const freeNote = member ? "" : (left ? left + " free question" + (left === 1 ? "" : "s") + " left. " : "Free questions used. ");
      $("#lc-tip", box).textContent = freeNote + (!s.turns ? "Leaf grows a question from each thought. Reasons, risks and the other side make your plant bloom." : missing.length ? "Still to show: " + missing.join(", ") + "." : "Full bloom. You gave reasons, named a risk and weighed the other side.");
    }
    function scroll() { const b = path.parentNode; b.scrollTo({ top: b.scrollHeight, behavior: "smooth" }); }
    function render() {
      path.innerHTML = "";
      if (!s.msgs.length) s.msgs.push({ who: "leaf", text: "Hi " + name + ". I'm Leaf. I know a lot of money topics, from budgeting and credit to stocks and scams, and I'll ask questions until your thinking holds up. Ask me about something, or tell me what you're trying to decide." });
      s.msgs.forEach((m) => row(m)); skills(); scroll();
    }
    function leafSay(text, done) {
      busy = true;
      const r = document.createElement("div"); r.className = "lc-row lc-leaf grow"; r.innerHTML = `<div class="lc-card lc-think"><i></i><i></i><i></i></div><div class="lc-node"><span class="art">${leafArt()}</span></div>`;
      path.appendChild(r); scroll();
      setTimeout(() => {
        const card = $(".lc-card", r); card.className = "lc-card"; card.textContent = "";
        const w = text.split(" "); let i = 0;
        const t = setInterval(() => { i++; card.textContent = w.slice(0, i).join(" "); scroll(); if (i >= w.length) { clearInterval(t); busy = false; if (done) done(); } }, 38);
      }, 700 + Math.min(900, text.length * 6));
    }
    function showPaywall() {
      if ($(".lc-paywall", path)) return scroll();
      const p = document.createElement("div"); p.className = "lc-paywall";
      p.innerHTML = '<h3>That was your three free questions.</h3><p>Members get unlimited chats with Leaf, plus all ten lessons, their films and the dashboards.</p><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><a class="btn" href="pricing.html?from=leaf">See plans</a><a class="btn btn-secondary" href="signin.html">I have an account</a></div>';
      path.appendChild(p); scroll();
    }
    function send(text, intent) {
      if (busy) return; text = text.trim();
      if (!member && s.msgs.filter((m) => m.who === "me").length >= Mintly.FREE_LEAF_QUESTIONS) return showPaywall(); if (!text && !["missing", "challenge", "other", "explain"].includes(intent)) return;
      const shown = text || ({ challenge: "Challenge my idea.", other: "Show me the other side.", missing: "What am I missing?", explain: "Explain a money word." }[intent]);
      const m = { who: "me", text: shown }; row(m, true); scroll();
      const reply = leafReply(text || "", s, intent && !text ? intent : null);
      s.msgs.push(m); s.msgs.push({ who: "leaf", text: reply }); skills(); leafSave(s); Mintly.touchDay();
      leafSay(reply, () => { if (s.celebrate) { s.celebrate = false; leafSave(s); Mintly.confetti(40); Mintly.toast("Full bloom: reason, risk and the other side."); } });
    }
    form.addEventListener("submit", (e) => { e.preventDefault(); const v = input.value; input.value = ""; send(v); });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
    $("#lc-chips", box).addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) send("", b.dataset.i); });
    $("#lc-reset", box).addEventListener("click", () => { if (busy) return; s = { msgs: [], hits: { evidence: 0, risk: 0, other: 0, clarity: 0 }, turns: 0, topic: null, celebrated: false }; leafSave(s); render(); });
    render();
  }


  // ---------- Admin insights: what learners are into, drawn as a graph ----------
  const CAT_COLORS = { basics: "#6B7280", budgeting: "#1C6847", saving: "#0F8A4E", banking: "#2B4AA3", borrowing: "#A94A18", investing: "#7C3AA8", crypto: "#C0124F", collectibles: "#B8860B", earning: "#0B6E8A", scams: "#B3261E", planning: "#5D5F6B" };
  const catName = (c) => c[0].toUpperCase() + c.slice(1);
  const ago = (ts) => { const m = Math.max(1, Math.round((Date.now() - ts) / 60000)); return m < 60 ? m + " min ago" : m < 1440 ? Math.round(m / 60) + " h ago" : Math.round(m / 1440) + " d ago"; };
  const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; };

  function drawGraph(el, data, pick) {
    const W = 820, H = 560, cx = W / 2, cy = H / 2, RX = 300, RY = 205;
    const cats = data.interests, maxS = Math.max(1, ...cats.map((c) => c.score));
    const cpos = {};
    cats.forEach((c, i) => { const a = (i / cats.length) * Math.PI * 2 - Math.PI / 2; cpos[c.cat] = { x: cx + RX * Math.cos(a), y: cy + RY * Math.sin(a), r: 20 + 26 * Math.sqrt(c.score / maxS), c }; });
    const byUid = {}; data.links.forEach((l) => (byUid[l.uid] ||= []).push(l));
    const nodes = data.learners.filter((l) => byUid[l.uid]).map((l) => {
      let sx = 0, sy = 0, sw = 0; byUid[l.uid].forEach((k) => { const p = cpos[k.cat]; if (p) { sx += p.x * k.w; sy += p.y * k.w; sw += k.w; } });
      const tx = sw ? sx / sw : cx, ty = sw ? sy / sw : cy;
      return { l, tx, ty, x: tx + (hash(l.uid) - .5) * 70, y: ty + (hash(l.uid + "y") - .5) * 70, r: 4 + Math.min(6, l.events / 14) };
    });
    for (let it = 0; it < 90; it++) {
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || .01, min = a.r + b.r + 3;
        if (d < min) { const f = (min - d) / 2 / d; a.x -= dx * f; a.y -= dy * f; b.x += dx * f; b.y += dy * f; }
      }
      nodes.forEach((n) => { n.x += (n.tx - n.x) * .03; n.y += (n.ty - n.y) * .03; n.x = Math.max(14, Math.min(W - 14, n.x)); n.y = Math.max(14, Math.min(H - 14, n.y)); });
    }
    const idx = Object.fromEntries(nodes.map((n) => [n.l.uid, n]));
    const edges = data.links.filter((k) => idx[k.uid] && cpos[k.cat]).map((k) => `<line data-u="${k.uid}" data-c="${k.cat}" x1="${idx[k.uid].x.toFixed(1)}" y1="${idx[k.uid].y.toFixed(1)}" x2="${cpos[k.cat].x.toFixed(1)}" y2="${cpos[k.cat].y.toFixed(1)}" stroke="${CAT_COLORS[k.cat]}" stroke-opacity="${(.1 + k.w * .3).toFixed(2)}" stroke-width="${(.6 + k.w * 1.4).toFixed(1)}"/>`).join("");
    const catSvg = cats.map((c) => { const p = cpos[c.cat]; return `<g class="gc" data-c="${c.cat}" style="cursor:pointer"><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r.toFixed(1)}" fill="${CAT_COLORS[c.cat]}" fill-opacity=".92"/><text x="${p.x.toFixed(1)}" y="${(p.y + p.r + 15).toFixed(1)}" text-anchor="middle" fill="var(--ink)" style="font:600 12px var(--fb);pointer-events:none">${catName(c.cat)}</text><title>${catName(c.cat)}: ${c.learners} learners</title></g>`; }).join("");
    const dots = nodes.map((n) => `<circle class="gl" data-u="${n.l.uid}" cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${n.r.toFixed(1)}" fill="${CAT_COLORS[n.l.top] || "#888"}" stroke="var(--panel)" stroke-width="1.5" style="cursor:pointer"><title>Learner ${n.l.uid.slice(-6)} · ${n.l.events} events</title></circle>`).join("");
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="ins-graph" role="img" aria-label="Graph connecting learners to the money topics they are interested in">${edges}${dots}${catSvg}</svg>`;
    const svg = el.firstChild;
    const focus = (u, c) => { svg.querySelectorAll("line").forEach((e) => { const on = (!u && !c) || e.dataset.u === u || e.dataset.c === c; e.style.opacity = on ? 1 : .08; }); svg.querySelectorAll(".gl").forEach((e) => { const l = byUid[e.dataset.u] || []; e.style.opacity = (!u && !c) || e.dataset.u === u || (c && l.some((k) => k.cat === c)) ? 1 : .15; }); };
    svg.addEventListener("click", (e) => { const t = e.target.closest(".gl, .gc"); if (!t) { focus(); pick(null); return; } if (t.classList.contains("gl")) { focus(t.dataset.u); pick({ u: t.dataset.u }); } else { focus(null, t.dataset.c); pick({ c: t.dataset.c }); } });
  }

  function renderInsights(root, data, state) {
    const t = data.totals, top = data.interests[0];
    const pct = (x, tot) => (tot ? Math.round(x / tot * 100) : 0);
    const maxScore = Math.max(1, ...data.interests.map((c) => c.score));
    const lessonRows = data.lessons.map((l) => `<tr><td>${l.id.replace("lesson-", "Lesson ")}</td><td>${catName(l.cat)}</td><td>${l.views}</td><td>${l.films}</td><td>${l.complete}</td><td>${l.avgQuiz == null ? "–" : l.avgQuiz + "%"}</td></tr>`).join("");
    root.innerHTML = `<div class="grid">
      <section class="card c12 ins-bar"><div class="row" style="justify-content:space-between;width:100%"><div class="row" style="gap:12px"><span class="pill ${state.live ? "good" : "warn"}">${state.live ? "Live data" : "Sample data"}</span><span class="muted" style="font-size:13.5px">${state.note}</span></div>
        <div class="row" style="gap:8px"><input id="ins-key" type="password" autocomplete="off" placeholder="Admin key" value="${esc(sessionStorage.getItem("mintly:adminkey") || "")}" aria-label="Admin key" style="border:1.5px solid var(--border);border-radius:10px;padding:8px 12px;background:var(--bg);font-size:14px;width:190px"><button class="btn btn-small" id="ins-connect" type="button">Connect</button><button class="btn btn-secondary btn-small" id="ins-csv" type="button">Export CSV</button></div></div></section>
      <section class="card c3"><div class="kpi"><span class="lbl">Learners</span><div class="stat-big">${t.learners}</div><span class="stat-sub">${t.active7d} active this week</span></div></section>
      <section class="card c3"><div class="kpi"><span class="lbl">Top interest</span><div class="stat-big" style="font-size:30px">${top ? catName(top.cat) : "–"}</div><span class="stat-sub">${top ? top.learners + " learners" : "no data yet"}</span></div></section>
      <section class="card c3"><div class="kpi"><span class="lbl">Lessons completed</span><div class="stat-big">${t.completions}</div><span class="stat-sub">across all learners</span></div></section>
      <section class="card c3"><div class="kpi"><span class="lbl">Events recorded</span><div class="stat-big">${t.events.toLocaleString()}</div><span class="stat-sub">topics and activity only</span></div></section>
      <section class="card c8"><div class="card-h"><h3>The financial user graph</h3><span class="muted" style="font-size:13px">Each dot is a learner. Click a dot or a topic.</span></div><div id="ins-graph"></div><div class="legend">${data.interests.map((c) => `<span><i style="background:${CAT_COLORS[c.cat]}"></i>${catName(c.cat)}</span>`).join("")}</div></section>
      <section class="card c4"><div class="card-h"><h3 id="ins-side-h">What they like</h3></div><div id="ins-side"></div></section>
      <section class="card c6"><div class="card-h"><h3>Interest ranking</h3></div>${data.interests.map((c) => `<div class="skill" style="grid-template-columns:96px 1fr 44px"><span>${catName(c.cat)}</span><div class="bar"><i style="width:${Math.round(c.score / maxScore * 100)}%;background:${CAT_COLORS[c.cat]}"></i></div><span>${c.learners}</span></div>`).join("") || '<p class="muted">No activity yet.</p>'}<p class="muted" style="font-size:12.5px;margin:10px 0 0">Bars show weighted interest. The number is how many learners.</p></section>
      <section class="card c6"><div class="card-h"><h3>Lesson funnel</h3></div><div class="table-wrap"><table class="tbl"><thead><tr><th>Lesson</th><th>Topic</th><th>Opened</th><th>Film</th><th>Done</th><th>Quiz</th></tr></thead><tbody>${lessonRows}</tbody></table></div></section>
      <section class="card c12"><div class="card-h"><h3>Topics learners ask Leaf about</h3></div><div class="chip-row" style="margin:0">${data.leafTopics.map((x) => `<span class="pill" style="font-size:13px">${esc(catName(x.key))} <b>${x.count}</b></span>`).join("") || '<span class="muted">Nothing yet.</span>'}</div></section>
    </div>`;
    const side = $("#ins-side", root), sideH = $("#ins-side-h", root);
    const overall = () => { sideH.textContent = "What they like"; side.innerHTML = data.interests.slice(0, 5).map((c, i) => `<div class="list-row"><span class="rk">${i + 1}</span><i class="sw2" style="background:${CAT_COLORS[c.cat]}"></i><b>${catName(c.cat)}</b><span class="muted">${pct(c.learners, t.learners)}% of learners</span></div>`).join("") || '<p class="muted">No activity yet.</p>'; };
    drawGraph($("#ins-graph", root), data, (sel) => {
      if (!sel) return overall();
      if (sel.c) { const who = data.learners.filter((l) => l.top === sel.c); sideH.textContent = catName(sel.c); side.innerHTML = `<p class="muted" style="margin:0 0 10px">${who.length} learners have this as their top interest.</p>` + who.slice(0, 8).map((l) => `<div class="list-row"><i class="sw2" style="background:${CAT_COLORS[sel.c]}"></i><b>Learner ${l.uid.slice(-6)}</b><span class="muted">${l.events} events</span></div>`).join(""); return; }
      const l = data.learners.find((x) => x.uid === sel.u); if (!l) return;
      const ent = Object.entries(l.interests).sort((a, b) => b[1] - a[1]), mx = ent.length ? ent[0][1] : 1;
      sideH.textContent = "Learner " + l.uid.slice(-6);
      side.innerHTML = `<p class="muted" style="margin:0 0 12px;font-size:13.5px">${esc(l.role)}${l.plan ? " · " + esc(l.plan) + " plan" : " · free"} · ${l.events} events · last seen ${ago(l.lastSeen)}</p>` + ent.map(([c, v]) => `<div class="skill" style="grid-template-columns:86px 1fr 28px"><span>${catName(c)}</span><div class="bar thin"><i style="width:${Math.round(v / mx * 100)}%;background:${CAT_COLORS[c]}"></i></div><span>${v}</span></div>`).join("") + `<p class="muted" style="margin:12px 0 4px;font-size:13px">Lessons finished: <b style="color:var(--ink)">${l.completed}</b> of 10</p>`;
    });
    overall();
    $("#ins-connect", root).addEventListener("click", () => { sessionStorage.setItem("mintly:adminkey", $("#ins-key", root).value.trim()); loadInsights(root.parentNode.parentNode || root); });
    $("#ins-csv", root).addEventListener("click", async () => {
      let csv;
      if (state.live) { const r = await fetch("/api/admin/export.csv?days=90", { headers: { Authorization: "Bearer " + sessionStorage.getItem("mintly:adminkey") } }); csv = await r.text(); }
      else { const core = await import("./api-core.mjs"); csv = core.toCsv(data); }
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "mintly-learners" + (state.live ? "" : "-sample") + ".csv"; a.click();
    });
    animate(root);
  }

  async function loadInsights(main) {
    const root = $("#insroot", main) || main.querySelector("#insroot"); if (!root) return;
    const key = sessionStorage.getItem("mintly:adminkey");
    let data = null, live = false, note = "";
    let backend = false; try { backend = (await (await fetch("/api/health")).json()).backend === true; } catch (e) {}
    if (backend && key) {
      try { const r = await fetch("/api/admin/insights?days=90", { headers: { Authorization: "Bearer " + key } }); if (r.ok) { data = await r.json(); live = true; note = "Pseudonymous learners. Topics and activity only, never what they type."; } else note = r.status === 401 ? "That admin key was rejected. Showing sample data." : "Backend error " + r.status + ". Showing sample data."; } catch (e) { note = "Couldn't reach the backend. Showing sample data."; }
    } else note = backend ? "Backend found. Enter your admin key to load real learners. Sample data shown." : "No backend connected (see BACKEND.md). Showing sample data so you can see what this will look like.";
    if (!data) { const core = await import("./api-core.mjs"); data = core.insights(core.sampleEvents()); }
    renderInsights(root, data, { live, note });
  }

  // ---------- render ----------
  let role = MintlyTheme.getRole(), page = null;
  const isAdmin = !!(user && user.role === "admin");
  if (role === "admin" && !isAdmin) { role = "student"; MintlyTheme.setRole("student"); }
  if (isAdmin && !new URLSearchParams(location.search).get("role")) { role = "admin"; MintlyTheme.setRole("admin"); }

  function renderSide() {
    const v = VIEWS[role];
    const nm = signedIn ? user.name : { student: "Maya Lopez", parent: "The Lopez family", teacher: "Ms. Alvarez", admin: "Admin" }[role];
    $("#dash-side").innerHTML = `<div class="dash-who"><div class="avatar">${esc(nm[0])}</div><div><b>${esc(nm)}</b><span>${role[0].toUpperCase() + role.slice(1)}${signedIn ? "" : " · guest"}</span></div></div>
      <div class="side-sec">Menu</div>${v.nav.map((n) => `<button class="side-link" data-page="${n[0]}" aria-current="${n[0] === page}">${ICON[n[2]]}${n[1]}</button>`).join("")}
      <div class="side-foot">${member ? `<b>${Mintly.planName() || "Member"} plan</b>Everything is unlocked.` : signedIn ? `<b>Free preview</b><a href='pricing.html' style='color:var(--acc);font-weight:600'>Unlock all ten lessons →</a>` : `<b>Save your progress</b><a href='signin.html' style='color:var(--acc);font-weight:600'>Create an account →</a>`}</div>`;
  }

  function render(first) {
    const v = VIEWS[role];
    if (!page || !v.pages[page]) page = v.nav[0][0];
    renderSide();
    const main = $("#dash-main");
    main.innerHTML = `<div class="dash-top"><div><h1>${v.title()}</h1><p>${v.sub()}</p></div><div class="dash-actions"><div class="seg" role="group" aria-label="View as">${(isAdmin ? ["admin", "student", "parent", "teacher"] : ["student", "parent", "teacher"]).map((r) => `<button type="button" data-role="${r}" aria-pressed="${r === role}">${r[0].toUpperCase() + r.slice(1)}</button>`).join("")}</div></div></div><div id="view" class="tabs-p on">${v.pages[page]()}</div>`;
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
    $$("[data-reset]", main).forEach((b) => b.addEventListener("click", () => { Mintly.resetProgress(b.dataset.reset); Mintly.toast("Progress reset for " + b.dataset.reset); }));
    $$("[data-del]", main).forEach((b) => b.addEventListener("click", () => { if (confirm("Delete " + b.dataset.del + "?")) { Mintly.removeUser(b.dataset.del); render(); } }));
    $$("[data-export]", main).forEach((b) => b.addEventListener("click", () => { const out = Object.values(Mintly.allUsers()).filter((u) => !u.demo).map((u) => ({ name: u.name, email: u.email, role: u.role, plan: u.plan })); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" })); a.download = "mintly-accounts.json"; a.click(); }));
    $$("[data-wipe]", main).forEach((b) => b.addEventListener("click", () => { if (confirm("Erase all Mintly data in this browser?")) { Object.keys(localStorage).filter((k) => k.startsWith("mintly:")).forEach((k) => localStorage.removeItem(k)); location.href = "index.html"; } }));
    initLeafChat(main);
    if ($("#insroot", main)) loadInsights(main);
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
        $("tbody", table).innerHTML = rows.map((r) => `<tr><td><div class="nm"><span class="avatar">${esc(r.name[0])}</span>${esc(r.name)}</div></td><td>${r.done}/10</td><td><div style="display:flex;gap:10px;align-items:center"><div class="bar"><i style="width:${r.score}%"></i></div><b>${r.score}</b></div></td><td><span class="pill ${r.score < 60 ? "warn" : ""}">${r.weak}</span></td></tr>`).join("") || `<tr><td colspan="4" class="muted">No students match.</td></tr>`;
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
