const Mintly = (() => {
  const PROGRESS_PREFIX = "mintly:completed:";
  const USERS_KEY = "mintly:users";
  const SESSION_KEY = "mintly:session";
  const INTEREST_PREFIX = "mintly:interest:";
  // The Financial Literacy course, in order. Add a lesson here and it shows up in the course
  // list, progress counts, "Continue learning" links and the locked-course messages.
  const LESSONS = [
    { id: "lesson-1", title: "What is financial literacy?", mins: 20 },
    { id: "lesson-2", title: "Needs vs. wants: building a simple budget", mins: 10 },
    { id: "lesson-3", title: "Saving for something you want", mins: 12 },
    { id: "lesson-4", title: "How banks work: accounts, debit cards and interest", mins: 12 },
    { id: "lesson-5", title: "Intro to investing: stocks, risk and diversification", mins: 15 },
    { id: "lesson-6", title: "Credit, debt and borrowing", mins: 14, unit: 2 },
    { id: "lesson-7", title: "Compound interest and the power of time", mins: 14, unit: 2 },
    { id: "lesson-8", title: "Paychecks and taxes: why take-home is smaller", mins: 12, unit: 2 },
    { id: "lesson-9", title: "Scams, fraud and staying safe", mins: 12, unit: 2 },
    { id: "lesson-10", title: "Build your own money plan", mins: 16, unit: 2 },
  ];
  const LESSON_IDS = LESSONS.map((l) => l.id);

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  // --- Shared chrome: every page has an empty #site-header and #site-footer, filled in here so the
  // navigation and footer are edited in one place. ---
  const NAV = [
    ["Home", "index.html"], ["Learn", "lessons/lesson-1.html"], ["Explore", "lessons/explore.html"],
    ["Leaf AI", "leaf.html"], ["Dashboard", "dashboard.html"], ["For Parents", "parents.html"], ["Pricing", "pricing.html"],
  ];

  function renderChrome() {
    const main = document.querySelector("main");
    if (main && !main.id) main.id = "main";
    if (main && !document.querySelector(".skip")) { const a = document.createElement("a"); a.className = "skip"; a.href = "#main"; a.textContent = "Skip to content"; document.body.prepend(a); }
    const up = location.pathname.includes("/lessons/") ? "../" : "";
    const header = document.getElementById("site-header");
    if (header) {
      header.className = "site-header";
      header.innerHTML =
        '<div class="wrap navbar">' +
        '<a class="brand" href="' + up + 'index.html" aria-label="Mintly home"><img src="' + up + 'assets/logo.svg" alt="" width="34" height="34"><span class="brand-name">mintly</span></a>' +
        '<ul class="nav-links">' + NAV.map(([label, href]) => '<li><a href="' + up + href + '">' + label + "</a></li>").join("") + "</ul>" +
        '<div class="nav-right"><div class="nav-auth" id="nav-auth"></div></div></div>';
    }
    const footer = document.getElementById("site-footer");
    if (footer) {
      footer.className = "site-footer";
      footer.innerHTML =
        '<div class="wrap foot-grid"><div class="foot-brand">' +
        '<a class="brand" href="' + up + 'index.html"><img src="' + up + 'assets/logo.svg" alt="" width="34" height="34"><span class="brand-name">mintly</span></a>' +
        "<p>Mintly doesn't teach young people what to think about money. It teaches them how to think when making financial decisions.</p>" +
        "<p>Not a brokerage. Everything is simulated, uses practice data and is not financial advice.</p></div>" +
        '<div class="foot-links"><div><b>Learn</b><a href="' + up + 'lessons/financial-literacy.html">Financial Literacy</a><a href="' + up + 'lessons/explore.html">Explore</a><a href="' + up + 'leaf.html">Leaf AI</a></div>' +
        '<div><b>For everyone</b><a href="' + up + 'dashboard.html?role=student">Student dashboard</a><a href="' + up + 'dashboard.html?role=parent">Parent dashboard</a><a href="' + up + 'dashboard.html?role=teacher">Teacher dashboard</a></div>' +
        '<div><b>Company</b><a href="' + up + 'parents.html">For parents</a><a href="' + up + 'pricing.html">Pricing</a><a href="' + up + 'privacy.html">Privacy</a><a href="' + up + 'mintly.demo.html?from=site">Watch the demo</a></div></div></div>';
    }
  }

  // --- Auth (demo only: accounts live in this browser's localStorage,
  // not a real server. Do not reuse this pattern for real passwords.) ---

  // Ready-made demo accounts so nobody has to sign up to look around. These live in the page's code,
  // so they are NOT secure and exist only for this front-end demo. Replace with real auth before launch.
  const DEMO_PASSWORD = "mintly-demo";
  const DEMO_USERS = {
    "student@mintly.demo": { name: "Maya Lopez", email: "student@mintly.demo", password: DEMO_PASSWORD, plan: "premium", role: "student", demo: true },
    "parent@mintly.demo": { name: "Dana Lopez", email: "parent@mintly.demo", password: DEMO_PASSWORD, plan: "family", role: "parent", demo: true },
    "teacher@mintly.demo": { name: "Ms. Alvarez", email: "teacher@mintly.demo", password: DEMO_PASSWORD, plan: "school", role: "teacher", demo: true },
    "admin@mintly.demo": { name: "Mintly Admin", email: "admin@mintly.demo", password: DEMO_PASSWORD, plan: "pro", role: "admin", demo: true },
  };

  function getUsers() {
    return Object.assign({}, DEMO_USERS, readJSON(USERS_KEY, {}));
  }

  // First sign-in to the demo student gets a little progress so the dashboard isn't empty.
  function seedDemoProgress(email) {
    if (email !== "student@mintly.demo" || localStorage.getItem("mintly:seeded:" + email)) return;
    try {
      ["lesson-1", "lesson-2", "lesson-3"].forEach((id, i) => {
        localStorage.setItem(PROGRESS_PREFIX + email + ":" + id, "true");
        localStorage.setItem("mintly:quiz:" + email + ":" + id, JSON.stringify({ c: [5, 6, 7][i] - (i === 1 ? 1 : 0), t: [5, 7, 7][i] }));
      });
      const days = [], d = new Date();
      for (let k = 0; k < 4; k++) { days.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() - 1); }
      localStorage.setItem("mintly:days:" + email, JSON.stringify(days));
      localStorage.setItem("mintly:seeded:" + email, "1");
    } catch (e) {}
  }

  function currentUser() {
    const email = localStorage.getItem(SESSION_KEY);
    if (!email) return null;
    const users = getUsers();
    return users[email] || null;
  }

  function progressScope() {
    const user = currentUser();
    return user ? user.email : "guest";
  }

  function signUp({ name, email, password, plan, role }) {
    email = (email || "").trim().toLowerCase();
    if (!name || !email || !password) {
      return { ok: false, error: "Please fill in every field." };
    }
    const users = getUsers();
    if (users[email]) {
      return { ok: false, error: "An account with that email already exists." };
    }

    const guestCompleted = LESSON_IDS.filter((id) =>
      localStorage.getItem(PROGRESS_PREFIX + "guest:" + id) === "true"
    );

    users[email] = { name, email, password, plan: plan || null, role: ["student", "parent", "teacher"].includes(role) ? role : "student" };
    writeJSON(USERS_KEY, users);
    localStorage.setItem(SESSION_KEY, email);

    guestCompleted.forEach((id) => markLessonComplete(id));

    return { ok: true };
  }

  function logIn({ email, password }) {
    email = (email || "").trim().toLowerCase();
    const users = getUsers();
    const user = users[email];
    if (!user || user.password !== password) {
      return { ok: false, error: "That email and password don't match." };
    }
    localStorage.setItem(SESSION_KEY, email);
    seedDemoProgress(email);
    return { ok: true };
  }

  // Where to go after signing in: the dashboard for the account's role (also switches the site's role colour).
  function landingPage() {
    const u = currentUser();
    const role = (u && u.role) || "student";
    if (window.MintlyTheme) MintlyTheme.setRole(role);
    return "dashboard.html?role=" + role;
  }

  function allUsers() { return getUsers(); }
  function removeUser(email) {
    const users = readJSON(USERS_KEY, {}); delete users[email]; writeJSON(USERS_KEY, users);
  }
  function resetProgress(email) {
    const drop = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.includes(":" + email) && /^mintly:(completed|quiz|days|interest|seeded)/.test(k)) drop.push(k); }
    drop.forEach((k) => localStorage.removeItem(k));
  }
  function logOut() {
    localStorage.removeItem(SESSION_KEY);
  }

  function setPlan(plan) {
    const email = localStorage.getItem(SESSION_KEY);
    if (!email) return;
    const users = getUsers();
    if (!users[email]) return;
    users[email].plan = plan;
    writeJSON(USERS_KEY, users);
  }

  // ---- Paywall: Lesson 1 is the free taste; everything else needs a plan. ----
  // NOTE: this gate lives in the browser, so it is a product experience, not security. Real enforcement needs a server.
  const FREE_LESSONS = ["lesson-1"];
  const FREE_LEAF_QUESTIONS = 3;
  const PLAN_NAMES = { family: "Starter", premium: "Plus", pro: "Family Pro", school: "School" };
  // When you create Stripe Payment Links, paste them here. A signed-up customer is sent to their plan's link.
  const PAYMENT_LINKS = { family: "", premium: "", pro: "", school: "" };
  function canAccess(lessonId) { return FREE_LESSONS.includes(lessonId) || hasActivePlan(); }
  function checkoutUrl(plan) { return PAYMENT_LINKS[plan] || ""; }
  function planName() { const u = currentUser(); return u && u.plan ? PLAN_NAMES[u.plan] || u.plan : null; }

  function hasActivePlan() {
    const user = currentUser();
    return !!(user && user.plan);
  }

  function rootPath(page) {
    return location.pathname.includes("/lessons/") ? "../" + page : page;
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderNavAuth(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const user = currentUser();
    const signinHref = rootPath("signin.html");
    if (user) {
      const firstName = escapeHTML(user.name.split(" ")[0]);
      el.innerHTML =
        '<span class="nav-account-link">Hi, ' + firstName + '</span>' +
        '<button class="btn-dark" id="nav-logout-btn">Log out</button>';
      document.getElementById("nav-logout-btn").addEventListener("click", () => {
        logOut();
        window.location.href = rootPath("index.html");
      });
    } else {
      el.innerHTML =
        '<a class="btn-dark" href="' + signinHref + '">Log in or sign up</a>';
    }
  }

  // --- Lesson progress (scoped to the signed-in account, or "guest") ---

  function isLessonComplete(id) {
    return localStorage.getItem(PROGRESS_PREFIX + progressScope() + ":" + id) === "true";
  }

  function markLessonComplete(id) {
    try {
      localStorage.setItem(PROGRESS_PREFIX + progressScope() + ":" + id, "true");
    } catch (e) {}
  }

  function completedCount() {
    return LESSON_IDS.filter(isLessonComplete).length;
  }

  function isCourseComplete() {
    return completedCount() === LESSON_IDS.length;
  }

  // The first lesson not yet completed (or lesson 1 again once everything is done).
  function nextLesson() {
    return LESSONS.find((l) => !isLessonComplete(l.id)) || LESSONS[0];
  }

  // --- Progress stats shared by the dashboards: XP, level, streak, quiz accuracy ---

  const QUIZ_PREFIX = "mintly:quiz:", DAYS_PREFIX = "mintly:days:";
  const dayKey = (d) => d.toISOString().slice(0, 10);

  function touchDay() {
    const k = DAYS_PREFIX + progressScope(), days = readJSON(k, []), today = dayKey(new Date());
    if (!days.includes(today)) { days.push(today); writeJSON(k, days.slice(-120)); }
  }

  function streak() {
    const days = new Set(readJSON(DAYS_PREFIX + progressScope(), []));
    let n = 0; const d = new Date();
    if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
    while (days.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  function quizResult(id) { return readJSON(QUIZ_PREFIX + progressScope() + ":" + id, null); }
  function saveQuizResult(id, correct, total) { writeJSON(QUIZ_PREFIX + progressScope() + ":" + id, { c: correct, t: total }); }

  function stats() {
    const done = completedCount(), total = LESSON_IDS.length;
    let qc = 0, qt = 0;
    LESSON_IDS.forEach((id) => { const r = quizResult(id); if (r) { qc += r.c; qt += r.t; } });
    const xp = done * 100 + qc * 10;
    return { done, total, xp, level: Math.floor(xp / 150) + 1, intoLevel: xp % 150, streak: streak(), quizCorrect: qc, quizTotal: qt, accuracy: qt ? Math.round(qc / qt * 100) : null };
  }

  function toast(msg) {
    let stack = document.querySelector(".toast-stack");
    if (!stack) { stack = document.createElement("div"); stack.className = "toast-stack"; stack.setAttribute("aria-live", "polite"); document.body.appendChild(stack); }
    const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; stack.appendChild(t);
    setTimeout(() => t.remove(), 2800);
  }

  // --- Analytics (opt-in). Counts which lessons and topics get used so Mintly can improve.
  // It never sends anything a learner types, and the id is random, not a name or email. ---
  const CONSENT_KEY = "mintly:consent", UID_KEY = "mintly:uid";
  const TOPIC_CAT = { sneakers: "collectibles", "trading cards": "collectibles", crypto: "crypto" };
  const trackQueue = []; let trackTimer = 0;
  function trackUid() {
    let id = null;
    try { id = localStorage.getItem(UID_KEY); if (!id) { id = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, "0")).join(""); localStorage.setItem(UID_KEY, id); } } catch (e) {}
    return id || "anon" + Math.random().toString(36).slice(2, 12);
  }
  const consent = () => { try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; } };
  function flushTrack() {
    if (!trackQueue.length) return;
    const u = currentUser();
    const body = JSON.stringify({ uid: trackUid(), role: (u && u.role) || "guest", plan: (u && u.plan) || null, events: trackQueue.splice(0, 40) });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
      else fetch("/api/events", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
    } catch (e) {}
  }
  function track(type, key, value) {
    const au = currentUser();
    if (consent() !== "yes" || location.protocol === "file:" || (au && au.role === "admin")) return;
    trackQueue.push({ type, key: String(key == null ? "" : key).slice(0, 64), value: value == null ? null : +value, ts: Date.now() });
    clearTimeout(trackTimer); trackTimer = setTimeout(flushTrack, 2500);
  }
  addEventListener("pagehide", flushTrack);
  document.addEventListener("visibilitychange", () => { if (document.hidden) flushTrack(); });
  document.addEventListener("lf:play", (e) => { const t = e.target && e.target.dataset && e.target.dataset.film; if (t) track("film_play", t); });

  function consentBanner() {
    const cu = currentUser();
    if (consent() || document.body.classList.contains("film") || (cu && cu.role === "admin")) return;
    const up = location.pathname.includes("/lessons/") ? "../" : "";
    const b = document.createElement("div");
    b.className = "consent"; b.setAttribute("role", "dialog"); b.setAttribute("aria-label", "Privacy choice");
    b.innerHTML = '<p><b>Help us make Mintly better?</b> With your OK, we count which lessons and topics get used. We never store what you type, and it isn\'t linked to your name. If you\'re under 13, ask a parent or guardian. <a href="' + up + 'privacy.html">Details</a></p><div><button class="btn btn-small" data-c="yes" type="button">Okay</button><button class="btn btn-secondary btn-small" data-c="no" type="button">No thanks</button></div>';
    b.addEventListener("click", (e) => { const c = e.target.closest("[data-c]"); if (!c) return; try { localStorage.setItem(CONSENT_KEY, c.dataset.c); } catch (er) {} b.remove(); if (c.dataset.c === "yes") track("page_view", pageKey()); });
    document.body.appendChild(b);
  }
  const pageKey = () => (location.pathname.replace(/^\//, "").replace(/\.html$/, "") || "index").slice(0, 60);

  // --- Research interest (what the user chose to learn about on Explore) ---

  function saveInterest(interest) {
    writeJSON(INTEREST_PREFIX + progressScope(), interest);
    const topic = String((interest && (interest.topic || interest.interest)) || interest || "").toLowerCase();
    if (TOPIC_CAT[topic]) track("explore_interest", TOPIC_CAT[topic]);
  }

  function getInterest() {
    return readJSON(INTEREST_PREFIX + progressScope(), null);
  }

  // Phones hide .nav-links, so add a menu button that shows them as a dropdown.
  function setupMobileNav() {
    const nav = document.querySelector(".navbar");
    const links = nav && nav.querySelector(".nav-links");
    const right = nav && nav.querySelector(".nav-right");
    if (!links || !right) return;
    links.id = links.id || "nav-links";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nav-toggle";
    btn.setAttribute("aria-label", "Menu");
    btn.setAttribute("aria-controls", links.id);
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = "<span></span><span></span><span></span>";
    btn.addEventListener("click", () => {
      btn.setAttribute("aria-expanded", String(nav.classList.toggle("nav-open")));
    });
    right.appendChild(btn);
    const close = () => {
      nav.classList.remove("nav-open");
      btn.setAttribute("aria-expanded", "false");
    };
    // close the menu after a tap on a link (needed for same-page links like #simulate) or on Escape
    links.addEventListener("click", (e) => { if (e.target.closest("a")) close(); });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("nav-open")) { close(); btn.focus(); } });
  }

  // Mark the current section in the header so people can see where they are.
  // Lessons and the course page count as "Learn"; electives count as "Explore".
  function markActiveNav() {
    const here = location.pathname.split("/").pop() || "index.html";
    const inLessons = location.pathname.includes("/lessons/");
    let section = here;
    if (inLessons && /^(lesson-\d+|financial-literacy)\.html$/.test(here)) section = "learn";
    else if (inLessons) section = "explore";
    document.querySelectorAll(".nav-links a").forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (href.includes("#")) return;
      const file = href.split("?")[0].split("/").pop();
      const match =
        (section === "learn" && /^lesson-\d+\.html$/.test(file)) ||
        (section === "explore" && file === "explore.html") ||
        (!inLessons && file === here);
      if (match) a.setAttribute("aria-current", "page");
    });
  }

  function requireSubscription() {
    if (!hasActivePlan()) {
      window.location.href = rootPath("pricing.html");
    }
  }

  // --- Confetti: a short celebration burst, used when a lesson is finished ---

  function confetti(n) {
    n = n || 80;
    const acc = getComputedStyle(document.documentElement).getPropertyValue("--acc").trim() || "#1C6847";
    const colors = [acc, "#F5C65A", "#A8DDC0", "#F6B8A8", "#10241B"];
    for (let i = 0; i < n; i++) {
      const piece = document.createElement("i");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.background = colors[i % colors.length];
      piece.style.animationDuration = (1.6 + Math.random() * 1.4) + "s";
      piece.style.animationDelay = Math.random() * 0.4 + "s";
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 3400);
    }
  }

  // --- Lesson quizzes: every [data-quiz] group is a required question. Wires the
  // click handling, and makes "Mark lesson complete" check that every question on
  // the page has been answered before the lesson can be completed. If any are
  // missing, it scrolls to the first one and marks every unanswered question with
  // "This is a required question". Shared by every lesson page.

  function initLessonQuiz(lessonId) {
    enhanceLesson(lessonId);
    const groups = Array.from(document.querySelectorAll("[data-quiz]"));

    groups.forEach((group) => {
      const feedback = group.nextElementSibling;
      group.querySelectorAll(".quiz-option").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (group.dataset.answered) return;
          group.dataset.answered = "true";
          const isCorrect = btn.dataset.correct === "true";
          btn.classList.add(isCorrect ? "correct" : "incorrect");
          if (!isCorrect) {
            group.querySelector('[data-correct="true"]').classList.add("correct");
          }
          feedback.className = "quiz-feedback " + (isCorrect ? "correct" : "incorrect");
          feedback.textContent = isCorrect ? "Correct! Nice work." : "Not quite. The correct answer is highlighted.";
          if (isCorrect) group.dataset.right = "true";
          group.querySelectorAll(".quiz-option").forEach((o) => { o.disabled = true; });
          touchDay();
          showScore();
        });
      });
    });

    const completeBtn = document.getElementById("complete-btn");

    // running score under the last quiz once every question has an answer
    function showScore() {
      const answered = groups.filter((g) => g.dataset.answered).length;
      if (answered < groups.length) return;
      const right = groups.filter((g) => g.dataset.right).length;
      saveQuizResult(lessonId, right, groups.length);
      track("quiz", lessonId, Math.round(right / groups.length * 100));
      const lastBox = groups[groups.length - 1].closest(".quiz-box");
      let el = lastBox.querySelector(".quiz-score");
      if (!el) { el = document.createElement("div"); el.className = "quiz-score"; lastBox.appendChild(el); }
      el.textContent = right + " of " + groups.length + " correct" + (right === groups.length ? ". A perfect round." : right >= groups.length / 2 ? ". Solid. Review the highlighted answers once more." : ". Worth a second read of the lesson.");
      el.classList.add("show");
    }
    if (!completeBtn) return;

    function renderComplete() {
      if (isLessonComplete(lessonId)) {
        completeBtn.textContent = "✓ Lesson complete";
        completeBtn.classList.add("done");
        completeBtn.disabled = true;
      }
    }

    completeBtn.addEventListener("click", () => {
      const unanswered = groups.filter((group) => !group.dataset.answered);
      if (unanswered.length) {
        unanswered.forEach((group) => {
          const feedback = group.nextElementSibling;
          feedback.className = "quiz-feedback required";
          feedback.textContent = "This is a required question";
        });
        const first = unanswered[0];
        const target = first.previousElementSibling && first.previousElementSibling.classList.contains("quiz-question")
          ? first.previousElementSibling
          : first;
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        const firstOption = first.querySelector(".quiz-option");
        if (firstOption) firstOption.focus();
        return;
      }
      markLessonComplete(lessonId);
      track("lesson_complete", lessonId);
      touchDay();
      renderComplete();
      confetti();
      showDonePanel();
    });

    renderComplete();
  }

  // --- Lesson chrome: reading progress, an outline that follows you, key takeaways and a finish panel ---

  const TAKEAWAYS = {
    "lesson-1": ["Financial literacy is knowing how to earn, spend, save, borrow and invest, and using that knowledge when it counts.", "The five building blocks (earning, spending, saving, borrowing, investing) work together, not alone.", "You build the skill by practising decisions early, while the stakes are small."],
    "lesson-2": ["A budget is a plan for your money made before you spend it.", "Needs keep you going; wants are chosen on purpose after needs and savings are covered.", "Pay yourself first: move money to savings the moment you are paid."],
    "lesson-3": ["A real goal has a price, a deadline and a weekly amount, so you can see it getting closer.", "Make saving automatic and it stops depending on willpower.", "When an impulse buy appears, waiting 24 hours usually answers the question for you."],
    "lesson-4": ["Banks keep your money safe, lend some of it out and pay you interest for the use of it.", "Checking is for spending; savings is for growing. Use each for its job.", "Watch for fees and protect your account details, and you keep what you earn."],
    "lesson-6": ["Borrowing is renting money, and interest is the rent. Always ask what the total will be.", "Debt can be a tool or a trap. The difference is the interest rate and whether you have a plan to repay.", "Paying on time and using a small slice of your limit are the biggest drivers of a healthy credit score."],
    "lesson-7": ["Compound interest means your earnings earn earnings, so growth speeds up over time.", "The Rule of 72 estimates doubling time: divide 72 by the yearly return.", "Time matters more than amount. Starting early beats starting big, and the same math works against you on debt."],
    "lesson-8": ["Gross pay is before deductions; net pay is what you take home.", "Social Security and Medicare take 7.65% of most paychecks, and teens often owe little or no income tax.", "Read every pay stub, and file a tax return to recover any income tax withheld."],
    "lesson-9": ["Scams rely on pressure, secrecy and unusual payment. Real organizations give you time.", "Never share passwords, PINs or one-time codes, and never pay with gift cards to someone you don't know.", "When in doubt: stop, check on your own, and tell a trusted adult."],
    "lesson-10": ["A plan starts with knowing what comes in, then splitting it between needs, wants and savings.", "A goal needs a price, a date and a weekly amount, and saving should be automatic.", "Review the plan monthly and adjust. A plan you check is a plan you keep."],
    "lesson-5": ["Saving protects money; investing tries to grow it, and that always carries risk.", "A stock is a small piece of a company, and its price moves on expectations as much as results.", "Diversifying and explaining your reasoning beat chasing whatever is popular."],
  };

  function enhanceLesson(lessonId) {
    const main = document.querySelector("main");
    const article = document.querySelector(".lesson-body");
    if (!main || !article || main.querySelector(".lesson-shell")) return;
    const up = "../";
    const idx = LESSON_IDS.indexOf(lessonId), meta = LESSONS[idx];

    // reading progress bar
    const bar = document.createElement("div");
    bar.className = "read-progress"; bar.innerHTML = "<i></i>";
    document.body.appendChild(bar);
    const fill = bar.firstChild;

    // header: eyebrow + title next to a drawn illustration
    const h1 = article.querySelector("h1");
    const eyebrow = article.querySelector(".eyebrow");
    if (h1 && eyebrow && window.MintlyArt) {
      const art = ["book", "piggy", "target", "bank", "chart", "card", "percent", "wallet", "alert", "plan"][idx] || "book";
      const hero = document.createElement("div");
      hero.className = "lesson-hero";
      const left = document.createElement("div");
      eyebrow.before(hero); left.append(eyebrow, h1); hero.append(left);
      const a = document.createElement("div"); a.className = "art"; a.dataset.art = art; hero.append(a);
      MintlyArt.mount();
    }

    const locked = !canAccess(lessonId);
    if (!locked) track("lesson_view", lessonId);
    // the lesson film: a short animated version of the lesson, loaded on demand
    const hero = article.querySelector(".lesson-hero");
    const slot = document.createElement("div");
    slot.className = "lf-slot"; slot.id = "video";
    slot.innerHTML = '<div class="lf-cap"><span>Watch the lesson</span><span>' + (meta ? meta.mins + " min read below" : "") + '</span></div><div class="lf-mount"></div>';
    const intro = article.querySelector("p");
    (intro && intro.parentNode === article ? intro : hero || h1).before(slot);
    if (locked) {
      slot.querySelector(".lf-mount").innerHTML = '<a class="lf lf-locked" href="#unlock" aria-label="Unlock this lesson\'s film"><div class="lf-art">' + (window.MintlyArt ? MintlyArt.render("shield") : "") + '</div><strong>Members watch the film</strong><span class="lf-playbtn" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span></a>';
    } else { slot.querySelector(".lf-mount").dataset.film = lessonId; loadFilm(lessonId, slot.querySelector(".lf-mount")); }

    if (locked) {
      // keep the intro, hide the rest, and show the unlock card
      const kids = Array.from(article.children), keepTo = kids.findIndex((k) => k.tagName === "H2");
      kids.forEach((k, i) => { if (keepTo > -1 && i >= keepTo) k.style.display = "none"; });
      main.querySelectorAll(".quiz, .done-panel").forEach((q) => (q.style.display = "none"));
      const unlock = document.createElement("section");
      unlock.className = "paywall"; unlock.id = "unlock";
      const n = idx + 1;
      unlock.innerHTML = '<div class="pw-art">' + (window.MintlyArt ? MintlyArt.render("shield") : "") + '</div><div><p class="pw-k">Lesson ' + n + ' is for members</p><h2>Want the rest of this one?</h2><p>You\'ve read the opening. Members get the full lesson, its film, the practice and the quiz, plus all ten lessons, Leaf, and the dashboards.</p><ul><li>10 lessons, each with a short film</li><li>Leaf, your question-asking study partner</li><li>Student, parent and teacher dashboards</li></ul><div class="pw-actions"><a class="btn btn-lg" href="../pricing.html?from=' + lessonId + '">See plans, from $8 a month</a><a class="btn btn-secondary btn-lg" href="../signin.html">I have an account</a></div><p class="pw-fine">Lesson 1 is always free. <a href="lesson-1.html">Start there &rarr;</a></p></div>';
      article.appendChild(unlock);
    }

    // takeaways, placed before the first quiz
    const tk = TAKEAWAYS[lessonId];
    const firstQuiz = main.querySelector(".quiz");
    if (tk && firstQuiz && !locked) {
      const box = document.createElement("section");
      box.className = "lesson-body takeaways-wrap";
      box.style.paddingTop = "0";
      box.innerHTML = '<div class="takeaways"><h2>Key takeaways</h2><ol>' + tk.map((t) => "<li>" + t + "</li>").join("") + "</ol></div>";
      firstQuiz.before(box);
    }

    // finish panel above the nav buttons
    const nav = main.querySelector(".lesson-nav");
    if (locked && nav) { nav.style.display = "none"; const pg = main.querySelector(".lesson-pager"); if (pg) pg.style.display = "none"; }
    const next = LESSONS[idx + 1];
    const panel = document.createElement("div");
    panel.className = "done-panel"; panel.id = "done-panel";
    panel.innerHTML = '<div><h3>Lesson complete.</h3><p>' + (next ? "Up next: " + next.title : "You finished the course. Collectables and Cryptocurrencies are unlocked.") +
      '</p></div><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="xp-chip">+100 XP</span><a class="btn" href="' + (next ? next.id + ".html" : "../dashboard.html") + '">' + (next ? "Next lesson →" : "See your dashboard →") + "</a></div>";
    if (nav) nav.before(panel);

    // wrap everything in a two-column shell with an outline on the left
    const shell = document.createElement("div"); shell.className = "lesson-shell";
    const toc = document.createElement("aside"); toc.className = "lesson-toc"; toc.setAttribute("aria-label", "In this lesson");
    const content = document.createElement("div"); content.className = "lesson-content";
    while (main.firstChild) content.appendChild(main.firstChild);
    const heads = Array.from(content.querySelectorAll(".lesson-body h2")).filter((h) => !h.closest(".takeaways"));
    heads.forEach((h, i) => { h.id = h.id || "sec-" + i; });
    toc.innerHTML = "<b>In this lesson</b>" + heads.map((h) => '<a href="#' + h.id + '">' + h.textContent + "</a>").join("") +
      '<div class="meta"><span>' + (meta ? meta.mins + " min read" : "") + "</span><span>Lesson " + (idx + 1) + " of " + LESSON_IDS.length + "</span></div>";
    shell.append(toc, content); main.appendChild(shell);
    if (locked) { toc.style.display = "none"; shell.style.gridTemplateColumns = "minmax(0, 720px)"; return; }

    const links = Array.from(toc.querySelectorAll("a"));
    function onScroll() {
      const h = document.documentElement, max = h.scrollHeight - innerHeight;
      fill.style.width = (max > 0 ? Math.min(100, scrollY / max * 100) : 0) + "%";
      let cur = 0; heads.forEach((el, i) => { if (el.getBoundingClientRect().top < 140) cur = i; });
      links.forEach((a, i) => a.classList.toggle("on", i === cur));
    }
    addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }

  function loadScript(src) {
    return new Promise((res, rej) => { const el = document.createElement("script"); el.src = src; el.onload = res; el.onerror = rej; document.head.appendChild(el); });
  }
  function loadFilm(lessonId, mount) {
    const up = "../";
    Promise.all([window.MintlyFilm ? 0 : loadScript(up + "lessonfilm.js"), window.MINTLY_FILMS ? 0 : loadScript(up + "films-data.js")]).then(() => {
      const spec = window.MINTLY_FILMS && window.MINTLY_FILMS[lessonId];
      if (spec) { window.MintlyFilm.mount(mount, spec); if (location.hash === "#video") mount.scrollIntoView({ block: "center" }); }
      else mount.closest(".lf-slot").remove();
    }).catch(() => mount.closest(".lf-slot").remove());
  }

  function showDonePanel() {
    const p = document.getElementById("done-panel");
    if (p) { p.classList.add("show"); p.scrollIntoView({ behavior: "smooth", block: "center" }); }
  }

  return {
    renderChrome,
    track,
    pageKey,
    consentBanner,
    landingPage,
    canAccess,
    checkoutUrl,
    planName,
    FREE_LESSONS,
    FREE_LEAF_QUESTIONS,
    PLAN_NAMES,
    allUsers,
    removeUser,
    resetProgress,
    DEMO_PASSWORD,
    stats,
    toast,
    touchDay,
    quizResult,
    enhanceLesson,
    LESSONS,
    LESSON_IDS,
    nextLesson,
    markActiveNav,
    isLessonComplete,
    markLessonComplete,
    completedCount,
    isCourseComplete,
    saveInterest,
    getInterest,
    currentUser,
    signUp,
    logIn,
    logOut,
    setPlan,
    hasActivePlan,
    requireSubscription,
    renderNavAuth,
    setupMobileNav,
    confetti,
    initLessonQuiz,
  };
})();

