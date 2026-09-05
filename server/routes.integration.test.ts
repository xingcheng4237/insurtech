import express, { type Express } from "express";
import { mkdtemp, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { serveStatic } from "./_core/vite";

let app: Express;
let spaApp: Express;
let staticDirectory: string;

beforeAll(async () => {
  process.env.VITEST = "true";
  process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
  process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret";
  process.env.BASE_URL = "https://tracker.test";
  process.env.ALLOWED_EMAILS = "admin@example.com";
  process.env.CRON_SECRET = "test-cron-secret";
  process.env.OAUTH_SERVER_URL = "https://oauth.test";
  process.env.OAUTH_CLIENT_ID = "test-oauth-client-id";
  process.env.OAUTH_CLIENT_SECRET = "test-oauth-client-secret";

  const { createApp } = await import("./_core/index");
  app = createApp();

  staticDirectory = await mkdtemp(path.join(os.tmpdir(), "insurtech-spa-"));
  await writeFile(
    path.join(staticDirectory, "index.html"),
    '<!doctype html><html><body><div id="root">Insurtech SPA</div></body></html>'
  );
  await writeFile(
    path.join(staticDirectory, "asset.txt"),
    "static asset served by integration test"
  );

  spaApp = express();
  serveStatic(spaApp, staticDirectory);
});

afterAll(async () => {
  await rm(staticDirectory, { recursive: true, force: true });
});

describe("public platform and SPA routes", () => {
  it("returns a healthy status response", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.body).toMatchObject({ status: "ok" });
    expect(new Date(response.body.timestamp).getTime()).not.toBeNaN();
  });

  it("serves static assets and falls unknown client routes back to the SPA", async () => {
    await request(spaApp)
      .get("/asset.txt")
      .expect(200)
      .expect("static asset served by integration test");

    const response = await request(spaApp).get("/latest").expect(200);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.text).toContain("Insurtech SPA");
  });

  it("does not expose the removed legacy subscriber administration route", async () => {
    await request(app).get("/admin/list-subscribers").expect(404);
  });
});

describe("Google SSO routes", () => {
  it("starts Google OAuth with PKCE and short-lived state cookies", async () => {
    const response = await request(app).get("/api/auth/google").expect(302);
    const location = new URL(response.headers.location);

    expect(location.origin).toBe("https://accounts.google.com");
    expect(location.pathname).toBe("/o/oauth2/v2/auth");
    expect(location.searchParams.get("client_id")).toBe(
      "test-google-client-id"
    );
    expect(location.searchParams.get("redirect_uri")).toBe(
      "https://tracker.test/api/auth/google/callback"
    );
    expect(location.searchParams.get("code_challenge_method")).toBe("S256");
    expect(location.searchParams.get("state")).toMatch(/^[A-Za-z0-9_-]{32,}$/);

    const cookies = response.headers["set-cookie"] ?? [];
    expect(cookies).toHaveLength(2);
    expect(cookies.join(";")).toContain("google_oauth_state=");
    expect(cookies.join(";")).toContain("google_oauth_verifier=");
    expect(cookies.join(";")).toContain("HttpOnly");
    expect(cookies.join(";")).toContain("SameSite=Lax");
    expect(cookies.join(";")).toContain("Path=/api/auth/google/callback");
  });

  it("rejects callbacks without a matching one-time OAuth state", async () => {
    const response = await request(app)
      .get("/api/auth/google/callback?code=test-code&state=wrong-state")
      .expect(302);

    expect(response.headers.location).toBe("/login?error=invalid_oauth_state");
    expect((response.headers["set-cookie"] ?? []).join(";")).toContain(
      "google_oauth_state="
    );
  });

  it("returns the login page with an OAuth error when Google denies consent", async () => {
    const response = await request(app)
      .get("/api/auth/google/callback?error=access_denied")
      .expect(302);

    expect(response.headers.location).toBe("/login?error=oauth_error");
  });
});

describe("protected application routes", () => {
  it("rejects unauthenticated report access", async () => {
    const response = await request(app)
      .get("/api/trpc/news.latest")
      .expect(401);

    expect(response.body.error.json.data.code).toBe("UNAUTHORIZED");
  });

  it("rejects unauthenticated scheduled collection requests", async () => {
    await request(app).post("/api/cron/daily-collection").expect(401, {
      error: "Unauthorized",
    });
  });

  it("exposes cron configuration health without leaking the cron secret", async () => {
    const response = await request(app).get("/api/cron/health").expect(200);

    expect(response.body).toMatchObject({
      status: "ok",
      cronSecret: "configured",
    });
    expect(JSON.stringify(response.body)).not.toContain("test-cron-secret");
  });
});
