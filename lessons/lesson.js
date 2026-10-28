/* Shared lesson activities: quizzes, saved typed answers, the matching game, fill in the blank
   and the "Mark lesson complete" button. Each lesson page loads this after script.js and keeps
   only its own calculator inline. The lesson id comes from the file name (lesson-3.html -> lesson-3).
   Progress is saved to the student's account through Mintly (script.js); teachers and parents can
   preview a lesson but nothing is saved for them. */
Mintly.ready.then(function () {
  const LESSON = (location.pathname.match(/(lesson-\d+)\.html$/) || [])[1];
  if (!Mintly.requireLogin()) return;

  // --- Progress inside a lesson: quiz picks, solved blanks and matched pairs are saved to the
  // account, so a reload (or another device) puts the student back where they were. The student,
  // parent and teacher dashboards read done/total. ---
  let restoring = false;
  const state = JSON.parse(JSON.stringify(Mintly.getLessonState(LESSON)));
  state.quiz = state.quiz || {};
  state.blanks = state.blanks || [];
  state.match = state.match || [];
  function saveState() {
    if (restoring) return;
    state.total = document.querySelectorAll('[data-quiz]').length +
      document.querySelectorAll('.blank-row').length +
      document.querySelectorAll('#match-game [data-term]').length;
    state.done = Object.keys(state.quiz).length + state.blanks.length + state.match.length;
    Mintly.saveLessonState(LESSON, JSON.parse(JSON.stringify(state)));
  }

  document.querySelectorAll('[data-quiz]').forEach((group, groupIndex) => {
    const feedback = group.nextElementSibling;
    group.querySelectorAll('.quiz-option').forEach((btn, btnIndex) => {
      btn.addEventListener('click', () => {
        if (group.dataset.answered) return;
        state.quiz[groupIndex] = btnIndex;
        saveState();
        group.dataset.answered = 'true';
        const isCorrect = btn.dataset.correct === 'true';
        btn.classList.add(isCorrect ? 'correct' : 'incorrect');
        if (!isCorrect) {
          group.querySelector('[data-correct="true"]').classList.add('correct');
        }
        feedback.textContent = isCorrect ? 'Correct! Nice work.' : 'Not quite — the correct answer is highlighted.';
        feedback.classList.add(isCorrect ? 'correct' : 'incorrect');
      });
    });
    const savedPick = state.quiz[groupIndex];
    if (savedPick !== undefined) {
      const opt = group.querySelectorAll('.quiz-option')[savedPick];
      if (opt) { restoring = true; opt.click(); restoring = false; }
    }
  });

  // --- Typed answers: saved to the account so they survive a reload ---
  const loadAnswers = () => Mintly.getAnswers(LESSON);
  const saveAnswer = (key, value) => Mintly.saveAnswer(LESSON, key, value);

  const warmupEcho = document.getElementById('warmup-echo');
  function renderWarmupEcho() {
    const text = (loadAnswers().warmup || '').trim();
    if (warmupEcho && text) {
      warmupEcho.textContent = text;
      warmupEcho.classList.add('filled');
    }
  }

  const saved = loadAnswers();
  document.querySelectorAll('[data-save]').forEach((box) => {
    const key = box.dataset.save;
    if (saved[key]) box.value = saved[key];
    box.addEventListener('input', () => {
      saveAnswer(key, box.value);
      if (key === 'warmup') renderWarmupEcho();
    });
  });
  renderWarmupEcho();

  document.querySelectorAll('[data-lock]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const box = document.getElementById(btn.dataset.lock);
      const status = document.getElementById('warmup-status');
      if (box.value.trim().length < 10) {
        status.textContent = 'Write a little more first, even one full sentence.';
        return;
      }
      saveAnswer(box.dataset.save, box.value);
      renderWarmupEcho();
      status.textContent = 'Saved. You\'ll see this again at the end of the lesson.';
    });
  });

  // "Compare with a sample answer": only after the student has written something.
  document.querySelectorAll('[data-reveal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const box = document.getElementById(btn.dataset.needs);
      const status = document.getElementById(btn.dataset.needs + '-status');
      if (box.value.trim().length < 20) {
        status.textContent = 'Write your own answer first, then compare.';
        box.focus();
        return;
      }
      status.textContent = '';
      document.getElementById(btn.dataset.reveal).hidden = false;
    });
  });

  // --- Matching: tap a word, then its definition (or the other way round) ---
  const game = document.getElementById('match-game');
  if (game) {
    const matchStatus = document.getElementById('match-status');
    const totalPairs = game.querySelectorAll('[data-term]').length;
    let picked = null;
    let matched = 0;
    const keyOf = (el) => el.dataset.term || el.dataset.def;

    function markMatched(key) {
      game.querySelectorAll('[data-term="' + key + '"],[data-def="' + key + '"]').forEach((el) => {
        el.classList.add('matched');
        el.setAttribute('aria-disabled', 'true');
      });
    }
    state.match.forEach((key) => { markMatched(key); matched += 1; });
    if (matched) matchStatus.textContent = matched + ' of ' + totalPairs + ' matched.';

    game.querySelectorAll('.match-item').forEach((item) => {
      item.addEventListener('click', () => {
        if (item.classList.contains('matched')) return;
        if (!picked || picked.classList.contains('def') === item.classList.contains('def')) {
          if (picked) picked.classList.remove('selected');
          picked = item;
          item.classList.add('selected');
          return;
        }
        const first = picked;
        picked = null;
        first.classList.remove('selected');
        if (keyOf(first) === keyOf(item)) {
          [first, item].forEach((el) => {
            el.classList.add('matched');
            el.setAttribute('aria-disabled', 'true');
          });
          matched += 1;
          if (!state.match.includes(keyOf(item))) state.match.push(keyOf(item));
          saveState();
          const term = game.querySelector('[data-term="' + keyOf(item) + '"]').textContent;
          matchStatus.textContent = matched === totalPairs
            ? 'All ' + totalPairs + ' matched! You know the key words.'
            : 'Yes, that\'s ' + term + '. ' + matched + ' of ' + totalPairs + ' matched.';
        } else {
          [first, item].forEach((el) => {
            el.classList.add('wrong');
            setTimeout(() => el.classList.remove('wrong'), 600);
          });
          matchStatus.textContent = 'Not quite. Try a different pair. ' + matched + ' of ' + totalPairs + ' matched.';
        }
      });
    });
  }

  // --- Fill in the blank: hint after one miss, answer after three ---
  document.querySelectorAll('.blank-row').forEach((row, rowIndex) => {
    const input = row.querySelector('.blank-input');
    const status = row.querySelector('.blank-status');
    const answers = row.dataset.answers.split('|');
    let misses = 0;
    function check() {
      // "Gross." or "take  home" should count: ignore case, extra spaces and end punctuation
      const guess = input.value.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.!?,;:]+$/, '');
      if (!guess) return;
      if (answers.includes(guess)) {
        row.classList.add('right');
        row.classList.remove('miss');
        input.readOnly = true;
        status.textContent = 'Correct';
        if (!state.blanks.includes(rowIndex)) state.blanks.push(rowIndex);
        saveState();
        return;
      }
      misses += 1;
      row.classList.add('miss');
      if (misses >= 3) {
        status.textContent = 'The answer is "' + answers[0] + '".';
      } else {
        status.textContent = 'Not quite. Hint: it starts with "' + answers[0][0] + '".';
      }
    }
    if (state.blanks.includes(rowIndex)) {
      input.value = answers[0];
      check();
    }
    row.querySelector('button').addEventListener('click', check);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') check();
    });
  });

  saveState();

  const completeBtn = document.getElementById('complete-btn');
  if (completeBtn && LESSON) {
    const renderComplete = () => {
      if (Mintly.isLessonComplete(LESSON)) {
        completeBtn.textContent = '✓ Lesson complete';
        completeBtn.classList.add('done');
      }
    };
    completeBtn.addEventListener('click', () => {
      Mintly.markLessonComplete(LESSON);
      renderComplete();
    });
    renderComplete();
  }
});

