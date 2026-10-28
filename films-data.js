/* Lesson films as data. Each film is a list of scenes (see lessonfilm.js for the scene types).
   Tone: "light" (default), "dark" or "acc" (accent colour) to give the film rhythm. */
window.MINTLY_FILMS = {
  "lesson-1": { title: "What is financial literacy?", art: "book", scenes: [
    { type: "title", tone: "dark", kicker: "Lesson 1", big: "Money skills you use every day.", sub: "That is financial literacy." },
    { type: "calc", kicker: "Three parts", big: "What it is made of", tokens: [{ t: "Knowledge", c: "What things mean" }, { t: "+" }, { t: "Skills", c: "Doing it" }, { t: "+" }, { t: "Confidence", c: "Trusting yourself" }, { t: "=" }, { t: "Literacy", c: "Good decisions", hl: true }] },
    { type: "points", kicker: "The five building blocks", big: "Money in five moves.", items: [{ h: "Earning", p: "Money comes in" }, { h: "Spending", p: "Money goes out" }, { h: "Saving", p: "Money waits for you" }, { h: "Investing", p: "Money grows, with risk" }, { h: "Borrowing", p: "Money you owe back" }] },
    { type: "compare", kicker: "Myths", big: "It isn't about being rich.", left: { h: "In truth", items: ["Anyone can learn it", "Starts with small choices", "Best learned young"] }, right: { h: "The myths", items: ["You need lots of money", "It's only about stocks", "I'll learn it when I'm older"] } },
    { type: "title", tone: "acc", kicker: "Why now", big: "Time is your biggest advantage.", sub: "Small choices today become freedom later." },
    { type: "quiz", q: "Which one is NOT a building block?", opts: ["Saving", "Borrowing", "Guessing"], a: 2, why: "The five are earning, spending, saving, investing and borrowing." },
    { type: "outro", tone: "dark", big: "Next: needs vs. wants.", sub: "Build your first budget." }
  ] },

  "lesson-2": { title: "Needs vs. wants", art: "piggy", scenes: [
    { type: "title", tone: "dark", kicker: "Lesson 2", big: "A budget is a plan for your money.", sub: "Made before you spend it." },
    { type: "compare", kicker: "Sort it", big: "Needs and wants.", left: { h: "Needs", items: ["Food and lunch", "Getting to school", "Bills you agreed to"] }, right: { h: "Wants", items: ["New games", "Takeout", "The latest sneakers"] } },
    { type: "title", kicker: "The gray area", big: "What is the cheapest version that still does the job?", sub: "That part is the need. The rest is a want." },
    { type: "steps", kicker: "Five steps", big: "Build a budget.", items: ["Know what comes in", "Track what goes out", "Sort needs and wants", "Pay yourself first", "Check and adjust"] },
    { type: "split", tone: "dark", kicker: "A simple split", big: "Try 50 / 30 / 20.", parts: [["Needs", 50, "Must-haves"], ["Wants", 30, "Fun"], ["Savings", 20, "Future you"]] },
    { type: "quiz", q: "What does 'pay yourself first' mean?", opts: ["Buy something fun first", "Move money to savings before spending", "Pay bills last"], a: 1, why: "Savings come out the moment you are paid." },
    { type: "outro", tone: "acc", big: "Every dollar gets a job.", sub: "Next: saving for something you want." }
  ] },

  "lesson-3": { title: "Saving for something you want", art: "target", scenes: [
    { type: "title", tone: "dark", kicker: "Lesson 3", big: "From 'I want it' to a plan.", sub: "Wishes need numbers." },
    { type: "points", kicker: "A real goal answers three things", big: "What. How much. By when.", items: ["What exactly?", "How much does it cost?", "By when do you want it?"] },
    { type: "calc", kicker: "Do the math", big: "How long will it take?", tokens: [{ t: "$240", c: "Goal" }, { t: "÷" }, { t: "$20", c: "Saved a week" }, { t: "=" }, { t: "12 weeks", c: "Time to goal", hl: true }], note: "Save $30 a week and it drops to 8 weeks." },
    { type: "steps", kicker: "Make it automatic", big: "Four habits.", items: [{ h: "Pay yourself first" }, { h: "Keep it separate" }, { h: "Track progress" }, { h: "Name it" }] },
    { type: "flags", tone: "dark", kicker: "The enemy", big: "Impulse buys.", items: ["It's on sale, today only", "Everyone has one", "You didn't plan it"] },
    { type: "title", tone: "acc", kicker: "The 24-hour rule", big: "Wait a day.", sub: "If you still want it tomorrow, it is a real want." },
    { type: "quiz", q: "You want a $60 item and save $10 a week. How long?", opts: ["4 weeks", "6 weeks", "10 weeks"], a: 1, why: "$60 divided by $10 is 6 weeks." },
    { type: "outro", tone: "dark", big: "Next: how banks work.", sub: "Where your savings live." }
  ] },

  "lesson-4": { title: "How banks work", art: "bank", scenes: [
    { type: "title", tone: "dark", kicker: "Lesson 4", big: "Where your money lives.", sub: "And what the bank does with it." },
    { type: "steps", kicker: "What a bank does", big: "Deposit. Lend. Earn.", items: [{ h: "You deposit", p: "Money is kept safe" }, { h: "Bank lends some out", p: "To other people" }, { h: "Borrowers pay interest", p: "Savers earn a share" }] },
    { type: "compare", kicker: "Two accounts", big: "Checking vs. savings.", left: { h: "Checking", items: ["For spending", "Comes with a debit card", "Low or no interest"] }, right: { h: "Savings", items: ["For keeping", "Earns more interest", "Limits on withdrawals"] } },
    { type: "title", kicker: "Is it safe?", big: "Insured up to $250,000.", sub: "By FDIC at banks and NCUA at credit unions (US)." },
    { type: "flags", tone: "dark", kicker: "Watch out", big: "Fees add up.", items: ["Monthly maintenance fees", "Minimum balance fees", "Out-of-network ATM fees", "Overdraft fees"] },
    { type: "quiz", q: "Which account is built for growing money?", opts: ["Checking", "Savings", "A debit card"], a: 1, why: "Savings accounts pay more interest." },
    { type: "outro", tone: "acc", big: "Know where it sits.", sub: "Next: intro to investing." }
  ] },

  "lesson-5": { title: "Intro to investing", art: "chart", scenes: [
    { type: "title", tone: "dark", kicker: "Lesson 5", big: "Saving protects. Investing grows.", sub: "And growth comes with risk." },
    { type: "points", kicker: "A stock is", big: "A tiny piece of a company.", items: ["You own a small share", "Price moves with expectations", "You can gain, or lose"] },
    { type: "compare", kicker: "Why prices move", big: "Expectations beat news.", left: { h: "Goes up", items: ["Better than expected", "Growing demand"] }, right: { h: "Goes down", items: ["Worse than expected", "New competition"] } },
    { type: "split", tone: "dark", kicker: "Diversify", big: "Don't bet it all on one.", parts: [["Company A", 34, "Own a little"], ["Company B", 33, "Of each"], ["Company C", 33, "So one fall hurts less"]] },
    { type: "steps", kicker: "Your process", big: "Buy, sell or wait.", items: ["Research both sides", "Ask Leaf to challenge you", "Make your case and name the risk"] },
    { type: "quiz", q: "You own 10 companies equally. One falls 50%. How much of your total do you lose?", opts: ["50%", "5%", "10%"], a: 1, why: "Half of one tenth is 5%." },
    { type: "outro", tone: "acc", big: "Foundations done.", sub: "Next: credit, debt and borrowing." }
  ] },

  "lesson-6": { title: "Credit, debt and borrowing", art: "card", scenes: [
    { type: "title", tone: "dark", kicker: "Lesson 6", big: "Borrowing is renting money.", sub: "And the rent is called interest." },
    { type: "calc", kicker: "The real cost", big: "A $1,000 loan.", tokens: [{ t: "$1,000", c: "Borrowed" }, { t: "+" }, { t: "$112", c: "Interest" }, { t: "=" }, { t: "$1,112", c: "You repay", hl: true }], note: "At 20% APR over 12 months. Always ask what it totals." },
    { type: "compare", kicker: "Debt isn't all the same", big: "Good debt, bad debt.", left: { h: "Can be worth it", items: ["Tuition that raises income", "A mortgage on a home", "Low interest, clear plan"] }, right: { h: "Usually isn't", items: ["Cards carried month to month", "Buying wants on credit", "High-interest payday loans"] } },
    { type: "points", kicker: "Your credit score", big: "A trust number.", items: [{ h: "Pay on time", p: "The biggest factor" }, { h: "Use a small slice of your limit", p: "Under 30% is a common rule" }, { h: "Keep accounts open a long time" }, { h: "Don't open lots of accounts at once" }] },
    { type: "flags", tone: "dark", kicker: "Danger zone", big: "The minimum payment trap.", items: ["Interest piles on the balance", "A small purchase takes years to clear", "You pay far more than the price"] },
    { type: "quiz", q: "What matters most for a healthy credit score?", opts: ["Paying on time", "Having lots of cards", "Never checking it"], a: 0, why: "Payment history is the largest single factor." },
    { type: "outro", tone: "acc", big: "Borrow on purpose.", sub: "Next: compound interest." }
  ] },

  "lesson-7": { title: "Compound interest and time", art: "percent", scenes: [
    { type: "title", tone: "dark", kicker: "Lesson 7", big: "Your money earns money.", sub: "Then that money earns money too." },
    { type: "chart", kicker: "$1,000 at 7% a year", big: "Straight line vs. snowball.", sub: "Illustrative, not a promise.", x0: "Today", x1: "30 years", series: [{ name: "Simple interest", v: [1000, 1350, 1700, 2050, 2400, 2750, 3100], end: "$3,100" }, { name: "Compound interest", v: [1000, 1403, 1967, 2759, 3870, 5427, 7612], end: "$7,612" }] },
    { type: "calc", tone: "acc", kicker: "Rule of 72", big: "How fast does it double?", tokens: [{ t: "72" }, { t: "÷" }, { t: "7%", c: "Yearly return" }, { t: "=" }, { t: "≈ 10 years", c: "To double", hl: true }] },
    { type: "stat", tone: "dark", kicker: "$50 a month at 7%, starting at 15", n: 272, pre: "≈ $", suf: "k", caption: "by age 65. Starting at 25 gives about $131k." },
    { type: "points", kicker: "How to use it", big: "Let time do the work.", items: ["Start early, even small", "Add money regularly", "Don't touch it for years"] },
    { type: "compare", kicker: "It works both ways", big: "Same math, on debt.", left: { h: "Savings", items: ["Interest grows your balance"] }, right: { h: "Credit cards", items: ["Interest grows what you owe"] } },
    { type: "quiz", q: "Which helps compound interest most?", opts: ["Starting early", "Waiting for more money", "Checking daily"], a: 0, why: "More years means more compounding." },
    { type: "outro", tone: "acc", big: "Start now.", sub: "Next: paychecks and taxes." }
  ] },

  "lesson-8": { title: "Paychecks and taxes", art: "wallet", scenes: [
    { type: "title", tone: "dark", kicker: "Lesson 8", big: "Why your paycheck is smaller.", sub: "Gross pay vs. take-home pay. (US examples)" },
    { type: "calc", kicker: "One week", big: "15 hours at $15.", tokens: [{ t: "$225", c: "Gross pay" }, { t: "−" }, { t: "$17", c: "Social Security and Medicare" }, { t: "=" }, { t: "≈ $208", c: "Take-home", hl: true }] },
    { type: "points", kicker: "Where it goes", big: "Common deductions.", items: [{ h: "Federal income tax", p: "May be $0 on small earnings" }, { h: "Social Security and Medicare", p: "7.65% of pay" }, { h: "State and local tax", p: "Varies by place" }] },
    { type: "title", tone: "acc", kicker: "Good to know", big: "You may get it back.", sub: "Earn under the standard deduction and withheld income tax can be refunded when you file." },
    { type: "steps", kicker: "Your first job", big: "Paperwork checklist.", items: [{ h: "W-4", p: "Tells your employer what to withhold" }, { h: "I-9", p: "Proves you can work" }, { h: "Pay stub", p: "Check it every time" }] },
    { type: "quiz", q: "What is net pay?", opts: ["Pay before deductions", "Pay you take home", "Your hourly rate"], a: 1, why: "Net is what lands in your account." },
    { type: "outro", tone: "dark", big: "Read your pay stub.", sub: "Next: scams and staying safe." }
  ] },

  "lesson-9": { title: "Scams and staying safe", art: "alert", scenes: [
    { type: "title", tone: "dark", kicker: "Lesson 9", big: "Scammers go after teens.", sub: "Here is how to spot them in seconds." },
    { type: "flags", kicker: "Red flags", big: "If you see these, stop.", items: ["Pressure: act now or lose it", "Asks for your password, PIN or a code", "Wants gift cards, crypto or wire transfers", "Too good to be true", "Secret: don't tell anyone"] },
    { type: "compare", kicker: "Real vs. fake", big: "How the real thing acts.", left: { h: "Legit", items: ["Lets you take your time", "Never asks for your password", "You can verify it independently"] }, right: { h: "Scam", items: ["Rushes you", "Asks for codes by text", "Won't let you check"] } },
    { type: "steps", tone: "dark", kicker: "When in doubt", big: "Stop. Check. Tell.", items: [{ h: "Stop", p: "Don't click or reply" }, { h: "Check", p: "Go to the real site or call the real number" }, { h: "Tell", p: "A parent, teacher or the bank" }] },
    { type: "quiz", q: "A stranger says you won a prize but must pay fees in gift cards.", opts: ["Pay quickly", "It's a scam", "Ask a friend to pay"], a: 1, why: "Real prizes never ask for gift cards." },
    { type: "outro", tone: "acc", big: "Slow down. Verify.", sub: "Next: build your money plan." }
  ] },

  "lesson-10": { title: "Build your money plan", art: "plan", scenes: [
    { type: "title", tone: "dark", kicker: "Lesson 10", big: "Put it all together.", sub: "One page. Your plan." },
    { type: "steps", kicker: "The plan", big: "Five moves.", items: ["Know what comes in", "Split it", "Pick a goal", "Automate saving", "Review monthly"] },
    { type: "split", tone: "dark", kicker: "Start with", big: "50 / 30 / 20.", parts: [["Needs", 50, "Bills and basics"], ["Wants", 30, "Fun, on purpose"], ["Savings", 20, "Goals and growth"]] },
    { type: "calc", kicker: "A goal with a date", big: "Make it measurable.", tokens: [{ t: "$300", c: "Bike" }, { t: "÷" }, { t: "$20", c: "Per week" }, { t: "=" }, { t: "15 weeks", c: "Finish line", hl: true }] },
    { type: "points", tone: "acc", kicker: "Your safety net", big: "Protect the plan.", items: ["An emergency fund first", "Avoid high-interest debt", "Watch for scams"] },
    { type: "title", kicker: "The habit", big: "Check it once a month.", sub: "Compare plan and reality, then adjust." },
    { type: "quiz", q: "What should come first in your plan?", opts: ["Knowing your income", "Buying wants", "Investing everything"], a: 0, why: "You can't plan money you haven't counted." },
    { type: "outro", tone: "dark", big: "You've got this.", sub: "Make a plan, then make a decision." }
  ] }
};
