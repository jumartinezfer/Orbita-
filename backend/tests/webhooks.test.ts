import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import request from "supertest";
import { buildTestApp, seededUser } from "./helpers.js";
import { env } from "../src/env.js";

function sign(body: string) {
  return createHmac("sha256", env.webhookSecret).update(body).digest("hex");
}

describe("POST /webhooks/payment-gateway", () => {
  it("rejects a payload with an invalid signature", async () => {
    const { app } = buildTestApp();
    const body = JSON.stringify({
      event_id: "evt_1",
      user_id: seededUser.id,
      amount: "50.00",
      currency: "USD",
      status: "approved",
    });

    const res = await request(app)
      .post("/webhooks/payment-gateway")
      .set("Content-Type", "application/json")
      .set("X-Signature", "0".repeat(64))
      .send(body);

    expect(res.status).toBe(401);
  });

  it("credits the balance once, even if the same event arrives twice", async () => {
    const { app } = buildTestApp();
    const body = JSON.stringify({
      event_id: "evt_dup",
      user_id: seededUser.id,
      amount: "75.50",
      currency: "USD",
      status: "approved",
    });
    const signature = sign(body);

    const first = await request(app)
      .post("/webhooks/payment-gateway")
      .set("Content-Type", "application/json")
      .set("X-Signature", signature)
      .send(body);

    const second = await request(app)
      .post("/webhooks/payment-gateway")
      .set("Content-Type", "application/json")
      .set("X-Signature", signature)
      .send(body);

    expect(first.status).toBe(200);
    expect(first.body.duplicate).toBe(false);
    expect(second.body.duplicate).toBe(true);

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: seededUser.email, password: seededUser.password });

    const balance = await request(app)
      .get("/balances/me")
      .set("Authorization", `Bearer ${loginRes.body.token}`);

    expect(balance.body.balance).toBe("75.50");
  });

  it("does not credit a rejected payment", async () => {
    const { app } = buildTestApp();
    const body = JSON.stringify({
      event_id: "evt_rejected",
      user_id: seededUser.id,
      amount: "40.00",
      currency: "USD",
      status: "rejected",
    });

    const res = await request(app)
      .post("/webhooks/payment-gateway")
      .set("Content-Type", "application/json")
      .set("X-Signature", sign(body))
      .send(body);

    expect(res.status).toBe(200);

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: seededUser.email, password: seededUser.password });

    const balance = await request(app)
      .get("/balances/me")
      .set("Authorization", `Bearer ${loginRes.body.token}`);

    expect(balance.body.balance).toBe("0.00");
  });
});
