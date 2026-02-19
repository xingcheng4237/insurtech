/**
 * News Collection Service
 * Ported from Python news_collector_phase2.py
 * Features: Parallel processing, Direct RSS feeds, Caching, AI filtering, Smart deduplication
 * Enhanced with rate limiting, delays, and retry logic
 */

import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { invokeLLM } from './_core/llm';

interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedDate: string;
  snippet: string;
  category?: string;
  region?: string;
}

interface CollectionResult {
  articles: NewsItem[];
  collectionTime: number;
  stats: {
    collected: number;
    afterDedup: number;
    afterAIFilter: number;
  };
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to process promises with concurrency limit
async function promiseAllWithLimit<T>(
  promises: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const promiseFn of promises) {
    const promise = promiseFn().then(result => {
      results.push(result);
    });

    executing.push(promise);

    if (executing.length >= limit) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex(p => p === promise),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}

// Random User-Agent rotation to avoid bot detection
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export class NewsCollector {
  private directFeeds = [
    // Asian Insurance News (VERIFIED WORKING)
    'https://insuranceasia.com/rss.xml',
    'https://www.insurancebusinessmag.com/asia/rss',
    
    // Fintech & Insurtech News Asia (VERIFIED WORKING)
    'https://fintechnews.hk/feed/',
    'https://fintechnews.sg/feed',
    
    // Global Insurtech (VERIFIED WORKING)
    'https://www.insurtechinsights.com/feed',
    'https://www.the-digital-insurer.com/feed',
    'https://www.reinsurancene.ws/feed/',
    
    // Note: Removed broken feeds:
    // - https://www.dig-in.com/rss/topic/insurance (403 Forbidden)
    // - https://www.insurancetimes.co.uk/feed (Invalid XML)
  ];

  private searchQueries = [
    'insurtech Asia Pacific',
    'life insurance Asia Pacific',
    'health insurance digital Asia',
    'insurtech funding Asia',
    'insurance AI Asia',
  ];

  private regions = ['SG', 'IN', 'AU', 'JP', 'HK', 'MY'];

  async collectNews(): Promise<CollectionResult> {
    const startTime = Date.now();
    console.log('🚀 Starting news collection...');

    // Create promise functions for Google News searches with delays
    const googleNewsPromises = this.searchQueries.flatMap(query =>
      this.regions.map((region, index) => async () => {
        // Add delay between requests (4-7 seconds randomized)
        const delayMs = 4000 + Math.random() * 3000;
        await delay(delayMs);
        return this.searchGoogleNews(query, region);
      })
    );

    // Process Google News searches with concurrency limit of 3
    console.log(`📡 Fetching Google News (${googleNewsPromises.length} queries with rate limiting)...`);
    const googleResults = await promiseAllWithLimit(googleNewsPromises, 3);
    const googleArticles = googleResults.flat();
    console.log(`✅ Google News: ${googleArticles.length} articles collected`);

    // Direct RSS feeds with delays
    console.log(`📡 Fetching RSS feeds (${this.directFeeds.length} feeds)...`);
    const rssPromises = this.directFeeds.map((feed, index) => async () => {
      // Add delay between RSS requests (2-3 seconds)
      await delay(2000 + Math.random() * 1000);
      return this.fetchRSSFeed(feed);
    });
    
    const rssResults = await promiseAllWithLimit(rssPromises, 4);
    const rssArticles = rssResults.flat();
    console.log(`✅ RSS Feeds: ${rssArticles.length} articles collected`);

    // Combine and deduplicate
    const allArticles = [...googleArticles, ...rssArticles];
    const dedupedArticles = this.deduplicateArticles(allArticles);
    console.log(`✅ After deduplication: ${dedupedArticles.length} articles`);

    // AI filtering for relevance
    const filteredArticles = await this.aiFilterRelevance(dedupedArticles);
    console.log(`✅ After AI filtering: ${filteredArticles.length} articles`);

    const collectionTime = (Date.now() - startTime) / 1000;

    return {
      articles: filteredArticles,
      collectionTime,
      stats: {
        collected: allArticles.length,
        afterDedup: dedupedArticles.length,
        afterAIFilter: filteredArticles.length,
      },
    };
  }

  private async searchGoogleNews(query: string, region: string, retries = 3): Promise<NewsItem[]> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const url = 'https://news.google.com/rss/search';
        const response = await axios.get(url, {
          params: {
            q: query,
            hl: 'en',
            gl: region,
            ceid: `${region}:en`,
          },
          timeout: 15000,
          headers: {
            'User-Agent': getRandomUserAgent(),
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
          },
        });

        const parsed = await parseStringPromise(response.data);
        const items = parsed?.rss?.channel?.[0]?.item || [];

        const articles: NewsItem[] = [];
        for (const item of items.slice(0, 10)) {
          const pubDate = item.pubDate?.[0] || '';
          
          // Filter to last 48 hours (relaxed from 24h)
          if (pubDate) {
            const pubDateTime = new Date(pubDate);
            const hoursSince = (Date.now() - pubDateTime.getTime()) / (1000 * 60 * 60);
            if (hoursSince > 48) continue;
          }

          articles.push({
            title: item.title?.[0] || 'No title',
            url: item.link?.[0] || '',
            source: item.source?.[0]?._ || 'Google News',
            publishedDate: pubDate,
            snippet: item.description?.[0] || '',
            region,
          });
        }

        return articles;
      } catch (error: any) {
        const isRateLimit = error?.response?.status === 429;
        const isTimeout = error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT';
        
        if (attempt < retries && (isRateLimit || isTimeout)) {
          // Exponential backoff: 5s, 10s, 20s
          const backoffMs = Math.pow(2, attempt) * 2500;
          console.warn(`⚠️  Rate limit/timeout for ${query} in ${region}, retrying in ${backoffMs/1000}s (attempt ${attempt}/${retries})`);
          await delay(backoffMs);
          continue;
        }
        
        console.error(`❌ Error fetching Google News for ${query} in ${region}:`, error?.message || error);
        return [];
      }
    }
    
    return [];
  }

  private async fetchRSSFeed(feedUrl: string, retries = 2): Promise<NewsItem[]> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await axios.get(feedUrl, {
          timeout: 15000,
          headers: {
            'User-Agent': getRandomUserAgent(),
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          },
        });
        
        const parsed = await parseStringPromise(response.data);
        const items = parsed?.rss?.channel?.[0]?.item || [];

        const articles: NewsItem[] = [];
        for (const item of items.slice(0, 15)) {
          const pubDate = item.pubDate?.[0] || '';
          
          // Filter to last 48 hours
          if (pubDate) {
            const pubDateTime = new Date(pubDate);
            const hoursSince = (Date.now() - pubDateTime.getTime()) / (1000 * 60 * 60);
            if (hoursSince > 48) continue;
          }

          const title = item.title?.[0] || '';
          const titleLower = title.toLowerCase();

          // Filter by insurtech keywords
          const keywords = ['insurtech', 'insurance', 'digital', 'embedded', 'underwriting', 
                           'life insurance', 'health insurance', 'ai', 'artificial intelligence', 
                           'fintech', 'regtech'];
          
          if (keywords.some(kw => titleLower.includes(kw))) {
            articles.push({
              title,
              url: item.link?.[0] || '',
              source: feedUrl.split('/')[2] || 'RSS Feed',
              publishedDate: pubDate,
              snippet: item.description?.[0] || '',
            });
          }
        }

        return articles;
      } catch (error: any) {
        if (attempt < retries) {
          const backoffMs = 3000 * attempt;
          console.warn(`⚠️  Error fetching RSS ${feedUrl}, retrying in ${backoffMs/1000}s (attempt ${attempt}/${retries})`);
          await delay(backoffMs);
          continue;
        }
        
        console.error(`❌ Error fetching RSS feed ${feedUrl}:`, error?.message || error);
        return [];
      }
    }
    
    return [];
  }

  private deduplicateArticles(articles: NewsItem[]): NewsItem[] {
    const seen = new Set<string>();
    const unique: NewsItem[] = [];

    for (const article of articles) {
      const key = article.url.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(article);
      }
    }

    return unique;
  }

  private async aiFilterRelevance(articles: NewsItem[]): Promise<NewsItem[]> {
    if (articles.length === 0) return [];
    if (articles.length <= 10) return articles; // No filtering needed for small sets

    try {
      const articlesText = articles.map((a, i) => 
        `${i + 1}. ${a.title}\n   Source: ${a.source}\n   Snippet: ${a.snippet.substring(0, 200)}`
      ).join('\n\n');

      const prompt = `You are an insurtech industry analyst. Review these ${articles.length} news articles and select the 10-15 most relevant ones for a Chief Product Officer at a Singapore-based insurtech company.

Focus on:
- Life and healthcare insurance
- Digital insurance platforms
- Embedded insurance
- AI/ML in underwriting
- Regulatory changes in Asia-Pacific
- Funding and M&A activities

Articles:
${articlesText}

Return ONLY a JSON array of article numbers (1-${articles.length}) for the most relevant articles, like: [1, 3, 5, 7, ...]`;

      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are a helpful assistant that returns JSON.' },
          { role: 'user', content: prompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'relevant_articles',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                article_numbers: {
                  type: 'array',
                  items: { type: 'number' },
                  description: 'Array of article numbers to keep',
                },
              },
              required: ['article_numbers'],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0]?.message?.content;
      if (content && typeof content === 'string') {
        const parsed = JSON.parse(content);
        const selectedNumbers = parsed.article_numbers as number[];
        return selectedNumbers.map(num => articles[num - 1]).filter(Boolean);
      }
    } catch (error) {
      console.error('AI filtering error:', error);
    }

    // Fallback: return first 15 articles
    return articles.slice(0, 15);
  }

  async generateAIAnalysis(articles: NewsItem[]): Promise<string> {
    if (articles.length === 0) {
      return 'No articles to analyze.';
    }

    const articlesText = articles.map((a, i) => 
      `${i + 1}. ${a.title}\n   Source: ${a.source}\n   Published: ${a.publishedDate}\n   ${a.snippet.substring(0, 300)}`
    ).join('\n\n');

    const prompt = `You are an insurtech industry analyst. Analyze these ${articles.length} news articles and provide:

1. **Executive Summary** (3-4 key highlights)
2. **Key Developments** (5-7 bullet points)
3. **Strategic Insights** (3-4 actionable insights for a CPO at a Singapore insurtech)
4. **Geographic Highlights** (trends by region)

Focus on: Life/Healthcare insurance, Digital platforms, Embedded insurance, AI/ML, Regulatory changes, Funding/M&A.

Articles:
${articlesText}

Provide a comprehensive analysis in markdown format.`;

    try {
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are an insurtech industry analyst providing strategic insights.' },
          { role: 'user', content: prompt },
        ],
      });

      const content = response.choices[0]?.message?.content;
      return typeof content === 'string' ? content : 'Analysis unavailable.';
    } catch (error: any) {
      console.error('❌ AI analysis error:', error?.message || error);
      console.error('   Error details:', JSON.stringify(error, null, 2));
      if (error?.response) {
        console.error('   API Response:', error.response);
      }
      return `Analysis unavailable due to an error: ${error?.message || 'Unknown error'}`;
    }
  }

  categorizeArticles(articles: NewsItem[]): Record<string, NewsItem[]> {
    const categories: Record<string, NewsItem[]> = {
      'Life & Healthcare Insurance': [],
      'Digital Platforms & Embedded Insurance': [],
      'AI/ML & Technology': [],
      'Regulatory & Compliance': [],
      'Funding & M&A': [],
      'Other': [],
    };

    for (const article of articles) {
      const titleLower = article.title.toLowerCase() + ' ' + article.snippet.toLowerCase();
      
      if (titleLower.includes('life insurance') || titleLower.includes('health insurance') || titleLower.includes('healthcare')) {
        categories['Life & Healthcare Insurance'].push(article);
      } else if (titleLower.includes('digital') || titleLower.includes('embedded') || titleLower.includes('platform')) {
        categories['Digital Platforms & Embedded Insurance'].push(article);
      } else if (titleLower.includes('ai') || titleLower.includes('artificial intelligence') || titleLower.includes('machine learning') || titleLower.includes('ml')) {
        categories['AI/ML & Technology'].push(article);
      } else if (titleLower.includes('regulat') || titleLower.includes('compliance') || titleLower.includes('policy')) {
        categories['Regulatory & Compliance'].push(article);
      } else if (titleLower.includes('funding') || titleLower.includes('m&a') || titleLower.includes('acquisition') || titleLower.includes('investment')) {
        categories['Funding & M&A'].push(article);
      } else {
        categories['Other'].push(article);
      }
    }

    // Remove empty categories
    Object.keys(categories).forEach(key => {
      if (categories[key].length === 0) {
        delete categories[key];
      }
    });

    return categories;
  }
}
