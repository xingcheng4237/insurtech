import { Router } from "express";
import { jobQueue } from "../jobQueue";

export const cronRouter = Router();

function getBearerToken(
  authorizationHeader: string | undefined
): string | undefined {
  const [scheme, token] = authorizationHeader?.trim().split(/\s+/, 2) ?? [];
  return scheme?.toLowerCase() === "bearer" ? token : undefined;
}

cronRouter.post("/api/cron/daily-collection", async (req, res) => {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[CRON] CRON_SECRET is not configured");
    return res.status(500).json({ error: "Server configuration error" });
  }

  if (getBearerToken(req.headers.authorization) !== cronSecret) {
    console.warn("[CRON] Unauthorized collection request");
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const jobId = await jobQueue.addJob("news_collection", false);
    console.log(`[CRON] Enqueued production collection job: ${jobId}`);

    return res.status(202).json({
      success: true,
      jobId,
      status: "queued",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Unable to enqueue collection job", error);
    return res.status(500).json({
      error: "Unable to queue collection job",
      timestamp: new Date().toISOString(),
    });
  }
});

// Health check endpoint for cron monitoring. It deliberately does not expose secret values.
cronRouter.get("/api/cron/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    cronSecret: process.env.CRON_SECRET ? "configured" : "missing",
  });
});
