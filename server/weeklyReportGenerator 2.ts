import { getWeeklyPerformanceStats } from "./db";

interface WeeklyStats {
  totalCollections: number;
  successfulCollections: number;
  failedCollections: number;
  avgCollectionTime: number;
  avgArticleCount: number;
  emailSuccessRate: number;
  totalArticles: number;
}

export function generateWeeklyPerformanceHTML(
  stats: WeeklyStats,
  startDate: Date,
  endDate: Date
): string {
  const successRate = (
    (stats.successfulCollections / stats.totalCollections) *
    100
  ).toFixed(1);
  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-SG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Performance Review</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #4A90E2;
    }
    h1 {
      color: #2c3e50;
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .period {
      color: #7f8c8d;
      font-size: 14px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    .stat-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #4A90E2;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #2c3e50;
      margin: 10px 0;
    }
    .stat-label {
      color: #7f8c8d;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .success { border-left-color: #27ae60; }
    .warning { border-left-color: #f39c12; }
    .danger { border-left-color: #e74c3c; }
    .info { border-left-color: #3498db; }
    .summary {
      background: #ecf0f1;
      padding: 20px;
      border-radius: 8px;
      margin: 30px 0;
    }
    .summary h2 {
      margin-top: 0;
      color: #2c3e50;
      font-size: 20px;
    }
    .summary p {
      margin: 10px 0;
      line-height: 1.8;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ecf0f1;
      color: #95a5a6;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Weekly Performance Review</h1>
      <p class="period">Insurtech News Daily Digest</p>
      <p class="period">${formatDate(startDate)} - ${formatDate(endDate)}</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card success">
        <div class="stat-label">Total Collections</div>
        <div class="stat-value">${stats.totalCollections}</div>
      </div>

      <div class="stat-card ${stats.successfulCollections === stats.totalCollections ? "success" : "warning"}">
        <div class="stat-label">Success Rate</div>
        <div class="stat-value">${successRate}%</div>
      </div>

      <div class="stat-card info">
        <div class="stat-label">Avg Collection Time</div>
        <div class="stat-value">${stats.avgCollectionTime.toFixed(1)}s</div>
      </div>

      <div class="stat-card info">
        <div class="stat-label">Avg Articles/Day</div>
        <div class="stat-value">${Math.round(stats.avgArticleCount)}</div>
      </div>

      <div class="stat-card ${stats.emailSuccessRate === 100 ? "success" : "warning"}">
        <div class="stat-label">Email Success Rate</div>
        <div class="stat-value">${stats.emailSuccessRate.toFixed(1)}%</div>
      </div>

      <div class="stat-card success">
        <div class="stat-label">Total Articles</div>
        <div class="stat-value">${stats.totalArticles}</div>
      </div>
    </div>

    <div class="summary">
      <h2>📈 Performance Summary</h2>
      <p>
        <strong>Collection Performance:</strong> 
        ${stats.successfulCollections} out of ${stats.totalCollections} collections completed successfully 
        (${successRate}% success rate). 
        ${stats.failedCollections > 0 ? `⚠️ ${stats.failedCollections} collection(s) failed.` : "✅ All collections successful!"}
      </p>
      <p>
        <strong>Speed:</strong> 
        Average collection time was ${stats.avgCollectionTime.toFixed(1)} seconds, 
        ${stats.avgCollectionTime < 30 ? "✅ meeting performance targets." : "⚠️ slower than target (30s)."}
      </p>
      <p>
        <strong>Content Quality:</strong> 
        Collected an average of ${Math.round(stats.avgArticleCount)} articles per day, 
        totaling ${stats.totalArticles} articles this week.
        ${stats.avgArticleCount >= 5 && stats.avgArticleCount <= 15 ? "✅ Within optimal range (5-15 articles)." : ""}
      </p>
      <p>
        <strong>Email Delivery:</strong> 
        ${stats.emailSuccessRate === 100 ? "✅ All emails delivered successfully!" : `⚠️ ${stats.emailSuccessRate.toFixed(1)}% email delivery rate. Some emails may have failed.`}
      </p>
    </div>

    ${
      stats.failedCollections > 0 || stats.emailSuccessRate < 100
        ? `
    <div class="summary" style="background: #fff3cd; border-left: 4px solid #f39c12;">
      <h2>⚠️ Action Required</h2>
      <p>Some issues were detected this week:</p>
      <ul>
        ${stats.failedCollections > 0 ? `<li>${stats.failedCollections} collection(s) failed - check logs for details</li>` : ""}
        ${stats.emailSuccessRate < 100 ? `<li>Email delivery rate is ${stats.emailSuccessRate.toFixed(1)}% - verify SMTP configuration</li>` : ""}
      </ul>
    </div>
    `
        : ""
    }

    <div class="footer">
      <p>Insurtech News Tracker - Automated Weekly Performance Review</p>
      <p>Generated on ${new Date().toLocaleString("en-SG", { timeZone: "Asia/Singapore" })}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function generateWeeklyReport(): Promise<{
  html: string;
  stats: WeeklyStats;
}> {
  // Calculate date range for the past 7 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  // Get performance stats
  const stats = await getWeeklyPerformanceStats(startDate, endDate);

  // Generate HTML report
  const html = generateWeeklyPerformanceHTML(stats, startDate, endDate);

  return { html, stats };
}
