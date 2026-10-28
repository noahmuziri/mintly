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
        '<div><b>Company</b><a href="' + up + 'parents.html">For parents</a><a href="' + up + 'pricing.html">Pricing</a><a href="' + up + 'mintly.demo.html?from=site">Watch the demo</a></div></div></div>';
    }
  }

  // --- Auth (demo only: accounts live in this browser's localStorage,
  // not a real server. Do not reuse this pattern for real passwords.) ---

  function getUsers() {
    return readJSON(USERS_KEY, {});
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
    return { ok: true };
  }

  // Where to go after signing in: the dashboard for the account's role (also switches the site's role colour).
  function landingPage() {
    const u = currentUser();
    const role = (u && u.role) || "student";
    if (window.MintlyTheme) MintlyTheme.setRole(role);
    return "dashboard.html?role=" + role;
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

  // --- Research interest (what the user chose to learn about on Explore) ---

  function saveInterest(interest) {
    writeJSON(INTEREST_PREFIX + progressScope(), interest);
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
      const art = ["book", "piggy", "target", "bank", "chart"][idx] || "book";
      const hero = document.createElement("div");
      hero.className = "lesson-hero";
      const left = document.createElement("div");
      eyebrow.before(hero); left.append(eyebrow, h1); hero.append(left);
      const a = document.createElement("div"); a.className = "art"; a.dataset.art = art; hero.append(a);
      MintlyArt.mount();
    }

    // takeaways, placed before the first quiz
    const tk = TAKEAWAYS[lessonId];
    const firstQuiz = main.querySelector(".quiz");
    if (tk && firstQuiz) {
      const box = document.createElement("section");
      box.className = "lesson-body takeaways-wrap";
      box.style.paddingTop = "0";
      box.innerHTML = '<div class="takeaways"><h2>Key takeaways</h2><ol>' + tk.map((t) => "<li>" + t + "</li>").join("") + "</ol></div>";
      firstQuiz.before(box);
    }

    // finish panel above the nav buttons
    const nav = main.querySelector(".lesson-nav");
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

    const links = Array.from(toc.querySelectorAll("a"));
    function onScroll() {
      const h = document.documentElement, max = h.scrollHeight - innerHeight;
      fill.style.width = (max > 0 ? Math.min(100, scrollY / max * 100) : 0) + "%";
      let cur = 0; heads.forEach((el, i) => { if (el.getBoundingClientRect().top < 140) cur = i; });
      links.forEach((a, i) => a.classList.toggle("on", i === cur));
    }
    addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }

  function showDonePanel() {
    const p = document.getElementById("done-panel");
    if (p) { p.classList.add("show"); p.scrollIntoView({ behavior: "smooth", block: "center" }); }
  }

  return {
    renderChrome,
    landingPage,
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
document.addEventListener("DOMContentLoaded", () => {
  Mintly.renderNavAuth("nav-auth");
  Mintly.setupMobileNav();
  Mintly.markActiveNav();
});
