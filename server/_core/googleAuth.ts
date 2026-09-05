import crypto from "node:crypto";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { CookieOptions, Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const REDIRECT_URI = `${BASE_URL}/api/auth/google/callback`;
const OAUTH_STATE_COOKIE = "google_oauth_state";
const OAUTH_VERIFIER_COOKIE = "google_oauth_verifier";
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

// Whitelisted emails - only these can log in
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

function getGoogleAuthUrl(state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function getCookie(req: Request, name: string): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;

  const cookie = cookieHeader
    .split(";")
    .map(value => value.trim())
    .find(value => value.startsWith(`${name}=`));

  if (!cookie) return undefined;

  try {
    return decodeURIComponent(cookie.slice(name.length + 1));
  } catch {
    return undefined;
  }
}

function safeEqual(
  left: string | undefined,
  right: string | undefined
): boolean {
  if (!left || !right) return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function getOAuthCookieOptions(req: Request): CookieOptions {
  return {
    ...getSessionCookieOptions(req),
    path: "/api/auth/google/callback",
    sameSite: "lax",
    maxAge: OAUTH_STATE_TTL_MS,
  };
}

async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<{
  access_token: string;
  id_token: string;
  email: string;
  name: string;
  sub: string;
  verifiedEmail: boolean;
}> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(
      `Google token exchange failed with status ${tokenRes.status}`
    );
  }

  const tokens = (await tokenRes.json()) as {
    access_token: string;
    id_token: string;
  };
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    throw new Error("Failed to get user info from Google");
  }

  const userInfo = (await userRes.json()) as {
    email: string;
    name: string;
    id: string;
    verified_email?: boolean;
  };

  return {
    access_token: tokens.access_token,
    id_token: tokens.id_token,
    email: userInfo.email,
    name: userInfo.name,
    sub: userInfo.id,
    verifiedEmail: userInfo.verified_email === true,
  };
}

export function registerGoogleAuthRoutes(app: Express) {
  // Initiate Google OAuth login with short-lived state and PKCE verifier cookies.
  app.get("/api/auth/google", (req: Request, res: Response) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      res.status(500).json({ error: "Google OAuth not configured" });
      return;
    }

    const state = crypto.randomBytes(32).toString("base64url");
    const codeVerifier = crypto.randomBytes(64).toString("base64url");
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");
    const cookieOptions = getOAuthCookieOptions(req);

    res.cookie(OAUTH_STATE_COOKIE, state, cookieOptions);
    res.cookie(OAUTH_VERIFIER_COOKIE, codeVerifier, cookieOptions);
    res.redirect(302, getGoogleAuthUrl(state, codeChallenge));
  });

  // Google OAuth callback
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code =
      typeof req.query.code === "string" ? req.query.code : undefined;
    const returnedState =
      typeof req.query.state === "string" ? req.query.state : undefined;
    const error =
      typeof req.query.error === "string" ? req.query.error : undefined;
    const cookieOptions = getOAuthCookieOptions(req);
    const { maxAge: _maxAge, ...clearOAuthCookieOptions } = cookieOptions;

    if (error) {
      res.clearCookie(OAUTH_STATE_COOKIE, clearOAuthCookieOptions);
      res.clearCookie(OAUTH_VERIFIER_COOKIE, clearOAuthCookieOptions);
      console.error("[GoogleAuth] OAuth error:", error);
      res.redirect(302, "/login?error=oauth_error");
      return;
    }

    const expectedState = getCookie(req, OAUTH_STATE_COOKIE);
    const codeVerifier = getCookie(req, OAUTH_VERIFIER_COOKIE);
    if (!code || !safeEqual(returnedState, expectedState) || !codeVerifier) {
      res.clearCookie(OAUTH_STATE_COOKIE, clearOAuthCookieOptions);
      res.clearCookie(OAUTH_VERIFIER_COOKIE, clearOAuthCookieOptions);
      res.redirect(302, "/login?error=invalid_oauth_state");
      return;
    }

    // Make state and verifier single-use before exchanging the authorization code.
    res.clearCookie(OAUTH_STATE_COOKIE, clearOAuthCookieOptions);
    res.clearCookie(OAUTH_VERIFIER_COOKIE, clearOAuthCookieOptions);

    try {
      const userInfo = await exchangeCodeForTokens(code, codeVerifier);
      const email = userInfo.email.toLowerCase();

      if (!userInfo.verifiedEmail) {
        console.warn(
          `[GoogleAuth] Unverified email rejected for Google account: ${email}`
        );
        res.redirect(302, "/login?error=unverified_email");
        return;
      }

      if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(email)) {
        console.warn(`[GoogleAuth] Access denied for email: ${email}`);
        res.redirect(302, "/login?error=access_denied");
        return;
      }

      const openId = `google_${userInfo.sub}`;
      await db.upsertUser({
        openId,
        name: userInfo.name || null,
        email: userInfo.email,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });
      const sessionCookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...sessionCookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      console.log(`[GoogleAuth] User logged in: ${email}`);
      res.redirect(302, "/");
    } catch (err) {
      console.error("[GoogleAuth] Callback failed:", err);
      res.redirect(302, "/login?error=auth_failed");
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions });
    res.json({ success: true });
  });
}
