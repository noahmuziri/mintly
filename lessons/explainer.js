/* Animated lesson explainers. Place <div data-explainer="paycheck|debt|compound|scam|plan"></div> in a lesson.
   Each explainer is a list of scenes (stage HTML + caption). Bars animate to their data-w width. */
(function () {
  var usd = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };
  var COL = { green: "#2F7D58", mint: "#A8DDC0", gold: "#F2C14E", red: "#D6452D", ink: "#151515" };

  function row(label, w, val, cls) {
    return '<div class="ex-row"><span>' + label + '</span><span class="ex-track"><span class="ex-bar ' + (cls || "") + '" data-w="' + w + '"></span></span><span class="v">' + val + "</span></div>";
  }
  function stack(parts, total) {
    var bar = parts.map(function (p) { return '<span style="background:' + p.c + '" data-w="' + (p.v / total * 100) + '">' + (p.v / total > .09 ? p.t || "" : "") + "</span>"; }).join("");
    var leg = parts.map(function (p) { return "<span><b style='background:" + p.c + "'></b>" + p.l + "</span>"; }).join("");
    return '<div class="ex-stack">' + bar + '</div><div class="ex-legend">' + leg + "</div>";
  }

  var EXPLAINERS = {
    paycheck: function () {
      var gross = 100, ss = 6.2, med = 1.45, tax = 8, net = gross - ss - med - tax;
      var s = function (n) { return [{ c: COL.mint, v: net + (n < 4 ? ss + med + tax : 0), l: "You keep", t: "" }]; };
      var base = function (a) {
        var parts = [{ c: COL.mint, v: gross - a.reduce(function (x, p) { return x + p.v; }, 0), l: "You keep" }].concat(a);
        parts[0].t = usd(parts[0].v);
        return stack(parts, gross);
      };
      var SS = { c: COL.gold, v: ss, l: "Social Security $6.20", t: "" };
      var MED = { c: "#E9A8A0", v: med, l: "Medicare $1.45", t: "" };
      var TAX = { c: "#9FB5E8", v: tax, l: "Federal income tax (example) $8", t: "" };
      return {
        title: "Follow a $100 paycheck",
        scenes: [
          { cap: "You work a shift and earn $100. That's your gross pay.", html: '<div class="ex-big ex-fade">$100<small>gross pay</small></div>' + base([]) },
          { cap: "First, Social Security takes 6.2%: $6.20. It builds your future retirement benefits.", html: base([SS]) },
          { cap: "Medicare takes 1.45%: $1.45. It helps pay for health care for older adults.", html: base([SS, MED]) },
          { cap: "Then income tax may be withheld. It depends on your W-4. Here we use $8 as an example.", html: base([SS, MED, TAX]) },
          { cap: "What lands in your account is your net pay: about " + usd(net) + ". That's the number to budget with.", html: '<div class="ex-big ex-fade">' + usd(net) + "<small>net pay</small></div>" + base([SS, MED, TAX]) },
        ],
      };
    },

    debt: function () {
      var bal = 1000, apr = 0.24, pay = 25, m = 0, paid = 0, snaps = {};
      while (bal > 0.5 && m < 600) {
        bal = bal * (1 + apr / 12);
        var p = Math.min(pay, bal); bal -= p; paid += p; m++;
        if (m === 12 || m === 36) snaps[m] = { bal: bal, paid: paid };
      }
      var interest = paid - 1000, yrs = (m / 12).toFixed(1).replace(".0", "");
      var two = function (b, paidSoFar) {
        return row("Still owed", b / 10, usd(b), "bad") + row("Paid so far", paidSoFar / 20, usd(paidSoFar), "") + row("Interest", Math.max(0, paidSoFar - (1000 - b)) / 20, usd(Math.max(0, paidSoFar - (1000 - b))), "ink");
      };
      return {
        title: "The minimum-payment trap",
        scenes: [
          { cap: "You put a $1,000 purchase on a card at 24% APR and pay just $25 a month.", html: '<div class="ex-big ex-fade">$1,000<small>balance at 24% APR</small></div>' + row("Still owed", 100, "$1,000", "bad") },
          { cap: "After 1 year you've paid $300, but you still owe about " + usd(snaps[12].bal) + ". Most of each payment went to interest.", html: two(snaps[12].bal, snaps[12].paid) },
          { cap: "After 3 years: " + usd(snaps[36].paid) + " paid and still about " + usd(snaps[36].bal) + " owed.", html: two(snaps[36].bal, snaps[36].paid) },
          { cap: "It takes " + yrs + " years to clear. You paid about " + usd(paid) + " for a $1,000 purchase: " + usd(interest) + " was interest.", html: '<div class="ex-big ex-fade">' + usd(interest) + "<small>paid in interest</small></div>" + row("Interest", interest / paid * 100, usd(interest), "ink") + row("The purchase", 1000 / paid * 100, "$1,000", "") },
          { cap: "The fix: pay the full balance each month, or pay as much above the minimum as you can.", html: '<div class="ex-big ex-fade" style="color:var(--pgreen)">0% interest<small>when you pay in full</small></div>' },
        ],
      };
    },

    compound: function () {
      var fv = function (monthly, years) { var r = 0.07 / 12, n = years * 12; return monthly * ((Math.pow(1 + r, n) - 1) / r); };
      var grow = function (y) { var f = fv(50, y), put = 50 * 12 * y; return row("You put in", put / 130000 * 100, usd(put), "mint") + row("Total value", f / 130000 * 100, usd(f), ""); };
      var early = fv(50, 40), late = fv(50, 30);
      return {
        title: "Why starting early wins",
        scenes: [
          { cap: "Save $50 a month and earn an average 7% a year (an example, not a promise).", html: '<div class="ex-big ex-fade">$50<small>a month at 7%</small></div>' },
          { cap: "After 10 years: you put in $6,000. Growth adds about " + usd(fv(50, 10) - 6000) + ".", html: grow(10) },
          { cap: "After 20 years the growth is bigger than your own deposits.", html: grow(20) },
          { cap: "After 30 years: " + usd(fv(50, 30)) + ". The curve is bending upward.", html: grow(30) },
          { cap: "After 40 years: " + usd(early) + " from only $24,000 of your own money.", html: grow(40) },
          { cap: "Start 10 years later and you end with " + usd(late) + ". Waiting cost about " + usd(early - late) + ".", html: row("Start at 16", early / 130000 * 100, usd(early), "") + row("Start at 26", late / 130000 * 100, usd(late), "mint") },
        ],
      };
    },

    scam: function () {
      var msg = function (hot) {
        var m = function (k, t) { return '<mark class="' + (hot.indexOf(k) > -1 ? "hot" : "") + '">' + t + "</mark>"; };
        return '<div class="ex-phone"><small>Text message · unknown number</small><div class="ex-msg">' +
          m("a", "USPS: Your package is on hold.") + " " + m("b", "Pay a $1.99 fee within 2 hours") + " or it will be returned. " +
          m("c", "usps-track-pay.co/id/4482") + "</div></div>";
      };
      return {
        title: "Spot the scam in 20 seconds",
        scenes: [
          { cap: "You get this text. It looks normal. Let's read it like a detective.", html: msg("") },
          { cap: "Red flag 1: you didn't order anything, and it comes from an unknown number.", html: msg("a") + '<div class="ex-flag ex-fade">Unexpected contact</div>' },
          { cap: "Red flag 2: pressure. “2 hours” is there to stop you thinking.", html: msg("b") + '<div class="ex-flag ex-fade">Urgency and a payment</div>' },
          { cap: "Red flag 3: the link isn't the real site. Real companies use their own domain.", html: msg("c") + '<div class="ex-flag ex-fade">Look-alike link</div>' },
          { cap: "So: don't tap. Use the three-step habit instead.", html: '<div class="ex-steps ex-fade"><div><b>1 Pause</b>Slow down. Urgency is the trick.</div><div><b>2 Verify</b>Go to the real site yourself.</div><div><b>3 Tell</b>Show a parent or teacher.</div></div>' },
        ],
      };
    },

    plan: function () {
      var inc = 200;
      var plan = function (parts) { return stack(parts, inc); };
      var N = { c: COL.mint, v: 100, l: "Needs 50% · $100", t: "$100" };
      var W = { c: COL.gold, v: 60, l: "Wants 30% · $60", t: "$60" };
      var S = { c: COL.green, v: 40, l: "Save 20% · $40", t: "$40" };
      S.c = "#8fd0ad";
      return {
        title: "The 50/30/20 split",
        scenes: [
          { cap: "Say $200 comes in this month from allowance and a part-time job.", html: '<div class="ex-big ex-fade">$200<small>this month</small></div>' },
          { cap: "50% for needs: $100. Things you must pay, like transport or a phone plan.", html: plan([N]) },
          { cap: "30% for wants: $60. Games, snacks, outings. Guilt-free, because it's planned.", html: plan([N, W]) },
          { cap: "20% for saving: $40. Goals, emergencies and your future self.", html: plan([N, W, S]) },
          { cap: "Make it automatic: move the $40 the day you're paid, before you can spend it.", html: '<div class="ex-big ex-fade" style="color:var(--pgreen)">Pay yourself first</div>' + plan([N, W, S]) },
        ],
      };
    },
  };

  function mount(el) {
    var def = EXPLAINERS[el.getAttribute("data-explainer")];
    if (!def) return;
    var ex = def(), i = 0, timer = null;
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.classList.add("explainer");
    el.setAttribute("role", "group");
    el.setAttribute("aria-label", "Animated explainer: " + ex.title);
    el.innerHTML =
      '<div class="ex-head"><span>Watch · ' + ex.title + '</span><span>' + ex.scenes.length + ' steps</span></div>' +
      '<div class="ex-stage" aria-hidden="true"></div><div class="ex-cap" aria-live="polite"></div>' +
      '<div class="ex-ctl"><button type="button" class="ex-prev" aria-label="Previous step">←</button>' +
      '<button type="button" class="ex-play">Play</button><button type="button" class="ex-next" aria-label="Next step">→</button>' +
      '<div class="ex-dots">' + ex.scenes.map(function () { return "<i></i>"; }).join("") + "</div></div>";
    var stage = el.querySelector(".ex-stage"), cap = el.querySelector(".ex-cap");
    var play = el.querySelector(".ex-play"), prev = el.querySelector(".ex-prev"), next = el.querySelector(".ex-next");
    var dots = el.querySelectorAll(".ex-dots i");

    function show(n) {
      i = Math.max(0, Math.min(ex.scenes.length - 1, n));
      stage.innerHTML = ex.scenes[i].html;
      cap.textContent = ex.scenes[i].cap;
      dots.forEach(function (d, k) { d.classList.toggle("on", k === i); });
      prev.disabled = i === 0;
      next.disabled = i === ex.scenes.length - 1;
      // a short delay so the browser paints width 0 first, then animates to the target
      setTimeout(function () {
        stage.querySelectorAll("[data-w]").forEach(function (b) { b.style.width = Math.min(100, b.getAttribute("data-w")) + "%"; });
      }, 40);
    }
    function stop() { clearInterval(timer); timer = null; play.textContent = i === ex.scenes.length - 1 ? "Replay" : "Play"; }
    function start() {
      if (i === ex.scenes.length - 1) show(0);
      play.textContent = "Pause";
      timer = setInterval(function () { if (i < ex.scenes.length - 1) show(i + 1); if (i === ex.scenes.length - 1) stop(); }, 4800);
    }
    play.onclick = function () { timer ? stop() : start(); };
    prev.onclick = function () { stop(); show(i - 1); };
    next.onclick = function () { stop(); show(i + 1); };
    show(0);
    stop();
    // start by itself the first time it scrolls into view, unless the visitor prefers less motion
    if (!reduce && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); if (!timer && i === 0) start(); } }, { threshold: 0.6 });
      io.observe(el);
    }
  }

  function init() { document.querySelectorAll("[data-explainer]").forEach(mount); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
