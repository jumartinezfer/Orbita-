export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errors = {
  invalidCredentials: () =>
    new AppError(401, "invalid_credentials", "Email o contraseña incorrectos."),
  unauthorized: (message = "No autenticado.") =>
    new AppError(401, "unauthorized", message),
  validation: (message: string) => new AppError(400, "validation_error", message),
  missingIdempotencyKey: () =>
    new AppError(400, "missing_idempotency_key", "El header Idempotency-Key es obligatorio."),
  insufficientFunds: () =>
    new AppError(422, "insufficient_funds", "El saldo no puede quedar negativo."),
  invalidSignature: () =>
    new AppError(401, "invalid_signature", "Firma del webhook inválida."),
  notFound: (message = "Recurso no encontrado.") => new AppError(404, "not_found", message),
};
