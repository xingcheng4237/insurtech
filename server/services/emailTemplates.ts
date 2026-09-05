/**
 * Email Templates
 * Generate HTML email templates for news reports
 */

interface NewsArticle {
  title: string;
  url: string;
  source: string;
  publishedDate: string;
  snippet: string;
  category?: string;
  region?: string;
}

export function generateDailyNewsEmail(
  articles: NewsArticle[],
  aiAnalysis: string,
  categorizedArticles: Record<string, NewsArticle[]>
): string {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate week range (Mon-Fri)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 5=Fri
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const weekRange = `${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Insurtech News Weekly Digest - ${today}</title>
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
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #4A90E2;
    }
    h1 {
      color: #2c3e50;
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .date {
      color: #7f8c8d;
      font-size: 14px;
    }
    .summary {
      background: #f8f9fa;
      border-left: 4px solid #4A90E2;
      padding: 20px;
      margin: 30px 0;
      border-radius: 4px;
    }
    .summary h2 {
      margin-top: 0;
      color: #2c3e50;
      font-size: 20px;
    }
    .category {
      margin: 30px 0;
    }
    .category h3 {
      color: #2c3e50;
      font-size: 18px;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #ecf0f1;
    }
    .article {
      margin: 20px 0;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 6px;
      transition: background 0.2s;
    }
    .article:hover {
      background: #e9ecef;
    }
    .article-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 8px 0;
    }
    .article-title a {
      color: #2c3e50;
      text-decoration: none;
    }
    .article-title a:hover {
      color: #4A90E2;
    }
    .article-meta {
      font-size: 13px;
      color: #7f8c8d;
      margin: 5px 0;
    }
    .article-snippet {
      font-size: 14px;
      color: #555;
      margin: 10px 0 0 0;
      line-height: 1.5;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      background: #4A90E2;
      color: white;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
      margin-right: 5px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ecf0f1;
      color: #95a5a6;
      font-size: 12px;
    }
    .stats {
      background: #e3f2fd;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
      text-align: center;
    }
    .stats-item {
      display: inline-block;
      margin: 0 15px;
      font-size: 14px;
    }
    .stats-number {
      font-size: 24px;
      font-weight: bold;
      color: #4A90E2;
      display: block;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📰 Insurtech News Weekly Digest</h1>
      <p class="date">${today} &nbsp;·&nbsp; Week of ${weekRange}</p>
    </div>

    <div class="stats">
      <div class="stats-item">
        <span class="stats-number">${articles.length}</span>
        <span>Articles</span>
      </div>
      <div class="stats-item">
        <span class="stats-number">${Object.keys(categorizedArticles).length}</span>
        <span>Categories</span>
      </div>
      <div class="stats-item">
        <span class="stats-number">${articles.filter((a: any) => a.ahaRelevant).length}</span>
        <span>AHA-Relevant</span>
      </div>
      <div class="stats-item">
        <span class="stats-number">11</span>
        <span>Markets</span>
      </div>
    </div>

    ${
      aiAnalysis
        ? `
    <div class="summary">
      <h2>🤖 AI Analysis & Insights</h2>
      ${aiAnalysis
        .split("\n")
        .map(line => {
          if (line.startsWith("#")) {
            const level = line.match(/^#+/)?.[0].length || 1;
            const text = line.replace(/^#+\s*/, "");
            return `<h${level + 2}>${text}</h${level + 2}>`;
          }
          return `<p>${line}</p>`;
        })
        .join("")}
    </div>
    `
        : ""
    }

    ${Object.entries(categorizedArticles)
      .map(
        ([category, categoryArticles]) => `
      <div class="category">
        <h3>${category} <span class="badge">${categoryArticles.length}</span></h3>
        ${categoryArticles
          .map(
            article => `
          <div class="article">
            <div class="article-title">
              <a href="${article.url}" target="_blank">${article.title}</a>
            </div>
            <div class="article-meta">
              📍 ${article.source} ${article.region ? `• ${article.region}` : ""} • ${new Date(article.publishedDate).toLocaleDateString()}
            </div>
            ${
              article.snippet
                ? `
              <div class="article-snippet">${article.snippet.substring(0, 200)}${article.snippet.length > 200 ? "..." : ""}</div>
            `
                : ""
            }
          </div>
        `
          )
          .join("")}
      </div>
    `
      )
      .join("")}

    <div class="footer">
      <p><strong>Insurtech News Tracker</strong> - Weekly Intelligence for Insurance Leaders</p>
      <p>Powered by AI • Covering 11 Asia-Pacific Markets</p>
      <p style="margin-top: 15px;">
        <a href="#" style="color: #95a5a6; text-decoration: none;">Unsubscribe</a> | 
        <a href="#" style="color: #95a5a6; text-decoration: none;">Preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateTestEmail(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Configuration Test</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
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
    .success {
      background: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
      padding: 20px;
      border-radius: 6px;
      text-align: center;
    }
    h1 {
      margin: 0 0 10px 0;
      font-size: 24px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="success">
      <h1>✅ Email Configuration Successful!</h1>
      <p>Your SMTP settings are working correctly.</p>
      <p>You will now receive daily insurtech news digests at 9:00 AM SGT.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
