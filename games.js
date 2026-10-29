/* Mintly Arcade: four quick games that teach money habits. Difficulty follows the age style
   (Explorer is gentler and slower, Pro is faster and uses harder cards).
   Scores, XP and the daily challenge are saved through Mintly (see script.js). */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const age = () => (window.MintlyTheme ? MintlyTheme.getAge() : "builder");
  const AGE_TIER = { explorer: [1, 2], builder: [1, 2, 3], pro: [2, 3] };
  const tiers = () => AGE_TIER[age()] || [1, 2, 3];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ----------------------------------------------------------------- data */
  const HYPE = [
    // [text, isHype, why, tier]
    ["Money in an insured US bank is protected up to $250,000 per depositor.", false, "FDIC insurance is real and specific.", 1],
    ["This coin will 10x by Friday. Guaranteed.", true, "Nobody can guarantee a price. 'Guaranteed' is a giveaway.", 1],
    ["Compound interest means you earn interest on your interest.", false, "That's exactly how it works.", 1],
    ["Everyone's buying it, so the price can only go up.", true, "Crowds buy at the top too. Popularity isn't evidence.", 1],
    ["Paying a credit card on time helps your credit score.", false, "Payment history is the biggest factor.", 1],
    ["You must decide in the next 10 minutes or lose the deal.", true, "Fake urgency is a pressure tactic.", 1],
    ["Gift cards are a normal way to pay a government agency.", true, "Real agencies never ask for gift cards.", 1],
    ["Spreading your money across many companies can reduce the damage from one bad pick.", false, "That's diversification.", 1],
    ["A stranger DMs you: 'Send me $50 and I'll flip it into $500.'", true, "Classic advance-fee scam.", 1],
    ["An emergency fund helps you handle surprises without borrowing.", false, "It's its whole job.", 1],
    ["Only people with lots of money can invest.", true, "You can start small, and early is powerful.", 1],
    ["Inflation means a dollar usually buys a little less each year.", false, "Prices tend to rise over time.", 1],
    ["A 'free' trial that asks for your card may start charging you.", false, "Read the terms and set a reminder to cancel.", 1],
    ["Influencers always give honest, unpaid advice.", true, "Many are paid. Always ask how they earn.", 1],
    ["A higher interest rate on a loan means it costs you more.", false, "More interest, more cost.", 1],
    ["Saving a little every week adds up faster than people expect.", false, "Small habits compound.", 1],
    ["Risk-free returns of 40% a year are available to anyone.", true, "Big returns always come with big risk.", 2],
    ["Past performance guarantees future results.", true, "It doesn't. Every fund warns about this.", 2],
    ["A diversified index fund can still lose value in a market crash.", false, "Diversification reduces risk but doesn't remove it.", 2],
    ["The minimum payment on a credit card is all you ever need to pay.", true, "Interest piles up on the unpaid balance.", 2],
    ["A higher deductible usually lowers your insurance premium.", false, "You take on more of the first loss, so it costs less.", 2],
    ["A screenshot of big profits proves someone's strategy works.", true, "Screenshots are easy to fake or cherry-pick.", 2],
    ["Your net pay is what's left after taxes and deductions.", false, "Gross minus deductions.", 2],
    ["If a company is famous, its stock can't be overpriced.", true, "Even great companies can be bought at too high a price.", 2],
    ["A pump-and-dump hypes a stock so insiders can sell to newcomers.", false, "That's the scheme, and it's illegal.", 2],
    ["Never share a one-time code, even if the caller sounds official.", false, "Real banks don't ask for those codes.", 2],
    ["Only buy what's trending, because trends never end.", true, "Trends end, often right after you join.", 2],
    ["Student loan interest can grow while you're still in school.", false, "It often does on some loans.", 2],
    ["If an investment has no risk, the return should be huge.", true, "Risk and return go together. No risk means a small return.", 3],
    ["The Rule of 72 estimates how long money takes to double: 72 divided by the yearly return.", false, "Quick and useful.", 3],
    ["A company's stock price alone tells you if it's cheap or expensive.", true, "You need to compare it with earnings and growth.", 3],
    ["Your real return is your interest rate minus inflation, roughly.", false, "That's how you measure buying power.", 3],
    ["A fund manager who beat the market last year will beat it next year too.", true, "Streaks are mostly luck. Fees compound against you.", 3],
    ["Opportunity cost is what you give up when you choose one option over another.", false, "Every yes is a no to something else.", 3],
    ["A 0% intro APR means the card never charges interest.", true, "The rate usually jumps after the intro period ends.", 3],
    ["Fees of 1% a year can cost you a large share of your gains over decades.", false, "Small percentages compound too.", 3],
    ["Diversifying means holding ten different stocks that all do the same thing.", true, "Real diversification needs different kinds of investments.", 3]
  ];

  const BLITZ = [
    // [item, bucket(need|want|save), tier]
    ["Bus pass to get to school", "need", 1], ["Boba with friends", "want", 1], ["Phone bill share", "need", 1], ["New game", "want", 1],
    ["Lunch at school", "need", 1], ["Moving $20 into savings", "save", 1], ["Limited-edition sneakers", "want", 1], ["Winter coat, yours is too small", "need", 1],
    ["Streaming subscription", "want", 1], ["Putting birthday money in the bank", "save", 1], ["Concert ticket", "want", 1], ["School supplies", "need", 1],
    ["Saving for a bike", "save", 1], ["Skin in a game", "want", 1], ["Medicine you need", "need", 1], ["Emergency fund deposit", "save", 2],
    ["Third pair of the same sneakers", "want", 2], ["Groceries for the week", "need", 2], ["Energy-saving lightbulbs", "save", 2], ["Takeout again", "want", 2],
    ["Electricity bill", "need", 2], ["Monthly app subscription you forgot", "want", 2], ["Paying a loan payment on time", "need", 2], ["Transfer to a goal account", "save", 2],
    ["Newest phone when yours works fine", "want", 2], ["Dentist checkup", "need", 2], ["Retirement account contribution", "save", 3], ["Rent share", "need", 3],
    ["Impulse buy at checkout", "want", 3], ["Insurance premium", "need", 3], ["Buying index fund shares for the long term", "save", 3], ["Paying off a credit card balance", "need", 3],
    ["Upgrading to premium everything", "want", 3], ["Setting aside tax money from a side hustle", "save", 3], ["Car repair so you can get to work", "need", 3], ["Designer label you can't afford", "want", 3]
  ];

  const SCAMS = [
    // [from, text, isScam, why, tier]
    ["Text message", "BANK ALERT: Your account is locked. Confirm your PIN at bit-ly-secure.co within 10 minutes.", true, "Banks never ask for your PIN by text, and the link isn't theirs.", 1],
    ["Email", "Your order #4831 has shipped. Track it in the app you ordered from.", false, "Matches an order you placed and points to nothing suspicious.", 1],
    ["Direct message", "You won 5,000 free coins! Buy a $50 gift card and send me the code to unlock them.", true, "Free prizes never need gift cards.", 1],
    ["Friend's account", "Hey it's Sam, I'm locked out. Can you read me the 6-digit code you just got?", true, "That code is the key to YOUR account. Call Sam another way.", 1],
    ["School email", "The book fair order form for Friday is on the class page. Reply with questions.", false, "Normal, no pressure, no requests for secrets.", 1],
    ["Phone call", "This is the tax office. You owe money. Pay now with gift cards or you'll be arrested.", true, "Real agencies don't threaten arrest or take gift cards.", 1],
    ["App notification", "Your password was changed. If this wasn't you, open the app and review recent activity.", false, "Tells you to open the app yourself, not click a link.", 2],
    ["Email", "Dear customer, your account will be closed unless you verify at secure-login-bank.info.", true, "Generic greeting, fake-looking domain and a threat.", 2],
    ["Direct message", "I can double your money in 24 hours. Send $100 in crypto to start.", true, "Doubling money and crypto-only payment are textbook scam signs.", 2],
    ["Text message", "Your package couldn't be delivered. Pay a $1.99 fee at this link to reschedule.", true, "Small fees on fake delivery links steal your card.", 2],
    ["Job post", "Earn $500 a day from home. We'll send you a check; just forward part of it back to us.", true, "Overpayment scams: the check bounces after you've sent real money.", 2],
    ["Bank email", "A new device signed in to your account. If it wasn't you, go to our official site to review.", false, "It doesn't ask for anything and tells you to go to the real site.", 2],
    ["Online marketplace", "Buyer: I'll pay extra if you ship before I pay. Here's a screenshot of my payment.", true, "Screenshots aren't payments. Never ship first.", 3],
    ["Support chat", "To fix your account, install this remote tool and give me the access code.", true, "Remote-access tools hand over your whole device.", 3],
    ["Newsletter", "Our rates have changed. Review the update on your account page. No action needed.", false, "Informational, and points to your own account page.", 3],
    ["Investment group", "Our secret signals guarantee 20% weekly returns. Pay $200 for VIP access.", true, "Guaranteed returns plus a fee is a scam.", 3]
  ];

  const MONTH = [
    // each event: [title, text, [ [choice, cash, saved, joy, note], ... ]]
    ["Friends want to go out", "Your friends invite you to a $25 night out on Friday.", [["Go and spend $25", -25, 0, 14, "Fun, but it costs a quarter of a good week."], ["Go but spend only $10", -10, 0, 8, "A smarter middle ground."], ["Skip it, save the money", 0, 12, -8, "Savings grew, but you missed out."]]],
    ["Phone screen cracks", "You dropped your phone. A repair costs $40. It still works, mostly.", [["Fix it now", -40, 0, 4, "Peace of mind, bigger bill."], ["Use a $12 screen protector", -12, 0, 2, "A cheap workaround that stops it getting worse."], ["Ignore it", 0, 0, -6, "It looks bad and might break more later."]]],
    ["Flash sale", "Your favorite brand has a 40% off sale today only. The hoodie is $48.", [["Buy it right now", -48, 0, 12, "Impulse buys feel great for about a day."], ["Wait 24 hours (the rule)", 0, 0, 2, "If you still want it tomorrow, it's a real want."], ["Skip it", 0, 8, -2, "More saved, and no regrets."]]],
    ["Babysitting gig", "A neighbor offers you $35 for a Saturday evening.", [["Take it and save all of it", 35, 35, -4, "Great for the goal, tiring for the weekend."], ["Take it and spend half", 35, 18, 5, "A balance of reward and savings."], ["Take it and treat yourself", 35, 0, 10, "Fun, but your goal doesn't move."]]],
    ["Free trial", "A game offers a free week, then $9.99 a month. Easy to forget.", [["Sign up and set a cancel reminder", 0, 0, 5, "You got the fun without the charge."], ["Sign up and forget", -10, 0, 3, "Small leaks add up. That's $120 a year."], ["Skip it", 0, 0, 0, "No risk, no reward."]]],
    ["Lunch money", "You forgot your lunch. The cafeteria is $6.", [["Buy lunch", -6, 0, 3, "A need, covered."], ["Pack something tomorrow instead", -6, 0, 3, "Same today, planning helps next time."], ["Skip lunch", 0, 0, -8, "That's not a good trade for $6."]]],
    ["Friend asks to borrow", "A friend asks to borrow $20 'until next week'.", [["Lend it", -20, 0, 2, "Kind, but you may not see it again."], ["Lend half", -10, 0, 4, "A limit you can afford to lose."], ["Say no, politely", 0, 0, -3, "Okay to protect your money."]]],
    ["Birthday gift", "Your cousin's birthday is coming up.", [["Spend $30", -30, 0, 8, "Generous, but pricey."], ["Make something personal ($8)", -8, 0, 10, "Thoughtful and cheaper."], ["Skip it", 0, 0, -10, "It saves money but costs something else."]]],
    ["Bus fare goes up", "A fare increase adds $6 to your month.", [["Pay it", -6, 0, 0, "Needs don't negotiate."], ["Walk part of the way", 0, 0, 1, "Free exercise, a bit slower."], ["Carpool when possible", -2, 0, 3, "Cheaper and social."]]],
    ["Found $20", "You find a $20 bill in an old jacket.", [["Put it all in savings", 20, 20, 2, "Free money, kept."], ["Spend it all", 20, 0, 10, "Fun, gone."], ["Half and half", 20, 10, 6, "Balanced."]]],
    ["Game DLC", "A new expansion costs $15. You have enough, barely.", [["Buy it", -15, 0, 10, "Fun, but check your goal first."], ["Wait for a sale", 0, 0, 1, "Prices usually drop."], ["Skip it", 0, 5, -3, "More saved."]]],
    ["Tutoring", "A friend wants help with math and offers $15 an hour.", [["Do 2 hours", 30, 30, 2, "Earned and saved."], ["Do 1 hour", 15, 15, 4, "A comfortable pace."], ["Say no", 0, 0, 0, "Free time, free of income."]]],
    ["Sibling's school trip", "Your sibling asks you to chip in $10.", [["Chip in $10", -10, 0, 6, "Family comes first."], ["Offer $5", -5, 0, 3, "A fair split."], ["Say no", 0, 0, -6, "That might sting."]]],
    ["Snack run", "A vending machine is calling. Snacks are $3.", [["Buy two", -6, 0, 4, "Small spends add up fast."], ["Buy one", -3, 0, 2, "Reasonable."], ["Skip", 0, 0, -1, "Free, and you won't miss it."]]],
    ["New shoes", "Your old shoes are falling apart. New ones cost $55, or $30 on clearance.", [["Buy the $55 pair", -55, 0, 8, "They'll last, but cost more."], ["Buy the $30 pair", -30, 0, 4, "A need, handled sensibly."], ["Wait and duct-tape them", 0, 0, -10, "Not a long-term plan."]]],
    ["Charity jar", "A school fundraiser asks for donations.", [["Give $5", -5, 0, 6, "Giving can feel good too."], ["Give $1", -1, 0, 2, "A small gesture."], ["Skip it", 0, 0, -2, "Your choice."]]]
  ];

  /* ----------------------------------------------------------------- helpers */
  const stage = () => $("#stage");
  const GAMES = {
    hype: { title: "Fact or Hype", art: "megaphone", blurb: "Is it a real fact, or just hype? Build a streak.", free: true },
    blitz: { title: "Budget Blitz", art: "wallet", blurb: "Sort expenses into need, want or save before time runs out." },
    scam: { title: "Scam Spotter", art: "alert", blurb: "Read the message. Scam or legit? Beat the clock." },
    month: { title: "Money Month", art: "calendar", blurb: "Four weeks of choices. Reach your goal and keep a smile." }
  };
  let cleanup = null;
  function reset() { if (cleanup) { cleanup(); cleanup = null; } }
  function finish(id, score, xp, extra) {
    reset();
    const rec = Mintly.recordGame(id, score, xp);
    const daily = Mintly.checkDaily(id, score);
    stage().innerHTML = `<div class="gm-result"><p class="gm-k">Round over</p><h2>${esc(extra && extra.headline || "Nice round")}</h2><div class="gm-score">${score}</div><p class="gm-sub">${esc(extra && extra.sub || "")}</p>
      <div class="gm-chips"><span class="pill good">+${Math.round(xp)} XP</span>${rec.isBest ? '<span class="pill">New personal best</span>' : '<span class="pill mute">Best: ' + rec.best + "</span>"}${daily ? '<span class="pill">Daily challenge done, +50 XP</span>' : ""}</div>
      <div class="gm-actions"><button class="btn btn-lg" data-again="${id}" type="button">Play again</button><button class="btn btn-secondary btn-lg" data-home type="button">Back to the Arcade</button></div></div>`;
    if (rec.isBest || daily) Mintly.confetti(daily ? 70 : 40);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function frame(title, body) { stage().innerHTML = `<div class="gm-head"><button class="btn btn-secondary btn-small" data-home type="button">← Arcade</button><b>${esc(title)}</b><span id="gm-meta" class="gm-meta"></span></div>${body}`; }
  const meta = (t) => { const m = $("#gm-meta"); if (m) m.innerHTML = t; };
  function timerBar(ms, onEnd) {
    const bar = $("#gm-bar i"); if (!bar) return () => {};
    bar.style.transition = "none"; bar.style.transform = "scaleX(1)"; void bar.offsetWidth; bar.style.transition = "transform " + ms + "ms linear"; bar.style.transform = "scaleX(0)";
    const t = setTimeout(onEnd, ms); return () => clearTimeout(t);
  }

  /* ----------------------------------------------------------------- Fact or Hype */
  function playHype() {
    const t = tiers(), pool = shuffle(HYPE.filter((x) => t.includes(x[3]))).slice(0, 12);
    const per = { explorer: 0, builder: 10000, pro: 7000 }[age()];
    let i = 0, score = 0, streak = 0, best = 0, right = 0, locked = false, stopTimer = () => {};
    function show() {
      locked = false; const q = pool[i];
      frame("Fact or Hype", `<div class="gm-card"><div class="gm-prog"><i style="transform:scaleX(${i / pool.length})"></i></div>${per ? '<div class="gm-bar" id="gm-bar"><i></i></div>' : ""}<p class="gm-q">${esc(q[0])}</p><div class="gm-two"><button class="btn btn-lg gm-btn-fact" data-a="fact" type="button">Fact <small>(F or →)</small></button><button class="btn btn-lg gm-btn-hype" data-a="hype" type="button">Hype <small>(H or ←)</small></button></div><p class="gm-fb" id="gm-fb" aria-live="polite"></p></div>`);
      meta(`Score <b>${score}</b> · Streak <b>${streak}</b> · ${i + 1}/${pool.length}`);
      if (per) stopTimer = timerBar(per, () => answer(null));
    }
    function answer(a) {
      if (locked) return; locked = true; stopTimer();
      const q = pool[i], ok = a !== null && (a === "hype") === q[1];
      if (ok) { right++; streak++; best = Math.max(best, streak); score += 10 + (streak >= 5 ? 10 : streak >= 3 ? 5 : 0); } else streak = 0;
      const fb = $("#gm-fb"); fb.className = "gm-fb " + (ok ? "ok" : "no"); fb.innerHTML = `<b>${a === null ? "Time's up. " : ok ? "Right. " : "Not quite. "}</b>That's ${q[1] ? "hype" : "a fact"}. ${esc(q[2])}`;
      document.querySelectorAll(".gm-two button").forEach((b) => (b.disabled = true));
      meta(`Score <b>${score}</b> · Streak <b>${streak}</b> · ${i + 1}/${pool.length}`);
      setTimeout(() => { i++; if (i >= pool.length) finish("hype", score, score / 2, { headline: right >= 10 ? "You're hard to fool" : right >= 7 ? "Sharp eyes" : "Keep practising", sub: `${right} of ${pool.length} right. Longest streak: ${best}.` }); else show(); }, ok ? 1500 : 2600);
    }
    const key = (e) => { if (locked) return; const k = e.key.toLowerCase(); if (k === "f" || k === "arrowright") answer("fact"); else if (k === "h" || k === "arrowleft") answer("hype"); };
    addEventListener("keydown", key); cleanup = () => { removeEventListener("keydown", key); stopTimer(); };
    stage().onclick = (e) => { const b = e.target.closest("[data-a]"); if (b && !locked) answer(b.dataset.a); };
    show();
  }

  /* ----------------------------------------------------------------- Budget Blitz */
  function playBlitz() {
    const t = tiers(), deck = shuffle(BLITZ.filter((x) => t.includes(x[2])));
    const secs = { explorer: 60, builder: 45, pro: 40 }[age()];
    let idx = 0, score = 0, combo = 0, right = 0, wrong = 0, left = secs, over = false;
    frame("Budget Blitz", `<div class="gm-card"><div class="gm-bar" id="gm-bar"><i></i></div><p class="gm-kicker">Where does it belong?</p><p class="gm-q" id="bz-q"></p><div class="gm-three"><button class="btn btn-lg" data-b="need" type="button">Need <small>(1)</small></button><button class="btn btn-lg" data-b="want" type="button">Want <small>(2)</small></button><button class="btn btn-lg" data-b="save" type="button">Save <small>(3)</small></button></div><p class="gm-fb" id="gm-fb"></p></div>`);
    const next = () => { $("#bz-q").textContent = deck[idx % deck.length][0]; };
    const upd = () => meta(`Score <b>${score}</b> · Combo <b>×${Math.max(1, combo)}</b> · <b>${left}s</b>`);
    function pick(b) {
      if (over) return; const c = deck[idx % deck.length], ok = c[1] === b, fb = $("#gm-fb");
      if (ok) { right++; combo++; score += 10 + Math.min(10, Math.floor(combo / 3) * 2); fb.className = "gm-fb ok"; fb.textContent = "Yes"; }
      else { wrong++; combo = 0; score = Math.max(0, score - 5); fb.className = "gm-fb no"; fb.textContent = "That's a " + c[1]; }
      idx++; upd(); next();
    }
    const tick = setInterval(() => { left--; upd(); if (left <= 0) end(); }, 1000);
    function end() { if (over) return; over = true; clearInterval(tick); finish("blitz", score, score / 3, { headline: score >= 100 ? "Budget boss" : score >= 60 ? "Solid sorting" : "Keep at it", sub: `${right} right, ${wrong} wrong in ${secs} seconds.` }); }
    const key = (e) => { const m = { 1: "need", 2: "want", 3: "save" }[e.key]; if (m) pick(m); };
    addEventListener("keydown", key); cleanup = () => { removeEventListener("keydown", key); clearInterval(tick); over = true; };
    stage().onclick = (e) => { const b = e.target.closest("[data-b]"); if (b) pick(b.dataset.b); };
    timerBar(secs * 1000, () => {}); next(); upd();
  }

  /* ----------------------------------------------------------------- Scam Spotter */
  function playScam() {
    const t = tiers(), pool = shuffle(SCAMS.filter((x) => t.includes(x[4]))).slice(0, 8);
    const per = { explorer: 20000, builder: 13000, pro: 9000 }[age()];
    let i = 0, score = 0, right = 0, locked = false, stopTimer = () => {}, started = 0;
    function show() {
      locked = false; const m = pool[i]; started = Date.now();
      frame("Scam Spotter", `<div class="gm-card"><div class="gm-prog"><i style="transform:scaleX(${i / pool.length})"></i></div><div class="gm-bar" id="gm-bar"><i></i></div><div class="gm-msg"><span>${esc(m[0])}</span><p>${esc(m[1])}</p></div><div class="gm-two"><button class="btn btn-lg gm-btn-hype" data-a="scam" type="button">Scam <small>(S)</small></button><button class="btn btn-lg gm-btn-fact" data-a="legit" type="button">Legit <small>(L)</small></button></div><p class="gm-fb" id="gm-fb" aria-live="polite"></p></div>`);
      meta(`Score <b>${score}</b> · ${i + 1}/${pool.length}`); stopTimer = timerBar(per, () => answer(null));
    }
    function answer(a) {
      if (locked) return; locked = true; stopTimer();
      const m = pool[i], ok = a !== null && (a === "scam") === m[2];
      if (ok) { right++; score += 15 + Math.round(clamp(1 - (Date.now() - started) / per, 0, 1) * 10); }
      const fb = $("#gm-fb"); fb.className = "gm-fb " + (ok ? "ok" : "no"); fb.innerHTML = `<b>${a === null ? "Time's up. " : ok ? "Right. " : "Not quite. "}</b>That's ${m[2] ? "a scam" : "legit"}. ${esc(m[3])}`;
      document.querySelectorAll(".gm-two button").forEach((b) => (b.disabled = true)); meta(`Score <b>${score}</b> · ${i + 1}/${pool.length}`);
      setTimeout(() => { i++; if (i >= pool.length) finish("scam", score, score / 2.5, { headline: right >= 7 ? "Hard to scam" : right >= 5 ? "Good instincts" : "Slow down and check", sub: `${right} of ${pool.length} spotted correctly.` }); else show(); }, ok ? 1700 : 2800);
    }
    const key = (e) => { if (locked) return; const k = e.key.toLowerCase(); if (k === "s") answer("scam"); else if (k === "l") answer("legit"); };
    addEventListener("keydown", key); cleanup = () => { removeEventListener("keydown", key); stopTimer(); };
    stage().onclick = (e) => { const b = e.target.closest("[data-a]"); if (b && !locked) answer(b.dataset.a); };
    show();
  }

  /* ----------------------------------------------------------------- Money Month */
  function playMonth() {
    const weeks = 4, goal = { explorer: 50, builder: 70, pro: 90 }[age()], start = { explorer: 120, builder: 140, pro: 160 }[age()];
    let w = 0, cash = start, saved = 0, joy = 50, log = []; const events = shuffle(MONTH).slice(0, weeks);
    function show() {
      const e = events[w];
      frame("Money Month", `<div class="gm-card"><div class="gm-prog"><i style="transform:scaleX(${w / weeks})"></i></div><div class="mm-stats"><div><span>Cash</span><b>$${Math.round(cash)}</b></div><div><span>Saved toward goal</span><b>$${Math.round(saved)} / $${goal}</b></div><div><span>Happiness</span><b>${Math.round(joy)}</b></div></div><p class="gm-kicker">Week ${w + 1}: ${esc(e[0])}</p><p class="gm-q" style="font-size:1.25em">${esc(e[1])}</p><div class="mm-choices">${e[2].map((c, i) => `<button class="mm-choice" data-c="${i}" type="button"><b>${esc(c[0])}</b></button>`).join("")}</div><p class="gm-fb" id="gm-fb"></p></div>`);
      meta(`Week <b>${w + 1}</b> of ${weeks}`);
    }
    function choose(i) {
      const e = events[w], c = e[2][i];
      cash += c[1]; saved += c[2]; joy = clamp(joy + c[3], 0, 100); if (cash < 0) { joy = clamp(joy - 10, 0, 100); }
      log.push({ title: e[0], choice: c[0], note: c[4] });
      document.querySelectorAll(".mm-choice").forEach((b) => (b.disabled = true));
      const fb = $("#gm-fb"); fb.className = "gm-fb ok"; fb.textContent = c[4];
      setTimeout(() => { w++; if (w >= weeks) end(); else show(); }, 1700);
    }
    function end() {
      const goalPart = clamp(saved / goal, 0, 1) * 60, joyPart = clamp(joy, 0, 100) * 0.3, cashPart = cash >= 0 ? 10 : 0;
      const score = Math.round(goalPart + joyPart + cashPart);
      const grade = score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : "D";
      finish("month", score, score / 2, { headline: `Grade ${grade}`, sub: `Saved $${Math.round(saved)} of your $${goal} goal, happiness ${Math.round(joy)}${cash < 0 ? ", and you ended in the red." : "."}` });
    }
    stage().onclick = (e) => { const b = e.target.closest("[data-c]"); if (b && !b.disabled) choose(+b.dataset.c); };
    cleanup = () => {}; show();
  }

  /* ----------------------------------------------------------------- shell */
  const PLAY = { hype: playHype, blitz: playBlitz, scam: playScam, month: playMonth };
  function lobby() {
    reset();
    const d = Mintly.gameData(), daily = Mintly.dailyChallenge(), member = Mintly.hasActivePlan(), st = Mintly.stats();
    const ageNames = { explorer: "Explorer mode", builder: "Builder mode", pro: "Pro mode" };
    stage().innerHTML = `<div class="gm-top"><div><h1>The Arcade</h1><p class="gm-sub">Quick games that sneak in real money skills. Difficulty follows your age style (<b>${ageNames[age()]}</b>, change it in Customize).</p></div><div class="gm-xp"><b>${st.xp}</b><span>total XP</span></div></div>
      <div class="gm-daily${daily.done ? " done" : ""}"><div><span class="gm-k">Daily challenge</span><b>${esc(daily.text)}</b><small>${daily.done ? "Done for today. Come back tomorrow." : "Complete it for +" + daily.xp + " bonus XP."}</small></div><button class="btn" data-play="${daily.game}" type="button" ${daily.done ? "disabled" : ""}>${daily.done ? "Completed" : "Play it"}</button></div>
      <div class="gm-grid">${Object.entries(GAMES).map(([id, g]) => { const locked = !g.free && !member; return `<div class="gm-tile${locked ? " lockedg" : ""}"><div class="art" data-art="${g.art}"></div><h3>${g.title}</h3><p>${g.blurb}</p><div class="gm-foot"><span class="muted">${d.best[id] ? "Best " + d.best[id] : "Not played yet"}</span>${locked ? '<a class="btn btn-secondary btn-small" href="pricing.html?from=games">🔒 Members</a>' : `<button class="btn btn-small" data-play="${id}" type="button">Play</button>`}</div></div>`; }).join("")}</div>`;
    MintlyArt.mount(); stage().onclick = null;
  }
  document.addEventListener("click", (e) => {
    const p = e.target.closest("[data-play]"), a = e.target.closest("[data-again]"), h = e.target.closest("[data-home]");
    if (h) return lobby();
    const id = p ? p.dataset.play : a ? a.dataset.again : null;
    if (id && PLAY[id]) { const g = GAMES[id]; if (!g.free && !Mintly.hasActivePlan()) { location.href = "pricing.html?from=games"; return; } reset(); PLAY[id](); }
  });
  document.addEventListener("mintly:age", () => { if (!document.querySelector(".gm-card, .gm-result")) lobby(); });
  const want = new URLSearchParams(location.search).get("game");
  if (want && PLAY[want] && (GAMES[want].free || Mintly.hasActivePlan())) { PLAY[want](); } else lobby();
})();
