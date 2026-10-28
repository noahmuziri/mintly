// Mintly client library. Accounts and progress live on the server (server/api.js); this keeps an
// in-memory copy so pages can read progress synchronously once `Mintly.ready` resolves:
//   Mintly.ready.then(() => { ... Mintly.currentUser(), Mintly.isLessonComplete("lesson-1") ... });
const Mintly = (() => {
  let user = null;
  let LESSONS = [];
  let progress = { lessons: {}, interest: null };

  const inLessons = location.pathname.includes("/lessons/");
  const rootPath = (page) => (inLessons ? "../" + page : page);

  // JSON call to the server. Never throws: resolves {ok, status, ...body}, so callers show body.error.
  async function api(method, path, body) {
    try {
      const res = await fetch(path, {
        method,
        credentials: "same-origin",
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
        keepalive: method !== "GET",
      });
      const json = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, ...json };
    } catch (e) {
      return { ok: false, status: 0, error: "Can't reach the Mintly server. Is it running (npm start)?" };
    }
  }

  const ready = (async () => {
    const [me, cur] = await Promise.all([api("GET", "/api/me"), api("GET", "/curriculum.json")]);
    LESSONS = cur.lessons || [];
    user = (me.ok && me.user) || null;
    if (user && user.role === "student") {
      const p = await api("GET", "/api/progress");
      if (p.ok) progress = { lessons: p.lessons || {}, interest: p.interest || null };
    }
  })();

  // --- Accounts ---

  const currentUser = () => user;
  const dashboardHref = (role) => rootPath(({ student: "student-dashboard.html", parent: "parent-dashboard.html", teacher: "teacher-dashboard.html" })[role] || "signin.html");

  async function signUp(fields) {
    const r = await api("POST", "/api/auth/signup", fields);
    if (r.ok) user = r.user;
    return r;
  }
  async function logIn(fields) {
    const r = await api("POST", "/api/auth/login", fields);
    if (r.ok && !r.admin) user = r.user;
    return r;
  }
  async function googleSignIn(fields) {
    const r = await api("POST", "/api/auth/google", fields);
    if (r.ok) user = r.user;
    return r;
  }
  async function logOut() {
    await api("POST", "/api/auth/logout", {});
    user = null;
  }

  // Send visitors who aren't signed in to the sign-in page, and come back afterwards.
  // Pass a role to also keep other account types out (they are sent to their own dashboard).
  function requireLogin(role) {
    if (!user) {
      location.replace(rootPath("signin.html") + "?next=" + encodeURIComponent(location.pathname.split("/").slice(inLessons ? -2 : -1).join("/")));
      return false;
    }
    if (role && user.role !== role) {
      location.replace(dashboardHref(user.role));
      return false;
    }
    return true;
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderNavAuth(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const signinHref = rootPath("signin.html");
    if (user) {
      const firstName = escapeHTML(user.name.split(" ")[0]);
      el.innerHTML =
        '<a class="nav-account-link" href="' + dashboardHref(user.role) + '">Dashboard</a>' +
        '<a class="nav-account-link" href="' + rootPath("account.html") + '">Hi, ' + firstName + '</a>' +
        '<button class="btn-dark" id="nav-logout-btn">Log out</button>';
      document.getElementById("nav-logout-btn").addEventListener("click", async () => {
        await logOut();
        location.href = rootPath("index.html");
      });
    } else {
      el.innerHTML =
        '<a class="nav-account-link" href="' + signinHref + '">Log in</a>' +
        '<a class="btn-dark" href="' + signinHref + '?mode=signup">Sign up</a>';
    }
  }

  // --- Lesson progress (students only; other roles can preview lessons but nothing is saved) ---

  const isStudent = () => !!user && user.role === "student";
  const record = (id) => (progress.lessons[id] = progress.lessons[id] || {});
  const isLessonComplete = (id) => !!(progress.lessons[id] && progress.lessons[id].completedAt);
  const completedCount = () => LESSONS.filter((l) => isLessonComplete(l.id)).length;
  const isCourseComplete = () => LESSONS.length > 0 && completedCount() === LESSONS.length;
  const nextLesson = () => LESSONS.find((l) => !isLessonComplete(l.id)) || LESSONS[0];

  // Saves are batched per lesson, so typing in a box doesn't send a request per keystroke.
  const pending = {};
  function queueSave(id, patch) {
    if (!isStudent()) return;
    const p = (pending[id] = pending[id] || { timer: null, body: {} });
    Object.assign(p.body, patch);
    clearTimeout(p.timer);
    p.timer = setTimeout(() => flush(id), 600);
  }
  function flush(id) {
    const p = pending[id];
    if (!p) return;
    clearTimeout(p.timer);
    delete pending[id];
    api("PUT", "/api/progress/" + id, p.body);
  }
  addEventListener("pagehide", () => Object.keys(pending).forEach(flush));

  function markLessonComplete(id) {
    if (!isStudent()) return;
    record(id).completedAt = record(id).completedAt || Date.now();
    queueSave(id, { completed: true });
  }

  // Activities finished inside a lesson (quiz answers, blanks, matches), saved by lessons/lesson.js.
  function lessonActivity(id) {
    const st = (progress.lessons[id] && progress.lessons[id].state) || {};
    return { done: st.done || 0, total: st.total || 0 };
  }
  const getLessonState = (id) => (progress.lessons[id] && progress.lessons[id].state) || {};
  function saveLessonState(id, state) {
    if (!isStudent()) return;
    record(id).state = state;
    queueSave(id, { state });
  }
  const getAnswers = (id) => (progress.lessons[id] && progress.lessons[id].answers) || {};
  function saveAnswer(id, key, value) {
    if (!isStudent()) return;
    const answers = (record(id).answers = record(id).answers || {});
    answers[key] = value;
    queueSave(id, { answers });
  }

  // --- Research interest (what the student chose to learn about on Explore) ---

  function saveInterest(interest) {
    if (!isStudent()) return;
    progress.interest = interest;
    api("PUT", "/api/interest", { interest });
  }
  const getInterest = () => progress.interest;

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

  return {
    ready,
    api,
    get LESSONS() { return LESSONS; },
    get LESSON_IDS() { return LESSONS.map((l) => l.id); },
    nextLesson,
    markActiveNav,
    isLessonComplete,
    lessonActivity,
    getLessonState,
    saveLessonState,
    getAnswers,
    saveAnswer,
    markLessonComplete,
    completedCount,
    isCourseComplete,
    saveInterest,
    getInterest,
    currentUser,
    dashboardHref,
    signUp,
    logIn,
    googleSignIn,
    logOut,
    requireLogin,
    escapeHTML,
    renderNavAuth,
    setupMobileNav,
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  Mintly.setupMobileNav();
  Mintly.markActiveNav();
  Mintly.ready.then(() => Mintly.renderNavAuth("nav-auth"));
});
