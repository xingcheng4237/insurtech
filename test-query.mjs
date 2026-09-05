import { drizzle } from "drizzle-orm/mysql2";
import { desc } from "drizzle-orm";
import { reports } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

const latest = await db
  .select()
  .from(reports)
  .orderBy(desc(reports.createdAt))
  .limit(1);

if (latest.length > 0) {
  const report = latest[0];
  console.log("=== LATEST REPORT ===");
  console.log("ID:", report.id);
  console.log("Created:", report.createdAt);
  console.log("Article Count:", report.articleCount);
  console.log("Collection Time:", report.collectionTime, "seconds");
  console.log("\n=== ANALYSIS (First 500 chars) ===");
  console.log(report.analysis.substring(0, 500) + "...");
} else {
  console.log("No reports found");
}

process.exit(0);
