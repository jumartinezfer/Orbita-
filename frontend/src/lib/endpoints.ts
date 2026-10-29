import { apiRequest } from "./api";

export interface Transaction {
  id: string;
  type: "deposit" | "withdrawal";
  amount: string;
  currency: "USD";
  balanceAfter: string;
  source: "manual" | "webhook";
  createdAt: string;
}

export interface TransactionPage {
  items: Transaction[];
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export function login(email: string, password: string) {
  return apiRequest<{ token: string }>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function fetchBalance(token: string) {
  return apiRequest<{ balance: string; currency: "USD" }>("/balances/me", { token });
}

export function fetchTransactions(token: string, limit: number, offset: number) {
  return apiRequest<TransactionPage>(
    `/balances/me/transactions?limit=${limit}&offset=${offset}`,
    { token },
  );
}

export function deposit(token: string, amount: string, idempotencyKey: string) {
  return apiRequest<{ balance: string; transaction: Transaction }>("/balances/me/deposits", {
    method: "POST",
    token,
    idempotencyKey,
    body: { amount, currency: "USD" },
  });
}

export function withdraw(token: string, amount: string, idempotencyKey: string) {
  return apiRequest<{ balance: string; transaction: Transaction }>(
    "/balances/me/withdrawals",
    { method: "POST", token, idempotencyKey, body: { amount, currency: "USD" } },
  );
}
