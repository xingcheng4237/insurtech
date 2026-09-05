// Direct test of news collection
import { createRequire } from "module";
const require = createRequire(import.meta.url);

console.log("Starting direct news collection test...\n");

async function testCollection() {
  try {
    // Import the database functions
    const db = await import("./server/db.ts");

    console.log("✓ Database module loaded");

    // Check latest report
    const latest = await db.getLatestReport();
    console.log("\nLatest report in database:");
    console.log("- ID:", latest?.id || "None");
    console.log("- Date:", latest?.reportDate || "None");
    console.log("- Articles:", latest?.articleCount || 0);

    console.log("\n=== Test Complete ===");
  } catch (error) {
    console.error("Error:", error.message);
    console.error(error.stack);
  }
  process.exit(0);
}

testCollection();
