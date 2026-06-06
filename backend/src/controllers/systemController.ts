import type { ApiBody } from "../types/http.js";

export function getHealth(): ApiBody {
  return {
    status: "ok",
    service: "shelfio-service-api",
  };
}

export function getPlaceholder(message: string): ApiBody {
  return {
    status: "not_implemented",
    message,
  };
}
