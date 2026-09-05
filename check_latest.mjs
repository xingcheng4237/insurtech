import { drizzle } from "drizzle-orm/mysql2";
import { desc } from "drizzle-orm";
import { collectionLogs, reports } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

// Get latest collection log
const latestLog = await db
  .select()
  .from(collectionLogs)
  .orderBy(desc(collectionLogs.collectionTime))
  .limit(1);

console.log("\n=== Latest Collection Log ===");
if (latestLog.length > 0) {
  const log = latestLog[0];
  console.log("Collection Time:", log.collectionTime);
  console.log("Article Count:", log.articleCount);
  console.log("Collection Duration:", log.collectionDuration, "seconds");
  console.log("Success:", log.success);
  console.log("Email Sent:", log.emailSent);
} else {
  console.log("No collection logs found");
}

// Get latest report
const latestReport = await db
  .select()
  .from(reports)
  .orderBy(desc(reports.collectionTime))
  .limit(1);

console.log("\n=== Latest Report ===");
if (latestReport.length > 0) {
  const report = latestReport[0];
  console.log("Report ID:", report.id);
  console.log("Collection Time:", report.collectionTime);
  console.log("Article Count:", report.articleCount);
  console.log("Categories:", report.categories);
} else {
  console.log("No reports found");
}

process.exit(0);
