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
  const sameSite = process.env.COOKIE_SAME_SITE || "Lax";
  const cookie = [
    `${sessionCookieName}=${encodeURIComponent(encodeSession({ exp: expiresAt, user }))}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "HttpOnly",
    `SameSite=${sameSite}`,
  ];

  // Auto-omit Secure attribute for local HTTP environments (localhost or 127.0.0.1)
  const request = (response as any).req;
  const host = request?.headers?.host || "";
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");

  if (process.env.COOKIE_SECURE === "true" && !isLocal) {
    cookie.push("Secure");
  }
  response.setHeader("Set-Cookie", cookie.join("; "));
}

export function clearSessionCookie(response: ServerResponse) {
  response.setHeader("Set-Cookie", `${sessionCookieName}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
}
