import { Router } from "express";
import { z } from "zod";
import type { Db } from "../db.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { errors } from "../lib/errors.js";
import { verifyPassword } from "./password.js";
import { signToken } from "./tokens.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
}

export function authRouter(db: Db) {
  const router = Router();

  router.post(
    "/login",
    asyncHandler(async (req, res) => {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        throw errors.validation("Email y contraseña son obligatorios.");
      }

      const user = db
        .prepare("SELECT id, email, password_hash FROM users WHERE email = ?")
        .get(parsed.data.email) as UserRow | undefined;

      if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
        throw errors.invalidCredentials();
      }

      res.json({ token: signToken(user.id) });
    }),
  );

  return router;
}
