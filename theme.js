/* Mintly theme: light/dark toggle, the active role (student / parent / teacher) and the Customize panel.
   Loaded in <head> so saved choices apply before first paint; the dock is built once the DOM is ready.
   The Customize panel is also where the demo lives: "Watch the demo" opens the self-playing film. */
(function () {
  const KEY_THEME = "mintly:theme", KEY_CUSTOM = "mintly:custom", KEY_ROLE = "mintly:role";
  const ROLES = ["student", "parent", "teacher", "admin"];
  const root = document.documentElement;
  root.classList.add("js");
  const read = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  // accent presets: [name, [light acc, accsoft, onacc], [dark acc, accsoft, onacc]]. Index 0 means "follow the role".
  const PAL = [["Role colour"],
    ["Violet", ["#5B3AE8", "#ECE8FF", "#fff"], ["#A58FFF", "#241B4A", "#0E0E0E"]],
    ["Rose", ["#C0124F", "#FFE4EE", "#fff"], ["#FF7DA8", "#3A1020", "#0E0E0E"]],
    ["Ocean", ["#0B6E8A", "#DDF1F7", "#fff"], ["#6FD0E8", "#10303B", "#06161C"]],
    ["Ink", ["#1B1B1B", "#E9E9E6", "#fff"], ["#E6E6E2", "#262625", "#111"]]];
  const BGS = [["Paper"], ["White", ["#FFFFFF", "#F4F2EC"], ["#000000", "#101010"]], ["Silver", ["#E9EBEA", "#F6F7F6"], ["#141816", "#1B201D"]]];
  const FONTS = [["Newsreader + Inter"], ["Fraunces + Inter", "'Fraunces',Georgia,serif", "'Inter',system-ui,sans-serif"], ["Inter only", "'Inter',system-ui,sans-serif", "'Inter',system-ui,sans-serif"], ["System", "system-ui,-apple-system,'Segoe UI',sans-serif", "system-ui,-apple-system,'Segoe UI',sans-serif"]];

  let C = Object.assign({ a: 0, b: 0, f: 0 }, read(KEY_CUSTOM, {}));
  const saved = read(KEY_THEME, null);
  if (saved === "light" || saved === "dark") root.dataset.theme = saved;

  const params = new URLSearchParams(location.search);
  let role = params.get("role");
  if (!ROLES.includes(role)) role = read(KEY_ROLE, "student");
  if (!ROLES.includes(role) || (role === "admin" && !params.get("role"))) role = "student"; // admin is never remembered as the site colour
  root.dataset.role = role;
  if (params.get("role") && ROLES.includes(params.get("role"))) write(KEY_ROLE, role);

  const isDark = () => root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;

  function setRole(r) {
    if (!ROLES.includes(r)) return;
    role = r; root.dataset.role = r; if (r !== "admin") write(KEY_ROLE, r);
    document.dispatchEvent(new CustomEvent("mintly:role", { detail: r }));
  }

  function apply() {
    const st = root.style;
    ["--acc", "--acct", "--accsoft", "--onacc", "--bg", "--panel", "--fh", "--fb"].forEach((k) => st.removeProperty(k));
    const d = isDark() ? 2 : 1;
    if (C.a) { const p = PAL[C.a][d]; st.setProperty("--acc", p[0]); st.setProperty("--acct", p[0]); st.setProperty("--accsoft", p[1]); st.setProperty("--onacc", p[2]); }
    if (C.b) { const b = BGS[C.b][d]; st.setProperty("--bg", b[0]); st.setProperty("--panel", b[1]); }
    if (C.f) { st.setProperty("--fh", FONTS[C.f][1]); st.setProperty("--fb", FONTS[C.f][2]); }
    document.querySelectorAll("#cp [data-k]").forEach((e) => e.classList.toggle("on", C[e.dataset.k] == e.dataset.i));
    const tg = document.getElementById("tg");
    if (tg) tg.querySelector(".t").textContent = isDark() ? "Light" : "Dark";
  }
  apply();

  const ICON = {
    sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2.2"/><circle cx="8" cy="17" r="2.2"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.4-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z"/></svg>'
  };

  function build() {
    const here = location.pathname.includes("/lessons/") ? "../" : "";
    const dock = document.createElement("div");
    dock.className = "dock";
    dock.innerHTML = `<button class="tgl" id="cu" type="button" aria-expanded="false" aria-controls="cp">${ICON.sliders}<span class="t">Customize</span></button><button class="tgl" id="tg" type="button" aria-label="Toggle dark mode">${ICON.moon}<span class="t"></span></button>`;
    const cp = document.createElement("div");
    cp.className = "cp"; cp.id = "cp"; cp.setAttribute("role", "dialog"); cp.setAttribute("aria-label", "Customize Mintly");
    cp.innerHTML = `<a class="cp-demo" href="${here}mintly.demo.html?from=site" id="cp-demo"><span class="play">${ICON.play}</span><span><b>Watch the demo</b><span>A one minute tour. Press start and sit back.</span></span></a>
<h4>Accent colour</h4><div class="sw">${PAL.map((p, i) => i === 0 ? `<button type="button" class="auto" data-k="a" data-i="0" title="Follows your role" aria-label="Role colour"></button>` : `<button type="button" data-k="a" data-i="${i}" title="${p[0]}" aria-label="${p[0]}" style="background:${p[1][0]}"></button>`).join("")}</div>
<h4>Background</h4><div class="sw">${BGS.map((p, i) => `<button type="button" class="sq" data-k="b" data-i="${i}" title="${p[0]}" aria-label="${p[0]}" style="background:${i === 0 ? "#F7F5EF" : p[1][0]}"></button>`).join("")}</div>
<h4>Font</h4><div class="cp-chips">${FONTS.map((p, i) => `<button type="button" class="cp-chip" data-k="f" data-i="${i}" style="font-family:${i === 0 ? "'Newsreader',serif" : p[2]}">${p[0]}</button>`).join("")}</div>
<button type="button" class="cp-reset" id="cp-reset">Reset to original</button>`;
    document.body.append(cp, dock);

    const cu = document.getElementById("cu");
    cu.onclick = () => { const o = cp.classList.toggle("open"); cu.setAttribute("aria-expanded", String(o)); };
    document.getElementById("tg").onclick = () => {
      root.dataset.theme = isDark() ? "light" : "dark";
      write(KEY_THEME, root.dataset.theme); apply();
    };
    cp.addEventListener("click", (e) => {
      const b = e.target.closest("[data-k]");
      if (b) { C[b.dataset.k] = +b.dataset.i; write(KEY_CUSTOM, C); apply(); }
    });
    document.getElementById("cp-reset").onclick = () => {
      C = { a: 0, b: 0, f: 0 }; delete root.dataset.theme;
      try { localStorage.removeItem(KEY_THEME); localStorage.removeItem(KEY_CUSTOM); } catch (e) {}
      apply();
    };
    addEventListener("keydown", (e) => { if (e.key === "Escape") { cp.classList.remove("open"); cu.setAttribute("aria-expanded", "false"); } });
    document.addEventListener("click", (e) => { if (cp.classList.contains("open") && !e.target.closest("#cp, #cu")) { cp.classList.remove("open"); cu.setAttribute("aria-expanded", "false"); } });
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", apply);
    const sync = () => { const t = read(KEY_THEME, null); if (t === "light" || t === "dark") root.dataset.theme = t; else delete root.dataset.theme; apply(); };
    addEventListener("storage", (e) => { if (e.key === KEY_THEME || e.key === null) sync(); });
    addEventListener("pageshow", (e) => { if (e.persisted) sync(); });
    apply();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build); else build();

  window.MintlyTheme = { setRole, getRole: () => role, ROLES, isDark };
})();
