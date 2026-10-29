import { AppError } from "./errors.js";

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
export const MAX_AMOUNT_CENTS = 10_000_00;

export function parseAmountToCents(raw: unknown): number {
  if (typeof raw !== "string" || !AMOUNT_PATTERN.test(raw)) {
    throw new AppError(
      400,
      "invalid_amount",
      "El monto debe ser un número positivo con máximo 2 decimales, enviado como texto.",
    );
  }

  const [whole, fraction = ""] = raw.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));

  if (cents <= 0) {
    throw new AppError(400, "invalid_amount", "El monto debe ser mayor que cero.");
  }
  if (cents > MAX_AMOUNT_CENTS) {
    throw new AppError(
      400,
      "amount_too_large",
      "El monto máximo por operación es 10,000 USD.",
    );
  }

  return cents;
}

export function centsToAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}
