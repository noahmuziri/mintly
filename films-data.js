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
  ] },

  "lesson-11": { title: "Inflation", art: "clock", scenes: [
    { type: "title", tone: "dark", kicker: "Lesson 11", big: "Same snack. Higher price.", sub: "That quiet creep is inflation." },
    { type: "calc", kicker: "The price time machine", big: "A $60 item, 20 years later.", tokens: [{ t: "$60", c: "Today" }, { t: "×" }, { t: "1.03²⁰", c: "3% a year" }, { t: "=" }, { t: "≈ $108", c: "In 20 years", hl: true }], note: "Illustrative: real inflation varies year to year." },
    { type: "points", kicker: "Why prices rise", big: "Three common causes.", items: [{ h: "Costs go up", p: "Wages, rent, shipping" }, { h: "Demand beats supply", p: "Everyone wants it" }, { h: "More money, same stuff", p: "Each dollar buys less" }] },
    { type: "stat", tone: "dark", kicker: "$100 at 3% inflation, 20 years on", n: 55, pre: "≈ $", caption: "of today's buying power is what that $100 would still buy." },
    { type: "compare", kicker: "Real return", big: "Does your money actually grow?", left: { h: "Earn 4%, inflation 3%", items: ["Real return about +1%", "Buying power grows a little"] }, right: { h: "Earn 2%, inflation 4%", items: ["Real return about -2%", "Account grows, power shrinks"] } },
    { type: "quiz", q: "Your savings earn 2% and inflation is 4%. Your real return is…", opts: ["+2%", "-2%", "6%"], a: 1, why: "Subtract inflation from what you earn." },
    { type: "outro", tone: "acc", big: "Beat the creep.", sub: "Next: side hustles." }
  ] },

  "lesson-12": { title: "Side hustles", art: "store", scenes: [
    { type: "title", tone: "dark", kicker: "Lesson 12", big: "Five lawns at $20. Did you make $100?", sub: "Not quite." },
    { type: "calc", kicker: "Revenue vs. profit", big: "What you actually keep.", tokens: [{ t: "$100", c: "Revenue" }, { t: "−" }, { t: "$35", c: "Gas and supplies" }, { t: "=" }, { t: "$65", c: "Profit", hl: true }] },
    { type: "compare", kicker: "Two kinds of cost", big: "Fixed and variable.", left: { h: "Variable", items: ["Supplies for each order", "Gas for each trip"] }, right: { h: "Fixed", items: ["App or website fee", "Equipment you bought once"] } },
    { type: "calc", tone: "acc", kicker: "Break-even", big: "When do you start making money?", tokens: [{ t: "$25", c: "Fixed costs" }, { t: "÷" }, { t: "$16", c: "Profit per sale" }, { t: "=" }, { t: "2 sales", c: "To break even", hl: true }] },
    { type: "steps", kicker: "Set a price", big: "Three questions.", items: [{ h: "Costs", p: "What does one job cost?" }, { h: "Time", p: "What's an hour worth?" }, { h: "Market", p: "What do others charge?" }] },
    { type: "quiz", q: "You earn $120 and spend $45 on supplies. Profit?", opts: ["$165", "$75", "$45"], a: 1, why: "Profit is revenue minus costs." },
    { type: "outro", tone: "dark", big: "Keep records.", sub: "Next: insurance." }
  ] },

  "lesson-13": { title: "Insurance", art: "umbrella", scenes: [
    { type: "title", tone: "dark", kicker: "Lesson 13", big: "Pay a little. Dodge a big loss.", sub: "That's the whole idea of insurance." },
    { type: "points", kicker: "The words", big: "Four to know.", items: [{ h: "Premium", p: "What you pay for coverage" }, { h: "Deductible", p: "What you pay first" }, { h: "Claim", p: "Asking the insurer to pay" }, { h: "Coverage", p: "What's actually included" }] },
    { type: "compare", kicker: "When it's worth it", big: "Big, unlikely, unaffordable.", left: { h: "Worth considering", items: ["A hospital stay", "A car accident", "A house fire"] }, right: { h: "Usually not", items: ["Earbuds", "A $30 case", "Small, affordable losses"] } },
    { type: "calc", kicker: "The math", big: "Phone plan: worth it?", tokens: [{ t: "$800", c: "Phone" }, { t: "×" }, { t: "15%", c: "Chance of loss" }, { t: "=" }, { t: "$120", c: "Expected loss a year", hl: true }], note: "The plan costs $108 plus a $50 deductible when you claim. Close call, so read the exclusions." },
    { type: "flags", tone: "dark", kicker: "Check before you buy", big: "Read the fine print.", items: ["What's excluded?", "What's the deductible?", "Who pays if it's stolen?", "What does it cost over a year?"] },
    { type: "quiz", q: "What does a higher deductible usually do?", opts: ["Raises your premium", "Lowers your premium", "Cancels coverage"], a: 1, why: "You take on more of the first loss, so the insurer charges less." },
    { type: "outro", tone: "acc", big: "Insure the disasters.", sub: "Save for the small stuff." }
  ] },

  "lesson-14": { title: "Fact or hype", art: "megaphone", scenes: [
    { type: "title", tone: "dark", kicker: "Lesson 14", big: "“Turned $500 into $50,000 in a week.”", sub: "What do you check first?" },
    { type: "flags", kicker: "How hype works", big: "Spot the tricks.", items: ["Fear of missing out", "Fake deadlines", "Screenshots as proof", "Confident voices, no evidence", "Only the winners show up"] },
    { type: "steps", tone: "dark", kicker: "The incentive check", big: "Follow the money.", items: [{ h: "Who's talking?" }, { h: "How do they get paid?" }, { h: "What if they're wrong?" }] },
    { type: "points", kicker: "Your filter", big: "Five questions.", items: ["Who says it, and what do they gain?", "Where's the real evidence?", "What's the risk?", "What's the time frame?", "What would a skeptic say?"] },
    { type: "compare", kicker: "Spot the difference", big: "Hype vs. honest.", left: { h: "Honest", items: ["Names the risk", "Cites a source", "No guarantees"] }, right: { h: "Hype", items: ["'Guaranteed', 'no risk'", "Screenshots only", "Act now"] } },
    { type: "quiz", q: "Which claim should worry you most?", opts: ["Diversifying can reduce risk", "Guaranteed 10x in a week", "Interest compounds over time"], a: 1, why: "Nobody can guarantee fast returns." },
    { type: "outro", tone: "acc", big: "Slow down. Check.", sub: "Next: paying for college." }
  ] },

  "lesson-15": { title: "Paying for college", art: "cap", scenes: [
    { type: "title", tone: "dark", kicker: "Lesson 15", big: "Almost nobody pays sticker price.", sub: "What matters is the net price." },
    { type: "calc", kicker: "Net price", big: "What you really pay.", tokens: [{ t: "$30k", c: "Sticker price" }, { t: "−" }, { t: "$12k", c: "Grants and savings" }, { t: "=" }, { t: "$18k", c: "Net, per year", hl: true }] },
    { type: "steps", kicker: "Ways to pay", big: "Best to worst.", items: [{ h: "Grants", p: "Free" }, { h: "Savings and work", p: "Yours" }, { h: "Federal loans", p: "Protections" }, { h: "Private loans", p: "Last resort" }] },
    { type: "chart", tone: "dark", kicker: "A $20,000 loan at 6.5%", big: "Interest adds up.", sub: "Illustrative.", x0: "Borrowed", x1: "Repaid over 10 years", series: [{ name: "What you borrowed", v: [20000, 20000, 20000, 20000, 20000], end: "$20,000" }, { name: "What you repay", v: [20000, 21600, 23200, 24800, 27200], end: "≈ $27,200" }] },
    { type: "points", kicker: "Smart moves", big: "Cut the bill.", items: ["Compare net prices", "Start at community college", "Look at trade programs", "Know your monthly payment"] },
    { type: "quiz", q: "Which is usually the best way to pay?", opts: ["Private loans", "Grants and scholarships", "Credit cards"], a: 1, why: "Free money beats borrowed money." },
    { type: "outro", tone: "acc", big: "Borrow on purpose.", sub: "Now go play the Arcade." }
  ] },

  /* ---------- Quick takes: 30-second explainers ---------- */
  "quick-debit-credit": { title: "Debit vs. credit", art: "card", quick: true, scenes: [
    { type: "title", tone: "dark", kicker: "Quick take", big: "Same size. Very different cards.", sub: "30 seconds." },
    { type: "compare", kicker: "The difference", big: "Whose money is it?", left: { h: "Debit", items: ["Your own money", "No interest", "Can't spend what you don't have"] }, right: { h: "Credit", items: ["The bank's money", "Interest if unpaid", "Builds a credit history"] } },
    { type: "flags", tone: "dark", kicker: "The catch", big: "Credit costs if you carry a balance.", items: ["Pay the full balance monthly", "Never just the minimum", "Don't buy wants you can't afford"] },
    { type: "quiz", q: "Whose money do you spend with a debit card?", opts: ["Yours", "The bank's", "The store's"], a: 0, why: "Debit pulls straight from your account." },
    { type: "outro", tone: "acc", big: "Know whose money it is.", sub: "" }
  ] },
  "quick-emergency": { title: "The emergency fund", art: "piggy", quick: true, scenes: [
    { type: "title", tone: "dark", kicker: "Quick take", big: "The money you hope you never use.", sub: "30 seconds." },
    { type: "steps", kicker: "How to build one", big: "Start small.", items: [{ h: "Start with $100" }, { h: "Aim for $500" }, { h: "Then 3 months of costs" }] },
    { type: "compare", kicker: "What counts", big: "Emergency or not?", left: { h: "Emergency", items: ["Broken phone you need", "Surprise medical bill"] }, right: { h: "Not an emergency", items: ["A sale on sneakers", "Concert tickets"] } },
    { type: "quiz", q: "Where should it live?", opts: ["A savings account you can reach", "Crypto", "Under your mattress"], a: 0, why: "Safe, separate and accessible." },
    { type: "outro", tone: "acc", big: "Build your cushion.", sub: "" }
  ] },
  "quick-etf": { title: "What's an ETF?", art: "chart", quick: true, scenes: [
    { type: "title", tone: "dark", kicker: "Quick take", big: "One purchase. Hundreds of companies.", sub: "30 seconds." },
    { type: "split", kicker: "A basket", big: "Own a little of everything.", parts: [["Company A", 34, "Tech"], ["Company B", 33, "Food"], ["Company C", 33, "Energy"]] },
    { type: "compare", kicker: "Why it helps", big: "Spreads the risk.", left: { h: "One company", items: ["Big win or big loss"] }, right: { h: "An ETF", items: ["One falls, others cushion it"] } },
    { type: "quiz", q: "Does an ETF remove all risk?", opts: ["Yes", "No, the whole market can fall"], a: 1, why: "It reduces single-company risk, not market risk." },
    { type: "outro", tone: "acc", big: "Diversify.", sub: "" }
  ] },
  "quick-opportunity": { title: "Opportunity cost", art: "scale", quick: true, scenes: [
    { type: "title", tone: "dark", kicker: "Quick take", big: "Every yes is a no to something else.", sub: "30 seconds." },
    { type: "calc", kicker: "$40 to spend", big: "Pick one.", tokens: [{ t: "$40", c: "Your money" }, { t: "=" }, { t: "A hoodie", c: "Option A" }, { t: "or" }, { t: "2 months of savings", c: "Option B", hl: true }] },
    { type: "points", kicker: "Ask yourself", big: "Before you buy.", items: ["What else could this money do?", "Will I still care next week?", "What am I giving up?"] },
    { type: "quiz", q: "Opportunity cost is…", opts: ["The price tag", "What you give up by choosing", "A fee"], a: 1, why: "The next-best thing you didn't do." },
    { type: "outro", tone: "acc", big: "Choose on purpose.", sub: "" }
  ] },
  "quick-apr-apy": { title: "APR vs. APY", art: "percent", quick: true, scenes: [
    { type: "title", tone: "dark", kicker: "Quick take", big: "Two three-letter words. Opposite sides.", sub: "30 seconds." },
    { type: "compare", kicker: "Which is which", big: "Pay vs. earn.", left: { h: "APR", items: ["The cost of borrowing", "You want it low"] }, right: { h: "APY", items: ["What savings earn, with compounding", "You want it high"] } },
    { type: "calc", kicker: "Example", big: "$1,000 at 4% APY.", tokens: [{ t: "$1,000" }, { t: "×" }, { t: "1.04", c: "One year" }, { t: "=" }, { t: "$1,040", c: "After a year", hl: true }] },
    { type: "quiz", q: "You'd rather see a high…", opts: ["APR on a loan", "APY on savings"], a: 1, why: "High APY pays you more. High APR costs you more." },
    { type: "outro", tone: "acc", big: "Low APR. High APY.", sub: "" }
  ] },
  "quick-fact-hype": { title: "Spot the hype", art: "megaphone", quick: true, scenes: [
    { type: "title", tone: "dark", kicker: "Quick take", big: "If it sounds amazing, slow down.", sub: "30 seconds." },
    { type: "flags", kicker: "Red flags", big: "Hype tells.", items: ["'Guaranteed' or 'no risk'", "Fast, huge returns", "Deadline pressure", "Screenshots, not sources"] },
    { type: "steps", tone: "dark", kicker: "Do this", big: "Stop, check, ask.", items: [{ h: "Stop" }, { h: "Check the source" }, { h: "Ask an adult" }] },
    { type: "quiz", q: "A real investment will…", opts: ["Guarantee profits", "Mention the risk"], a: 1, why: "All investing has risk." },
    { type: "outro", tone: "acc", big: "Hype hides the risk.", sub: "" }
  ] },
  "quick-subscriptions": { title: "The subscription trap", art: "tag", quick: true, scenes: [
    { type: "title", tone: "dark", kicker: "Quick take", big: "$12 a month feels like nothing.", sub: "30 seconds." },
    { type: "calc", kicker: "The real number", big: "Do the multiplication.", tokens: [{ t: "$12", c: "Per month" }, { t: "×" }, { t: "12", c: "Months" }, { t: "=" }, { t: "$144", c: "Per year", hl: true }] },
    { type: "steps", kicker: "Fix it", big: "A 5-minute audit.", items: [{ h: "List every one" }, { h: "Total the year" }, { h: "Cancel what you forgot" }] },
    { type: "quiz", q: "A $9 monthly plan costs about…", opts: ["$9 a year", "$108 a year", "$900 a year"], a: 1, why: "9 × 12 = 108." },
    { type: "outro", tone: "acc", big: "Small leaks sink budgets.", sub: "" }
  ] },
  "quick-503020": { title: "The 50/30/20 rule", art: "plan", quick: true, scenes: [
    { type: "title", tone: "dark", kicker: "Quick take", big: "A budget in one line.", sub: "30 seconds." },
    { type: "split", kicker: "Split your money", big: "50 / 30 / 20.", parts: [["Needs", 50, "Bills, food, transport"], ["Wants", 30, "Fun, on purpose"], ["Savings", 20, "Goals and cushion"]] },
    { type: "calc", kicker: "Example", big: "On $200 a month.", tokens: [{ t: "$100", c: "Needs" }, { t: "+" }, { t: "$60", c: "Wants" }, { t: "+" }, { t: "$40", c: "Savings", hl: true }] },
    { type: "quiz", q: "What's 20% of $150?", opts: ["$20", "$30", "$50"], a: 1, why: "150 × 0.20 = 30." },
    { type: "outro", tone: "acc", big: "Adjust it to your life.", sub: "" }
  ] }

};
