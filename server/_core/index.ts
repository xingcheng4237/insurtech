import "dotenv/config";
import express, { type Express } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerGoogleAuthRoutes } from "./googleAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { cronRouter } from "../routes/cron";
import { runMigrations } from "./migrate";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

/**
 * Builds the Express application without opening a port or performing database
 * migrations. This keeps route registration reusable for integration tests.
 */
export function createApp(): Express {
  const app = express();
  app.set("trust proxy", 1);

  if (process.env.NODE_ENV === "production") {
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            baseUri: ["'self'"],
            connectSrc: ["'self'", "https:"],
            fontSrc: ["'self'", "https:", "data:"],
            formAction: ["'self'"],
            frameAncestors: ["'none'"],
            imgSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:"],
          },
        },
        crossOriginEmbedderPolicy: false,
      })
    );
  }

  const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many sign-in attempts. Please try again later." },
  });
  const subscriptionRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error: "Too many subscription requests. Please try again later.",
    },
  });

  app.use("/api/auth", authRateLimit);
  app.use("/api/trpc/subscription.subscribe", subscriptionRateLimit);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // This application does not receive file uploads; keep public payloads bounded.
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));
  registerOAuthRoutes(app);
  registerGoogleAuthRoutes(app);
  app.use(cronRouter);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}

async function startServer() {
  await runMigrations();

  const app = createApp();
  const server = createServer(app);
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  const host = "0.0.0.0";
  server.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}/`);
  });
}

if (process.env.VITEST !== "true") {
  startServer().catch(console.error);
}
