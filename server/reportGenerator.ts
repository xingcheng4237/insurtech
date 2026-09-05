/**
 * HTML Report Generator
 * Generates professional email-style reports for news digests
 */

interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedDate: string;
  snippet: string;
}

interface ReportData {
  articles: NewsItem[];
  aiAnalysis: string;
  categorizedNews: Record<string, NewsItem[]>;
  stats: {
    articleCount: number;
    categoryCount: number;
    regions: number;
  };
}

export function generateHTMLReport(data: ReportData): string {
  const { articles, aiAnalysis, categorizedNews, stats } = data;
  const reportDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Insurtech Daily Digest - ${reportDate}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #fafafa;
      padding: 0;
      line-height: 1.6;
    }
    .container {
      max-width: 100%;
      margin: 0;
      background: white;
    }
    .header {
      background: #000;
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      font-size: 32px;
      font-weight: 600;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .header p {
      font-size: 14px;
      opacity: 0.8;
      font-weight: 400;
    }
    .stats {
      background: #f5f5f7;
      padding: 30px 40px;
      display: table;
      width: 100%;
    }
    .stat-item {
      display: table-cell;
      text-align: center;
      vertical-align: middle;
      padding: 0 20px;
      border-right: 1px solid #d2d2d7;
    }
    .stat-item:last-child { border-right: none; }
    .stat-number {
      font-size: 44px;
      font-weight: 600;
      color: #1d1d1f;
      letter-spacing: -1px;
      display: block;
    }
    .stat-label {
      font-size: 12px;
      color: #86868b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
      display: block;
    }
    .content {
      padding: 40px;
    }
    .section {
      margin-bottom: 48px;
    }
    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: #1d1d1f;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #000;
      letter-spacing: -0.3px;
    }
    .analysis-box {
      background: #f5f5f7;
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 24px;
      color: #1d1d1f;
      line-height: 1.6;
    }
    .analysis-box h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 20px 0 12px 0;
      color: #000;
    }
    .analysis-box h3:first-child { margin-top: 0; }
    .analysis-box ul {
      margin-left: 20px;
      margin-top: 8px;
    }
    .analysis-box li {
      margin-bottom: 8px;
      color: #1d1d1f;
    }
    .news-item {
      padding: 20px 0;
      border-bottom: 1px solid #d2d2d7;
    }
    .news-item:last-child { border-bottom: none; }
    .news-title {
      font-size: 16px;
      font-weight: 500;
      color: #06c;
      text-decoration: none;
      display: block;
      margin-bottom: 8px;
      line-height: 1.4;
    }
    .news-title:hover {
      text-decoration: underline;
    }
    .news-meta {
      font-size: 13px;
      color: #86868b;
      margin-bottom: 4px;
    }
    .category-header {
      font-size: 18px;
      font-weight: 600;
      color: #06c;
      margin: 32px 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #d2d2d7;
    }
    .footer {
      background: #f5f5f7;
      padding: 24px 40px;
      text-align: center;
      font-size: 12px;
      color: #86868b;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>Insurtech Daily Digest</h1>
      <p>${reportDate}</p>
    </div>

    <!-- Statistics -->
    <div class="stats">
      <div class="stat-item">
        <span class="stat-number">${stats.articleCount}</span>
        <span class="stat-label">Articles</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">${stats.categoryCount}</span>
        <span class="stat-label">Categories</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">${stats.regions}</span>
        <span class="stat-label">Regions</span>
      </div>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- AI Analysis -->
      <div class="section">
        <div class="section-title">AI-Powered Analysis</div>
        <div class="analysis-box">
          ${formatAnalysis(aiAnalysis)}
        </div>
      </div>

      <!-- Latest News -->
      <div class="section">
        <div class="section-title">Latest News by Category</div>
        ${generateCategorizedNews(categorizedNews)}
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Insurtech News Tracker &bull; Powered by AI &bull; ${reportDate}</p>
    </div>
  </div>
</body>
</html>`;
}

function formatAnalysis(analysis: string): string {
  // Convert markdown-style formatting to HTML
  let formatted = analysis
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h3>$1</h3>")
    .replace(/^# (.+)$/gm, "<h3>$1</h3>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/(<li>[\s\S]*<\/li>)/, "<ul>$1</ul>");

  // Wrap in paragraphs if not already wrapped
  if (!formatted.startsWith("<")) {
    formatted = "<p>" + formatted + "</p>";
  }

  return formatted;
}

function generateCategorizedNews(
  categorizedNews: Record<string, NewsItem[]>
): string {
  let html = "";

  for (const [category, items] of Object.entries(categorizedNews)) {
    if (items.length === 0) continue;

    html += `<div class="category-header">${category}</div>`;

    for (const item of items) {
      html += `
        <div class="news-item">
          <a href="${item.url}" class="news-title" target="_blank">${item.title}</a>
          <div class="news-meta">${item.source} &bull; ${formatDate(item.publishedDate)}</div>
        </div>
      `;
    }
  }

  return html;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "Unknown date";

  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
