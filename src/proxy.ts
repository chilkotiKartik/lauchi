import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv } from "@/lib/env";
import { cookieOptions } from "@/lib/supabase/server";

const PUBLIC = ["/", "/login", "/about", "/privacy", "/terms", "/cookies", "/security", "/offline"];
// /api/push, /api/report and /api/cron answer for themselves (401 / secret header) instead of redirecting to the login page.
const isPublic = (p: string) => PUBLIC.includes(p) || p.startsWith("/auth/") || p.startsWith("/api/push/") || p === "/api/check" || p === "/api/report" || p.startsWith("/api/cron/");

function csp(nonce: string) {
  const dev = process.env.NODE_ENV === "development";
  const supa = getPublicEnv()?.NEXT_PUBLIC_SUPABASE_URL ?? "https://*.supabase.co";
  if (dev) {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob: ${supa} https://lh3.googleusercontent.com https://i.ytimg.com`,
      `frame-src https://www.youtube-nocookie.com ${supa}`,
      "media-src 'self' blob:",
      "font-src 'self' data:",
      `connect-src 'self' ${supa} ws: wss:`,
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; ");
  }
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${supa} https://lh3.googleusercontent.com https://i.ytimg.com`,
    `frame-src https://www.youtube-nocookie.com ${supa}`,
    "media-src 'self' blob:",
    "font-src 'self'",
    `connect-src 'self' ${supa}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const policy = csp(nonce);
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", policy);

  let response = NextResponse.next({ request: { headers } });
  const path = request.nextUrl.pathname;
  const isPub = isPublic(path);

  // Fast-path: Check if any Supabase auth cookies exist before making network calls
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));

  let signedIn = false;
  const env = getPublicEnv();

  if (hasAuthCookie && env) {
    const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      cookieOptions,
      cookies: {
        getAll: () => allCookies,
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers } });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, { ...options, ...cookieOptions }));
        },
      },
    });
    try {
      const { data } = await supabase.auth.getUser();
      signedIn = Boolean(data?.user?.id);
    } catch {
      signedIn = false;
    }
  }

  if (!signedIn && !isPub) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path)}`;
    const redirect = NextResponse.redirect(url);
    redirect.headers.set("Content-Security-Policy", policy);
    return redirect;
  }
  if (signedIn && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    url.search = "";
    return NextResponse.redirect(url);
  }

  response.headers.set("Content-Security-Policy", policy);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: [{ source: "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|icons/|sw.js|manifest.webmanifest).*)", missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }] }],
};
