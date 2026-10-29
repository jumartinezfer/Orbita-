import type { ErrorRequestHandler } from "express";
import { AppError } from "./errors.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
  }

  console.error(err);
  res.status(500).json({
    error: { code: "internal_error", message: "Ocurrió un error inesperado." },
  });
};
