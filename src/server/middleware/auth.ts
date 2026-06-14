import { randomBytes } from "node:crypto";
import type { MiddlewareHandler } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

const SESSION_COOKIE = "fc_session";

// Rotates on every server restart — never stored in source code
const SESSION_TOKEN = randomBytes(32).toString("hex");

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const session = getCookie(c, SESSION_COOKIE);
  if (session !== SESSION_TOKEN) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
};

// biome-ignore lint/suspicious/noExplicitAny: hono context passed from route handler
export function setSessionCookie(c: any) {
  setCookie(c, SESSION_COOKIE, SESSION_TOKEN, {
    httpOnly: true,
    sameSite: "Strict",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

// biome-ignore lint/suspicious/noExplicitAny: hono context passed from route handler
export function clearSessionCookie(c: any) {
  deleteCookie(c, SESSION_COOKIE);
}
