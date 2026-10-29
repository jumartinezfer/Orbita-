import { centsToAmount } from "../lib/money.js";
import type { Transaction } from "./repository.js";

export function serializeTransaction(transaction: Transaction) {
  return {
    id: transaction.id,
    type: transaction.type,
    amount: centsToAmount(transaction.amount_cents),
    currency: "USD",
    balanceAfter: centsToAmount(transaction.balance_after_cents),
    source: transaction.source,
    createdAt: transaction.created_at,
  };
}
