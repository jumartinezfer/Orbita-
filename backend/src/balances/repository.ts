import { randomUUID } from "node:crypto";
import type { Db } from "../db.js";
import { errors } from "../lib/errors.js";

export type MovementType = "deposit" | "withdrawal";
export type MovementSource = "manual" | "webhook";

export interface Transaction {
  id: string;
  user_id: string;
  type: MovementType;
  amount_cents: number;
  balance_after_cents: number;
  source: MovementSource;
  created_at: string;
}

export function getBalanceCents(db: Db, userId: string): number {
  const row = db
    .prepare("SELECT amount_cents FROM balances WHERE user_id = ?")
    .get(userId) as { amount_cents: number } | undefined;

  if (row) return row.amount_cents;

  db.prepare("INSERT INTO balances (user_id, amount_cents) VALUES (?, 0)").run(userId);
  return 0;
}

export function applyMovement(
  db: Db,
  params: { userId: string; type: MovementType; amountCents: number; source: MovementSource },
): { balanceCents: number; transaction: Transaction } {
  const current = getBalanceCents(db, params.userId);
  const delta = params.type === "deposit" ? params.amountCents : -params.amountCents;
  const next = current + delta;

  if (next < 0) {
    throw errors.insufficientFunds();
  }

  db.prepare("UPDATE balances SET amount_cents = ? WHERE user_id = ?").run(next, params.userId);

  const transaction: Transaction = {
    id: randomUUID(),
    user_id: params.userId,
    type: params.type,
    amount_cents: params.amountCents,
    balance_after_cents: next,
    source: params.source,
    created_at: new Date().toISOString(),
  };

  db.prepare(
    `INSERT INTO transactions (id, user_id, type, amount_cents, balance_after_cents, source, created_at)
     VALUES (@id, @user_id, @type, @amount_cents, @balance_after_cents, @source, @created_at)`,
  ).run(transaction);

  return { balanceCents: next, transaction };
}

export function listTransactions(
  db: Db,
  userId: string,
  pagination: { limit: number; offset: number },
): { items: Transaction[]; total: number } {
  const items = db
    .prepare(
      `SELECT * FROM transactions WHERE user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT ? OFFSET ?`,
    )
    .all(userId, pagination.limit, pagination.offset) as Transaction[];

  const { total } = db
    .prepare("SELECT COUNT(*) AS total FROM transactions WHERE user_id = ?")
    .get(userId) as { total: number };

  return { items, total };
}
