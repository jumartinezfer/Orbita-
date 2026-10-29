export const MAX_AMOUNT = 10_000;

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

export function validateAmount(raw: string): string | null {
  const trimmed = raw.trim();

  if (!trimmed) return "Ingresa un monto.";
  if (!AMOUNT_PATTERN.test(trimmed)) {
    return "Usa un número positivo con máximo 2 decimales, por ejemplo 150.25.";
  }

  const value = Number(trimmed);
  if (value <= 0) return "El monto debe ser mayor que cero.";
  if (value > MAX_AMOUNT) return `El monto máximo por operación es ${MAX_AMOUNT.toLocaleString("en-US")} USD.`;

  return null;
}
