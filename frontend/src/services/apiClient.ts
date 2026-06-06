export type ApiErrorBody = {
  code?: string;
  message?: string;
  mode?: "production" | "control-db";
  success?: boolean;
};

type ApiEnvelope<T> = {
  code?: string;
  data: T;
  message: string;
  mode: "production" | "control-db";
  success: boolean;
};

export class ApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

const publicApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

function getApiBaseUrl() {
  if (typeof window === "undefined") {
    return process.env.API_INTERNAL_BASE_URL?.replace(/\/+$/, "") ?? publicApiBaseUrl;
  }

  return publicApiBaseUrl;
}

export function isApiConfigured() {
  return Boolean(getApiBaseUrl());
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    throw new ApiRequestError("Servis adresi yapılandırılmamış.", 0);
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiRequestError("Servise şu anda ulaşılamadı.", 0);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new ApiRequestError(body.message ?? "API isteği tamamlanamadı.", response.status);
  }

  const body = (await response.json()) as T | ApiEnvelope<T>;

  if (isApiEnvelope<T>(body)) {
    if (!body.success) {
      throw new ApiRequestError(body.message, response.status);
    }

    return body.data;
  }

  return body;
}

function isApiEnvelope<T>(body: T | ApiEnvelope<T>): body is ApiEnvelope<T> {
  return (
    typeof body === "object" &&
    body !== null &&
    "success" in body &&
    "mode" in body &&
    "data" in body
  );
}
