import { NextRequest, NextResponse } from "next/server";

type UserRole = "customer" | "admin";

type SessionPayload = {
  exp: number;
  user: {
    role: UserRole;
  };
};

const sessionCookieName = "shelfio_service_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = decodeSession(request.cookies.get(sessionCookieName)?.value);

  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/giris", request.url));
  }

  if (pathname.startsWith("/hesap")) {
    if (!session) return redirectToLogin(request);
    if (session.user.role !== "customer") return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (pathname === "/aktivasyon") {
    if (!session) return redirectToLogin(request, "/hesap/aktivasyon");
    return NextResponse.redirect(new URL("/hesap/aktivasyon", request.url));
  }

  if (pathname.startsWith("/odeme")) {
    if (!session) return redirectToLogin(request);
    if (session.user.role === "admin") return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (pathname.startsWith("/admin")) {
    if (!session) return redirectToLogin(request);
    if (session.user.role !== "admin") return NextResponse.redirect(new URL("/hesap", request.url));
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest, nextPath = request.nextUrl.pathname) {
  const url = new URL("/giris", request.url);
  url.searchParams.set("next", nextPath);
  return NextResponse.redirect(url);
}

function decodeSession(value?: string): SessionPayload | null {
  if (!value) return null;

  try {
    // 1. Strip surrounding quotes and URL decode
    let cleaned = decodeURIComponent(value);
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }

    // 2. Extract payload part
    const [payloadPart] = cleaned.split(".");
    if (!payloadPart) return null;

    // 3. Normalize base64url and add padding
    let normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const pad = normalized.length % 4;
    if (pad === 2) {
      normalized += "==";
    } else if (pad === 3) {
      normalized += "=";
    }

    // 4. Decode base64
    const jsonStr = atob(normalized);
    const payload = JSON.parse(jsonStr) as SessionPayload;
    if (!payload.user?.role || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (err) {
    console.error("decodeSession error in proxy:", err);
    return null;
  }
}

export const config = {
  matcher: ["/login", "/aktivasyon", "/odeme/:path*", "/hesap/:path*", "/admin/:path*"],
};