/* Slide recap link and optional video, added to every lesson page.
   Set "video": "<YouTube id>" on a lesson in curriculum.json to embed a video under the title. */
(function () {
  if (typeof Mintly === "undefined") return;
  Mintly.ready.then(function () {
    var id = location.pathname.split("/").pop().replace(".html", "");
    var lesson = Mintly.LESSONS.filter(function (l) { return l.id === id; })[0];
    var meta = document.querySelector(".lesson-meta");
    if (!lesson || !meta) return;
    var n = Mintly.LESSON_IDS.indexOf(id) + 1;
    var box = document.createElement("div");
    box.style.cssText = "margin:10px 0 18px";
    box.innerHTML = '<a class="btn ghost" style="text-decoration:none;display:inline-flex;align-items:center;min-height:40px" href="../slides.html?lesson=' + n + '">▶ Watch the 1-minute recap</a>';
    meta.insertAdjacentElement("afterend", box);
    if (/^[\w-]{6,20}$/.test(lesson.video || "")) {
      var v = document.createElement("div");
      v.style.cssText = "position:relative;padding-top:56.25%;border-radius:18px;overflow:hidden;margin:0 0 22px;background:#000";
      v.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + lesson.video + '" title="' + lesson.title.replace(/"/g, "") + ' video" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>';
      box.insertAdjacentElement("afterend", v);
    }
  });
})();
