import { describe, expect, it } from "vitest";
import request from "supertest";
import { buildTestApp, seededUser } from "./helpers.js";

describe("POST /auth/login", () => {
  it("returns a token for valid credentials", async () => {
    const { app } = buildTestApp();

    const res = await request(app)
      .post("/auth/login")
      .send({ email: seededUser.email, password: seededUser.password });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
  });

  it("returns the same error for unknown email and wrong password", async () => {
    const { app } = buildTestApp();

    const unknownEmail = await request(app)
      .post("/auth/login")
      .send({ email: "nadie@orbita.test", password: "whatever" });

    const wrongPassword = await request(app)
      .post("/auth/login")
      .send({ email: seededUser.email, password: "wrong" });

    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.body.error.code).toBe(wrongPassword.body.error.code);
  });
});

describe("authenticated routes", () => {
  it("reject requests without a token", async () => {
    const { app } = buildTestApp();
    const res = await request(app).get("/balances/me");
    expect(res.status).toBe(401);
  });

  it("reject requests with a malformed token", async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .get("/balances/me")
      .set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });
});
