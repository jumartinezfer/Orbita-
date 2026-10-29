import { Router } from "express";
import { z } from "zod";
import type { Db } from "../db.js";
import { requireAuth } from "../auth/middleware.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { errors } from "../lib/errors.js";
import { centsToAmount, parseAmountToCents } from "../lib/money.js";
import { applyMovement, getBalanceCents, listTransactions } from "./repository.js";
import { withIdempotency } from "./idempotency.js";
import { serializeTransaction } from "./serializers.js";

const movementSchema = z.object({
  amount: z.string(),
  currency: z.literal("USD"),
});

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePagination(query: Record<string, unknown>) {
  const limit = Math.min(Number(query.limit) || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = Math.max(Number(query.offset) || 0, 0);
  return { limit, offset };
}

function movementEndpoint(
  router: Router,
  db: Db,
  path: string,
  type: "deposit" | "withdrawal",
) {
  router.post(
    path,
    asyncHandler(async (req, res) => {
      const idempotencyKey = req.header("idempotency-key");
      if (!idempotencyKey) {
        throw errors.missingIdempotencyKey();
      }

      const parsed = movementSchema.safeParse(req.body);
      if (!parsed.success) {
        throw errors.validation('El body debe incluir "amount" (texto) y currency "USD".');
      }
      const amountCents = parseAmountToCents(parsed.data.amount);

      const { statusCode, body } = withIdempotency(
        db,
        { key: idempotencyKey, userId: req.userId, endpoint: path },
        () => {
          const { balanceCents, transaction } = applyMovement(db, {
            userId: req.userId,
            type,
            amountCents,
            source: "manual",
          });
          return {
            statusCode: 201,
            body: {
              balance: centsToAmount(balanceCents),
              currency: "USD",
              transaction: serializeTransaction(transaction),
            },
          };
        },
      );

      res.status(statusCode).json(body);
    }),
  );
}

export function balancesRouter(db: Db) {
  const router = Router();
  router.use(requireAuth);

  router.get(
    "/me",
    asyncHandler(async (req, res) => {
      const balanceCents = getBalanceCents(db, req.userId);
      res.json({ balance: centsToAmount(balanceCents), currency: "USD" });
    }),
  );

  movementEndpoint(router, db, "/me/deposits", "deposit");
  movementEndpoint(router, db, "/me/withdrawals", "withdrawal");

  router.get(
    "/me/transactions",
    asyncHandler(async (req, res) => {
      const pagination = parsePagination(req.query as Record<string, unknown>);
      const { items, total } = listTransactions(db, req.userId, pagination);

      res.json({
        items: items.map(serializeTransaction),
        limit: pagination.limit,
        offset: pagination.offset,
        total,
        hasMore: pagination.offset + items.length < total,
      });
    }),
  );

  return router;
}
