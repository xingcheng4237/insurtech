# Insurtech News Tracker - Deployment Guide

## 🌐 Live Website

Your insurtech news tracker is now live at:
**https://3000-ir5oynqa6i83aykh6yi0b-f7f87a53.manus-asia.computer/**

## 📋 Features

### Web Application
- **Home Page**: Overview and navigation
- **Latest Report**: View the most recent daily digest
- **Report History**: Browse all past reports
- **Manual Collection**: Trigger news collection on-demand via UI

### Automated Daily Collection
- **Schedule**: Every day at 9:00 AM SGT (1:00 AM UTC)
- **Email Delivery**: Sends to xingcheng4237@gmail.com
- **Coverage**: 11 Asia-Pacific regions, 99+ search queries, 7 RSS feeds
- **AI Analysis**: GPT-4 powered insights and categorization

## 🚀 How It Works

### News Collection Process
1. **Parallel Collection**: Searches Google News (99 queries × 11 regions) + 7 RSS feeds
2. **Deduplication**: Removes duplicate articles by URL
3. **AI Filtering**: GPT-4 selects 10-15 most relevant articles
4. **AI Analysis**: Generates executive summary and strategic insights
5. **Categorization**: Organizes by topic (Life/Healthcare, Digital, AI/ML, Regulatory, Funding)
6. **Storage**: Saves to database for web viewing
7. **Email**: Sends professional HTML report

### Data Flow
```
Google News + RSS Feeds
    ↓
Parallel Collection (35-40s)
    ↓
Deduplication
    ↓
AI Relevance Filtering
    ↓
AI Analysis & Categorization
    ↓
HTML Report Generation
    ↓
Database Storage + Email Delivery
```

## 📊 Coverage

### Geographic Regions (11)
- Singapore (SG)
- India (IN)
- Australia (AU)
- Japan (JP)
- China (CN)
- Hong Kong (HK)
- Malaysia (MY)
- Indonesia (ID)
- Philippines (PH)
- Thailand (TH)
- Vietnam (VN)

### Focus Areas
1. Life & Healthcare Insurance
2. Digital Insurance Platforms
3. Embedded Insurance
4. AI/ML in Underwriting
5. Regulatory Changes
6. Funding & M&A Activities

### News Sources
- **Google News**: 99 search combinations
- **RSS Feeds**: 7 industry publications
  - Insurance Asia
  - Insurance Business Asia
  - Dig-In Insurance
  - InsurTech Insights
  - FinTech News Singapore
  - The Digital Insurer
  - Insurance Business Magazine

## 🔧 Manual Operations

### Trigger Collection Manually
1. Visit: https://3000-ir5oynqa6i83aykh6yi0b-f7f87a53.manus-asia.computer/latest
2. Click "Collect News" button
3. Wait 2-3 minutes for collection and analysis
4. Report will appear automatically

### Run Collection via Script
```bash
cd /home/ubuntu/insurtech-tracker-web
./scripts/daily-collection-with-email.sh
```

### View Logs
```bash
# Web application logs
cd /home/ubuntu/insurtech-tracker-web
pnpm dev

# Check scheduled task logs
# (Scheduled tasks run automatically via Manus platform)
```

## 📧 Email Configuration

Email delivery is configured with Gmail SMTP:
- **From**: xingcheng4237@gmail.com
- **To**: xingcheng4237@gmail.com
- **Credentials**: Stored in `/home/ubuntu/insurtech-news-tracker/.env`

## 🗄️ Database

The application uses MySQL/TiDB with two main tables:

### `articles`
Stores individual news articles with title, URL, source, snippet, category, region

### `reports`
Stores complete daily reports with HTML content, AI analysis, article count, categories

## 🔄 Scheduled Automation

A scheduled task runs daily at 9:00 AM SGT (1:00 AM UTC) to:
1. Collect latest news
2. Generate AI analysis
3. Create HTML report
4. Save to database
5. Send email to xingcheng4237@gmail.com

## 📱 Access Points

### Web Interface
- **Home**: https://3000-ir5oynqa6i83aykh6yi0b-f7f87a53.manus-asia.computer/
- **Latest Report**: https://3000-ir5oynqa6i83aykh6yi0b-f7f87a53.manus-asia.computer/latest
- **History**: https://3000-ir5oynqa6i83aykh6yi0b-f7f87a53.manus-asia.computer/history

### Email
- Daily digest delivered to xingcheng4237@gmail.com at 9:00 AM SGT

## 🛠️ Maintenance

### Update Search Queries
Edit `/home/ubuntu/insurtech-tracker-web/server/newsCollector.ts`:
```typescript
private searchQueries = [
  'your new query',
  // ...
];
```

### Add New RSS Feeds
Edit `/home/ubuntu/insurtech-tracker-web/server/newsCollector.ts`:
```typescript
private directFeeds = [
  'https://new-feed-url.com/rss',
  // ...
];
```

### Modify Email Template
Edit `/home/ubuntu/insurtech-tracker-web/server/reportGenerator.ts`

## 📈 Performance

- **Collection Time**: 2-3 minutes (fresh) / <1 second (cached)
- **Articles Collected**: 60-150 per day
- **After Filtering**: 10-15 most relevant articles
- **AI Cost**: ~$0.02 per run (~$0.60/month)
- **Storage**: Minimal (text-based reports)

## 🎯 Next Steps

1. **Publish Website**: Click "Publish" in the Management UI to make it publicly accessible
2. **Custom Domain**: Configure a custom domain in Settings → Domains
3. **Monitor Performance**: Check Dashboard for usage analytics
4. **Adjust Schedule**: Modify scheduled task if needed
5. **Add Features**: Implement additional features as needed

## 📞 Support

For issues or questions:
- Check logs in the web application
- Review database entries via Management UI → Database
- Test manual collection via UI
- Verify email credentials in `.env` file

---

**Deployed**: November 11, 2025  
**Version**: 5b0e4098  
**Status**: ✅ Active and Running
