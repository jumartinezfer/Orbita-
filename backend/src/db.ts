import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { env } from "./env.js";
import { hashPassword } from "./auth/password.js";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS balances (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  amount_cents INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  amount_cents INTEGER NOT NULL,
  balance_after_cents INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('manual', 'webhook')),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_created
  ON transactions (user_id, created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT NOT NULL,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (key, user_id, endpoint)
);

CREATE TABLE IF NOT EXISTS webhook_events (
  event_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`;

export function createDb(location: string = env.databaseUrl) {
  if (location !== ":memory:") {
    mkdirSync(dirname(location), { recursive: true });
  }

  const db = new Database(location);
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA);
  seedUsers(db);
  return db;
}

function seedUsers(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number };
  if (count.count > 0) return;

  const insertUser = db.prepare(
    "INSERT INTO users (id, email, password_hash) VALUES (@id, @email, @password_hash)",
  );
  const insertBalance = db.prepare(
    "INSERT INTO balances (user_id, amount_cents) VALUES (?, 0)",
  );

  const seedUsers = [
    { id: "u_123", email: "ana@orbita.test", password: "Orbita123!" },
    { id: "u_456", email: "bruno@orbita.test", password: "Orbita123!" },
  ];

  const seed = db.transaction(() => {
    for (const user of seedUsers) {
      insertUser.run({ id: user.id, email: user.email, password_hash: hashPassword(user.password) });
      insertBalance.run(user.id);
    }
  });
  seed();
}

export type Db = ReturnType<typeof createDb>;
