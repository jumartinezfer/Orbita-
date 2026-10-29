import cors from "cors";
import express from "express";
import type { Db } from "./db.js";
import { authRouter } from "./auth/routes.js";
import { balancesRouter } from "./balances/routes.js";
import { webhooksRouter } from "./webhooks/routes.js";
import { errorHandler } from "./lib/errorHandler.js";

export function createApp(db: Db) {
  const app = express();

  app.use(cors());
  app.use("/webhooks", webhooksRouter(db));

  app.use(express.json());
  app.use("/auth", authRouter(db));
  app.use("/balances", balancesRouter(db));

  app.use((_req, res) => {
    res.status(404).json({ error: { code: "not_found", message: "Ruta no encontrada." } });
  });

  app.use(errorHandler);

  return app;
}
