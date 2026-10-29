import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { buildTestApp, seededUser } from "./helpers.js";

async function login(app: Express) {
  const res = await request(app)
    .post("/auth/login")
    .send({ email: seededUser.email, password: seededUser.password });
  return res.body.token as string;
}

describe("balance movements", () => {
  let app: Express;
  let token: string;

  beforeEach(async () => {
    ({ app } = buildTestApp());
    token = await login(app);
  });

  it("starts at 0 and creates the balance lazily", async () => {
    const res = await request(app).get("/balances/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.balance).toBe("0.00");
  });

  it("requires an Idempotency-Key header", async () => {
    const res = await request(app)
      .post("/balances/me/deposits")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: "10.00", currency: "USD" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("missing_idempotency_key");
  });

  it("does not double-credit a deposit replayed with the same key", async () => {
    const payload = { amount: "100.00", currency: "USD" };

    const first = await request(app)
      .post("/balances/me/deposits")
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", "key-1")
      .send(payload);

    const second = await request(app)
      .post("/balances/me/deposits")
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", "key-1")
      .send(payload);

    expect(first.status).toBe(201);
    expect(second.body).toEqual(first.body);

    const balance = await request(app)
      .get("/balances/me")
      .set("Authorization", `Bearer ${token}`);
    expect(balance.body.balance).toBe("100.00");
  });

  it("never lets the balance go negative", async () => {
    const res = await request(app)
      .post("/balances/me/withdrawals")
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", "w-1")
      .send({ amount: "1.00", currency: "USD" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("insufficient_funds");
  });

  it("rejects amounts above the 10,000 USD limit", async () => {
    const res = await request(app)
      .post("/balances/me/deposits")
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", "big-1")
      .send({ amount: "10000.01", currency: "USD" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("amount_too_large");
  });

  it("rejects amounts with more than 2 decimals", async () => {
    const res = await request(app)
      .post("/balances/me/deposits")
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", "dec-1")
      .send({ amount: "10.123", currency: "USD" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_amount");
  });

  it("paginates the transaction history, newest first", async () => {
    for (const amount of ["10.00", "20.00", "30.00"]) {
      await request(app)
        .post("/balances/me/deposits")
        .set("Authorization", `Bearer ${token}`)
        .set("Idempotency-Key", `dep-${amount}`)
        .send({ amount, currency: "USD" });
    }

    const page = await request(app)
      .get("/balances/me/transactions?limit=2&offset=0")
      .set("Authorization", `Bearer ${token}`);

    expect(page.body.items).toHaveLength(2);
    expect(page.body.items[0].amount).toBe("30.00");
    expect(page.body.hasMore).toBe(true);
    expect(page.body.total).toBe(3);
  });
});
