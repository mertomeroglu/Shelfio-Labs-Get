import type { ServerResponse } from "node:http";
import { signValue, verifySignature } from "./securityService.js";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
  tenant: {
    id: string;
    name: string;
    storeCount: number;
  };
};

export type SessionPayload = {
  exp: number;
  user: SessionUser;
};

export const sessionCookieName = process.env.COOKIE_NAME || "shelfio_service_session";

const oneDayInSeconds = 60 * 60 * 24;
const allowedSameSiteValues = new Set(["Strict", "Lax", "None"]);

export function encodeSession(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${signValue(body)}`;
}

export function decodeSession(value?: string): SessionPayload | null {
  if (!value) return null;
  const [body, signature] = value.split(".");
  if (!body || !signature || !verifySignature(body, signature)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.user?.role || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function setSessionCookie(response: ServerResponse, user: SessionUser) {
  const maxAge = Number(process.env.SESSION_TTL_SECONDS || oneDayInSeconds);
  const expiresAt = Math.floor(Date.now() / 1000) + maxAge;
  const sameSite = getCookieSameSite();
  const cookie = [
    `${sessionCookieName}=${encodeURIComponent(encodeSession({ exp: expiresAt, user }))}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "HttpOnly",
    `SameSite=${sameSite}`,
  ];

  if (shouldUseSecureCookie(response)) {
    cookie.push("Secure");
  }
  response.setHeader("Set-Cookie", cookie.join("; "));
}

export function clearSessionCookie(response: ServerResponse) {
  const cookie = [`${sessionCookieName}=`, "Path=/", "Max-Age=0", "HttpOnly", `SameSite=${getCookieSameSite()}`];
  if (shouldUseSecureCookie(response)) cookie.push("Secure");
  response.setHeader("Set-Cookie", cookie.join("; "));
}

function getCookieSameSite() {
  const rawValue = process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === "production" ? "Strict" : "Lax");
  const normalized = rawValue.slice(0, 1).toUpperCase() + rawValue.slice(1).toLowerCase();
  return allowedSameSiteValues.has(normalized) ? normalized : "Lax";
}

function shouldUseSecureCookie(response: ServerResponse) {
  const request = (response as any).req;
  const host = request?.headers?.host || "";
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
  const configured = process.env.COOKIE_SECURE;
  const secureByDefault = process.env.NODE_ENV === "production";
  return (configured ? configured === "true" : secureByDefault) && !isLocal;
}
