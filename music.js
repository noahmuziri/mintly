/* Mintly music: a soft generative backing track made live with the Web Audio API.
   No audio files, nothing to license. MintlyMusic.sync(owner, state, opts) is called by the film players:
   it fades in while a film plays and out when it pauses or ends. One mute switch is remembered. */
(function () {
  const KEY = "mintly:music-muted";
  const MOODS = [
    { bpm: 82, root: 48, prog: [[0, 4, 7, 11], [-3, 0, 4, 7], [-7, -3, 0, 4], [-5, -1, 2, 7]] },
    { bpm: 90, root: 50, prog: [[0, 3, 7, 10], [-2, 2, 5, 9], [-5, -2, 2, 5], [-7, -3, 0, 4]] },
    { bpm: 76, root: 45, prog: [[0, 4, 7, 11], [5, 9, 12, 16], [2, 5, 9, 12], [-1, 2, 7, 11]] },
    { bpm: 108, root: 52, prog: [[0, 4, 7, 12], [-5, -1, 2, 7], [-3, 0, 4, 9], [-7, -3, 0, 5]], lively: true }
  ];
  let ac, master, owner = null, timer = null, step = 0, nextT = 0, mood = MOODS[0], muted = false, want = false, noise;
  try { muted = localStorage.getItem(KEY) === "1"; } catch (e) {}

  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function init() {
    if (ac) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 0;
    const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2600;
    const echo = ac.createDelay(1); echo.delayTime.value = 0.34; const fb = ac.createGain(); fb.gain.value = 0.28; const wet = ac.createGain(); wet.gain.value = 0.3;
    lp.connect(master); lp.connect(echo); echo.connect(fb); fb.connect(echo); echo.connect(wet); wet.connect(master);
    master.connect(ac.destination); init.bus = lp;
    const len = ac.sampleRate * 0.5, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    noise = buf; return true;
  }
  function tone(m, t, dur, type, vol, atk) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = hz(m);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + (atk || 0.02)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(init.bus); o.start(t); o.stop(t + dur + 0.05);
  }
  function hit(t, kind) {
    if (kind === "kick") { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); o.connect(g); g.connect(init.bus); o.start(t); o.stop(t + 0.25); return; }
    const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter(); s.buffer = noise; f.type = "highpass"; f.frequency.value = kind === "snare" ? 1800 : 7000;
    g.gain.setValueAtTime(kind === "snare" ? 0.16 : 0.07, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === "snare" ? 0.16 : 0.05)); s.connect(f); f.connect(g); g.connect(init.bus); s.start(t); s.stop(t + 0.2);
  }
  function schedule() {
    const beat = 60 / mood.bpm, sixteenth = beat / 4;
    while (nextT < ac.currentTime + 0.35) {
      const bar = Math.floor(step / 16) % mood.prog.length, s = step % 16, chord = mood.prog[bar], t = nextT;
      if (s === 0) { chord.forEach((n, i) => tone(mood.root + n + (i ? 0 : -12), t, beat * 4.2, "triangle", i ? 0.05 : 0.11, 0.35)); }
      if (s % 2 === 0 && (mood.lively || s % 4 === 2 || s === 0)) { const n = chord[(s / 2 + (bar % 2)) % chord.length]; tone(mood.root + 12 + n, t, beat * 0.9, "sine", 0.07, 0.01); }
      if (s === 0 || (mood.lively && s === 8) || s === 10) hit(t, "kick");
      if (s === 4 || s === 12) hit(t, "snare");
      if (s % 2 === 0) hit(t, "hat");
      nextT += sixteenth; step++;
    }
  }
  function fade(to, secs) { if (!ac) return; const g = master.gain, t = ac.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(to, t + secs); }
  function run() {
    if (!init()) return;
    if (ac.state === "suspended") ac.resume();
    if (!timer) { nextT = ac.currentTime + 0.08; timer = setInterval(schedule, 90); }
    fade(muted ? 0 : 0.16, 1.2); want = true; paint();
  }
  function halt() {
    want = false; if (!ac) return; fade(0, 0.5);
    const t = timer; setTimeout(() => { if (!want && t === timer) { clearInterval(timer); timer = null; } }, 700); paint();
  }
  function pick(key) { let h = 0; String(key || "").split("").forEach((c) => { h = (h * 31 + c.charCodeAt(0)) | 0; }); return MOODS[Math.abs(h) % 3]; }

  /* owner = the film element; state = "playing" | "paused" | "done" | "idle" */
  function sync(who, state, opts) {
    if (state === "playing") { if (owner !== who) { owner = who; mood = (opts && opts.lively) ? MOODS[3] : pick(opts && opts.key); step = 0; } run(); }
    else if (owner === who) { halt(); if (state === "done" || state === "idle") owner = null; }
  }
  function setMuted(m) { muted = !!m; try { localStorage.setItem(KEY, muted ? "1" : "0"); } catch (e) {} if (ac && want) fade(muted ? 0 : 0.16, 0.3); paint(); }
  function paint() {
    document.querySelectorAll("[data-music-toggle]").forEach((b) => {
      b.setAttribute("aria-pressed", muted ? "true" : "false"); b.setAttribute("aria-label", muted ? "Turn music on" : "Turn music off"); b.classList.toggle("is-off", muted);
    });
  }
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-music-toggle]"); if (b) { e.stopPropagation(); setMuted(!muted); } }, true);
  window.MintlyMusic = { sync, setMuted, get muted() { return muted; }, paint, get playing() { return want; } };
})();
