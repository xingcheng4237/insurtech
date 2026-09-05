/**
 * Manual News Collection Trigger
 * Run this to test the collection pipeline
 */

async function runCollection() {
  console.log("=== Manual News Collection Started ===");
  console.log("Time:", new Date().toISOString());

  try {
    const { NewsCollector } = await import("./server/newsCollector");
    const { generateHTMLReport } = await import("./server/reportGenerator");
    const { saveArticles, saveReport, createCollectionLog } = await import(
      "./server/db"
    );

    const startTime = new Date();
    const collector = new NewsCollector();

    console.log("\n📰 Step 1: Collecting news...");
    const result = await collector.collectNews();
    console.log(
      `✓ Collected ${result.articles.length} articles in ${result.collectionTime}s`
    );

    if (result.articles.length === 0) {
      console.log("❌ No articles collected. Exiting.");
      process.exit(1);
    }

    console.log("\n🤖 Step 2: Generating AI analysis...");
    const aiAnalysis = await collector.generateAIAnalysis(result.articles);
    console.log("✓ AI analysis complete");

    console.log("\n📊 Step 3: Categorizing articles...");
    const categorizedNews = collector.categorizeArticles(result.articles);
    console.log(`✓ ${Object.keys(categorizedNews).length} categories`);

    console.log("\n📄 Step 4: Generating HTML report...");
    const htmlContent = generateHTMLReport({
      articles: result.articles,
      aiAnalysis,
      categorizedNews,
      stats: {
        articleCount: result.articles.length,
        categoryCount: Object.keys(categorizedNews).length,
        regions: 11,
      },
    });
    console.log("✓ HTML report generated");

    console.log("\n💾 Step 5: Saving to database...");
    await saveArticles(
      result.articles.map(a => ({
        title: a.title,
        url: a.url,
        source: a.source,
        publishedDate: a.publishedDate,
        snippet: a.snippet,
        category: a.category,
        region: a.region,
      }))
    );

    const reportResult = await saveReport({
      reportDate: new Date(),
      htmlContent,
      aiAnalysis,
      articleCount: result.articles.length,
      categories: JSON.stringify(Object.keys(categorizedNews)),
      emailSent: 0,
    });
    console.log("✓ Report saved to database");

    const endTime = new Date();

    await createCollectionLog({
      reportId:
        reportResult && "insertId" in reportResult
          ? Number(reportResult.insertId)
          : null,
      startTime,
      endTime,
      collectionTime: result.collectionTime,
      articleCount: result.articles.length,
      emailSent: false,
      status: "success",
    });
    console.log("✓ Collection log created");

    console.log("\n=== Collection Complete ===");
    console.log("Articles:", result.articles.length);
    console.log(
      "Duration:",
      ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2),
      "seconds"
    );
    console.log(
      "View at: https://3000-iqk9ivytp0ejto7yfld64-ca1b18b7.manus-asia.computer/latest"
    );
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }

  process.exit(0);
}

runCollection();
