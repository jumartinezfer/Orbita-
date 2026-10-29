import express, { Router } from "express";
import { z } from "zod";
import type { Db } from "../db.js";
import { env } from "../env.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { errors } from "../lib/errors.js";
import { parseAmountToCents } from "../lib/money.js";
import { applyMovement } from "../balances/repository.js";
import { isValidSignature } from "./signature.js";

const payloadSchema = z.object({
  event_id: z.string().min(1),
  user_id: z.string().min(1),
  amount: z.string(),
  currency: z.literal("USD"),
  status: z.enum(["approved", "rejected"]),
});

export function webhooksRouter(db: Db) {
  const router = Router();

  router.post(
    "/payment-gateway",
    express.raw({ type: "application/json" }),
    asyncHandler(async (req, res) => {
      const rawBody = req.body as Buffer;
      const signature = req.header("x-signature");

      if (!isValidSignature(rawBody, signature, env.webhookSecret)) {
        throw errors.invalidSignature();
      }

      let json: unknown;
      try {
        json = JSON.parse(rawBody.toString("utf8"));
      } catch {
        throw errors.validation("El body del webhook no es JSON válido.");
      }

      const parsed = payloadSchema.safeParse(json);
      if (!parsed.success) {
        throw errors.validation("El body del webhook no tiene el formato esperado.");
      }
      const event = parsed.data;

      const alreadyProcessed = db
        .prepare("SELECT 1 FROM webhook_events WHERE event_id = ?")
        .get(event.event_id);

      if (alreadyProcessed) {
        return res.status(200).json({ received: true, duplicate: true });
      }

      const userExists = db.prepare("SELECT 1 FROM users WHERE id = ?").get(event.user_id);
      if (!userExists) {
        throw errors.validation(`El usuario ${event.user_id} no existe.`);
      }

      const record = db.transaction(() => {
        if (event.status === "approved") {
          applyMovement(db, {
            userId: event.user_id,
            type: "deposit",
            amountCents: parseAmountToCents(event.amount),
            source: "webhook",
          });
        }

        db.prepare(
          "INSERT INTO webhook_events (event_id, status, created_at) VALUES (?, ?, ?)",
        ).run(event.event_id, event.status, new Date().toISOString());
      });
      record();

      res.status(200).json({ received: true, duplicate: false });
    }),
  );

  return router;
}
