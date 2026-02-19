export type ApiFieldError = {
  field?: string;
  message: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: ApiFieldError[];
};

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown> | null;
  token?: string | null;
  auth?: boolean;
  fallbackError?: string;
};

const ENV_API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const API_BASE = (ENV_API_BASE || "/api").replace(/\/+$/, "");
const NETWORK_ERROR_MESSAGE =
  `Cannot reach server at ${API_BASE}. Ensure backend is running. For local dev, run backend on port 8000 and restart frontend dev server.`;

export class ApiClientError extends Error {
  status: number;
  details?: ApiFieldError[];

  constructor(message: string, status: number, details?: ApiFieldError[]) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

function isRawBody(value: unknown): value is BodyInit {
  return (
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof Blob ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value) ||
    typeof value === "string"
  );
}

function parseErrorMessage(payload: unknown, fallback: string): { message: string; details?: ApiFieldError[] } {
  if (!payload || typeof payload !== "object") {
    return { message: fallback };
  }

  const maybeEnvelope = payload as Partial<ApiEnvelope<unknown>>;
  if (typeof maybeEnvelope.message === "string") {
    return {
      message: maybeEnvelope.message,
      details: Array.isArray(maybeEnvelope.errors) ? maybeEnvelope.errors : undefined,
    };
  }

  const detailValue = (payload as { detail?: unknown }).detail;
  if (typeof detailValue === "string") {
    return { message: detailValue };
  }

  if (Array.isArray(detailValue) && detailValue[0] && typeof detailValue[0] === "object") {
    const first = detailValue[0] as { msg?: string };
    if (typeof first.msg === "string") return { message: first.msg };
  }

  return { message: fallback };
}

export async function httpRequest<T>(
  path: string,
  { token = null, auth = true, fallbackError = "Request failed", headers, body, ...rest }: RequestOptions = {}
): Promise<T> {
  if (auth && !token) {
    throw new ApiClientError("You are not signed in", 401);
  }

  const requestHeaders = new Headers(headers);
  if (auth && token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  let payload: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (isRawBody(body)) {
      payload = body;
    } else {
      requestHeaders.set("Content-Type", "application/json");
      payload = JSON.stringify(body);
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: requestHeaders,
      ...(payload !== undefined ? { body: payload } : {}),
    });
  } catch {
    throw new ApiClientError(NETWORK_ERROR_MESSAGE, 0);
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payloadBody = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const parsed = parseErrorMessage(payloadBody, fallbackError);
    throw new ApiClientError(parsed.message, response.status, parsed.details);
  }

  if (!payloadBody || typeof payloadBody !== "object") {
    return undefined as T;
  }

  const envelope = payloadBody as Partial<ApiEnvelope<T>>;
  if ("data" in envelope) {
    return envelope.data as T;
  }

  return payloadBody as T;
}

export function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}