Mintly.renderChrome();
// Scroll reveals: tag the common blocks once, fade each in as it enters the screen.
function setupReveal() {
  const sel = ".section-heading, .section-eyebrow, .home-lead, .section-lead, .step, .tile, .role-card, .plan-card, .faq-item, .path-stage, .page-header > *, .lesson-row, .course-card, .takeaways, .definition-card, .activity, .quiz-box, .callout, .checks li, .chat, .cta-banner, .parents-promise .wrap > *";
  const els = Array.from(document.querySelectorAll(sel)).filter((e) => !e.closest(".reveal") && !e.classList.contains("reveal"));
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const groups = new Map();
  els.forEach((el) => {
    const p = el.parentNode, n = groups.get(p) || 0; groups.set(p, n + 1);
    el.classList.add("reveal"); el.style.setProperty("--i", Math.min(n, 5));
  });
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12, rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll(".reveal").forEach((e) => io.observe(e));
}
function setupHeaderScroll() {
  const h = document.getElementById("site-header"); if (!h) return;
  const f = () => h.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", f, { passive: true }); f();
}

document.addEventListener("DOMContentLoaded", () => {
  setupHeaderScroll();
  setTimeout(setupReveal, 0);
  Mintly.track("page_view", Mintly.pageKey());
  setTimeout(Mintly.consentBanner, 1200);
  Mintly.renderNavAuth("nav-auth");
  Mintly.setupMobileNav();
  Mintly.markActiveNav();
});
