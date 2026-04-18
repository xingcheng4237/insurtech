import "dotenv/config";
import express from "express";
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

async function startServer() {
  // Run database migrations on startup
  await runMigrations();
  
  // Initialize scheduler for automated news collection
  const { scheduler } = await import('../scheduler');
  // Scheduler starts automatically based on SCHEDULE_ENABLED env var
  
  const app = express();
  const server = createServer(app);
  // Health check endpoint for Railway
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });
  
  // Admin endpoint to verify all unverified subscribers
  const verifyAllHandler = async (_req: any, res: any) => {
    try {
      const { getDb } = await import('../db');
      const { subscribers } = await import('../../drizzle/schema');
      const { eq, and } = await import('drizzle-orm');
      
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ success: false, message: 'Database not available' });
      }
      
      // Get all active but unverified subscribers
      const unverified = await db.select().from(subscribers)
        .where(
          and(
            eq(subscribers.active, true),
            eq(subscribers.verified, false)
          )
        );
      
      if (unverified.length === 0) {
        return res.json({ 
          success: true, 
          message: 'No unverified subscribers found',
          count: 0 
        });
      }
      
      // Verify all of them
      for (const sub of unverified) {
        await db.update(subscribers)
          .set({ 
            verified: true, 
            verifiedAt: new Date(),
            verificationToken: null 
          })
          .where(eq(subscribers.id, sub.id));
      }
      
      res.json({ 
        success: true, 
        message: `Successfully verified ${unverified.length} subscriber(s)`,
        count: unverified.length,
        emails: unverified.map(s => s.email)
      });
    } catch (error) {
      console.error('[Admin] Error verifying subscribers:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error verifying subscribers',
        error: String(error)
      });
    }
  };
  
  app.get("/admin/verify-all-subscribers", verifyAllHandler);
  app.post("/admin/verify-all-subscribers", verifyAllHandler);
  
  // Diagnostic endpoint to view all subscribers
  app.get("/admin/list-subscribers", async (_req, res) => {
    try {
      const { getDb } = await import('../db');
      const { subscribers } = await import('../../drizzle/schema');
      
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ success: false, message: 'Database not available' });
      }
      
      const allSubscribers = await db.select().from(subscribers);
      
      res.json({
        success: true,
        total: allSubscribers.length,
        subscribers: allSubscribers.map(s => ({
          email: s.email,
          name: s.name,
          active: s.active,
          verified: s.verified,
          subscribedAt: s.subscribedAt,
          verifiedAt: s.verifiedAt
        }))
      });
    } catch (error) {
      console.error('[Admin] Error listing subscribers:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error listing subscribers',
        error: String(error)
      });
    }
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Google OAuth routes
  registerGoogleAuthRoutes(app);
  // Cron endpoints for scheduled tasks
  app.use(cronRouter);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
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

  const host = '0.0.0.0';
  server.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}/`);
  });
}

startServer().catch(console.error);
// Force rebuild 1771430225
