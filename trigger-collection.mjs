import fetch from "node-fetch";

console.log("Triggering news collection...");
const startTime = Date.now();

try {
  const response = await fetch("http://localhost:3000/api/trpc/news.collect", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ json: null }),
  });

  const data = await response.json();
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n=== Collection Complete ===");
  console.log("Duration:", duration, "seconds");
  console.log("Response:", JSON.stringify(data, null, 2));
} catch (error) {
  console.error("Error:", error.message);
}
