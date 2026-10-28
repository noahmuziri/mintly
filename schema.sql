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

-- Accounts and synced learner data (passwords are PBKDF2-hashed; sessions store only a hash of the token)
CREATE TABLE IF NOT EXISTS users (
  email   TEXT PRIMARY KEY,
  name    TEXT NOT NULL,
  role    TEXT NOT NULL,
  plan    TEXT,
  salt    TEXT NOT NULL,
  hash    TEXT NOT NULL,
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  email      TEXT NOT NULL,
  exp        INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_email ON sessions(email);
CREATE TABLE IF NOT EXISTS userdata (
  email   TEXT PRIMARY KEY,
  json    TEXT NOT NULL,           -- the learner's own saved progress and work; never shown in admin Insights
  updated INTEGER
);
