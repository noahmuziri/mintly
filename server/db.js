// Tiny JSON-file store: everything lives in memory and is written to .data/db.json after changes.
// Fine for an MVP on one server. Move to a real database (Postgres) before running more than one
// instance or storing anything you can't afford to lose. The .data folder is hidden, so the static
// file server never serves it, and it is gitignored.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// DATA_DIR lets a host keep the data on a persistent volume (keep it outside the site folder).
const DIR = process.env.DATA_DIR || path.join(__dirname, "..", ".data");
const FILE = path.join(DIR, "db.json");

let data = { users: {}, sessions: {}, classes: {}, tokens: {} };
try {
  data = { ...data, ...JSON.parse(fs.readFileSync(FILE, "utf8")) };
} catch (e) {}

let timer;
function write() {
  fs.mkdirSync(DIR, { recursive: true });
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, FILE); // atomic: a crash mid-write can't leave a half-written file
}
function save() {
  clearTimeout(timer);
  timer = setTimeout(write, 300);
}
for (const sig of ["exit", "SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    if (timer) write();
    if (sig !== "exit") process.exit(0);
  });
}

const id = () => crypto.randomBytes(8).toString("hex");

// Join codes avoid look-alike characters (0/O, 1/I) so they are easy to read out and type.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newCode() {
  for (;;) {
    let code = "";
    for (const b of crypto.randomBytes(6)) code += ALPHABET[b % ALPHABET.length];
    const taken =
      Object.values(data.users).some((u) => u.linkCode === code) ||
      Object.values(data.classes).some((c) => c.code === code);
    if (!taken) return code;
  }
}

const userByEmail = (email) => Object.values(data.users).find((u) => u.email === email);
const userByLinkCode = (code) => Object.values(data.users).find((u) => u.linkCode === code);
const classByCode = (code) => Object.values(data.classes).find((c) => c.code === code);

module.exports = { data, save, id, newCode, userByEmail, userByLinkCode, classByCode };
