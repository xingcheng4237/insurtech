import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const REDIRECT_URI = `${BASE_URL}/api/auth/google/callback`;

// Whitelisted emails - only these can log in
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  id_token: string;
  email: string;
  name: string;
  sub: string;
}> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }

  const tokens = await tokenRes.json() as { access_token: string; id_token: string };

  // Get user info from Google
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    throw new Error("Failed to get user info from Google");
  }

  const userInfo = await userRes.json() as { email: string; name: string; id: string };

  return {
    access_token: tokens.access_token,
    id_token: tokens.id_token,
    email: userInfo.email,
    name: userInfo.name,
    sub: userInfo.id,
  };
}

export function registerGoogleAuthRoutes(app: Express) {
  // Initiate Google OAuth login
  app.get("/api/auth/google", (_req: Request, res: Response) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      res.status(500).json({ error: "Google OAuth not configured" });
      return;
    }
    const state = Math.random().toString(36).substring(2);
    const authUrl = getGoogleAuthUrl(state);
    res.redirect(302, authUrl);
  });

  // Google OAuth callback
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const error = req.query.error as string;

    if (error) {
      console.error("[GoogleAuth] OAuth error:", error);
      res.redirect(302, "/login?error=oauth_error");
      return;
    }

    if (!code) {
      res.redirect(302, "/login?error=no_code");
      return;
    }

    try {
      const userInfo = await exchangeCodeForTokens(code);
      const email = userInfo.email.toLowerCase();

      // Check if email is allowed
      if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(email)) {
        console.warn(`[GoogleAuth] Access denied for email: ${email}`);
        res.redirect(302, "/login?error=access_denied");
        return;
      }

      // Use Google sub (unique ID) as openId
      const openId = `google_${userInfo.sub}`;

      // Upsert user in database
      await db.upsertUser({
        openId,
        name: userInfo.name || null,
        email: userInfo.email,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      // Create session token
      const sessionToken = await sdk.createSessionToken(openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      
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
