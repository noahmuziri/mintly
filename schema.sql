-- Mintly analytics. Topics and activity only: nothing a learner types is stored, and learners are pseudonymous.
CREATE TABLE IF NOT EXISTS events (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  ts    INTEGER NOT NULL,          -- unix ms
  uid   TEXT    NOT NULL,          -- random id kept in the learner's own browser
  role  TEXT,
  plan  TEXT,
  type  TEXT    NOT NULL,          -- lesson_view, lesson_complete, quiz, film_play, leaf_topic, explore_interest, page_view
  key   TEXT,                      -- lesson id, topic category, or page
  value REAL                       -- e.g. quiz score
);
CREATE INDEX IF NOT EXISTS idx_events_ts  ON events(ts);
CREATE INDEX IF NOT EXISTS idx_events_uid ON events(uid);
