import type { NextFunction, Request, Response } from "express";
import { errors } from "../lib/errors.js";
import { verifyToken } from "./tokens.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(errors.unauthorized("Falta el header Authorization."));
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    next(errors.unauthorized("El token es inválido o expiró."));
  }
}
