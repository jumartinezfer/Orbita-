function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: required("JWT_SECRET", "dev-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "30m",
  webhookSecret: required("PAYMENT_WEBHOOK_SECRET", "dev-webhook-secret"),
  databaseUrl: process.env.DATABASE_URL ?? "./data/orbita.db",
};
