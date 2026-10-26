/* Shared lesson activities: quizzes, saved typed answers, the matching game, fill in the blank
   and the "Mark lesson complete" button. Each lesson page loads this after script.js and keeps
   only its own calculator inline. The lesson id comes from the file name (lesson-3.html -> lesson-3). */
(function () {
  const LESSON = (location.pathname.match(/(lesson-\d+)\.html$/) || [])[1];

  document.querySelectorAll('[data-quiz]').forEach((group) => {
    const feedback = group.nextElementSibling;
    group.querySelectorAll('.quiz-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (group.dataset.answered) return;
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
  });

  // --- Typed answers: saved in this browser so they survive a reload ---
  const ANSWER_KEY = 'mintly:' + LESSON + ':answers';
  function loadAnswers() {
    try { return JSON.parse(localStorage.getItem(ANSWER_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveAnswer(key, value) {
    const answers = loadAnswers();
    answers[key] = value;
    try { localStorage.setItem(ANSWER_KEY, JSON.stringify(answers)); } catch (e) {}
  }

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
  document.querySelectorAll('.blank-row').forEach((row) => {
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
    row.querySelector('button').addEventListener('click', check);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') check();
    });
  });

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
})();
