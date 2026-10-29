import type { Db } from "../db.js";

interface IdempotencyRow {
  status_code: number;
  response_body: string;
}

interface Params {
  key: string;
  userId: string;
  endpoint: string;
}

interface Result {
  statusCode: number;
  body: unknown;
}

export function withIdempotency(db: Db, params: Params, run: () => Result): Result {
  const existing = db
    .prepare(
      "SELECT status_code, response_body FROM idempotency_keys WHERE key = ? AND user_id = ? AND endpoint = ?",
    )
    .get(params.key, params.userId, params.endpoint) as IdempotencyRow | undefined;

  if (existing) {
    return { statusCode: existing.status_code, body: JSON.parse(existing.response_body) };
  }

  const execute = db.transaction(() => {
    const result = run();
    db.prepare(
      `INSERT INTO idempotency_keys (key, user_id, endpoint, status_code, response_body, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      params.key,
      params.userId,
      params.endpoint,
      result.statusCode,
      JSON.stringify(result.body),
      new Date().toISOString(),
    );
    return result;
  });

  return execute();
}
