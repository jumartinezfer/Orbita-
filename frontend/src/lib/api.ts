const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type SessionExpiredHandler = (reason: string) => void;

let onSessionExpired: SessionExpiredHandler | null = null;

export function setSessionExpiredHandler(handler: SessionExpiredHandler | null) {
  onSessionExpired = handler;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
  idempotencyKey?: string;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await safeJson(res);

  if (!res.ok) {
    const code = payload?.error?.code ?? "unknown_error";
    const message = payload?.error?.message ?? "Ocurrió un error inesperado.";

    if (res.status === 401 && onSessionExpired) {
      onSessionExpired(message);
    }

    throw new ApiError(res.status, code, message);
  }

  return payload as T;
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
