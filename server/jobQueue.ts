/**
 * Background Job Queue System
 * Handles long-running tasks without blocking HTTP requests
 */

interface Job {
  id: string;
  type: 'news_collection';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  testMode?: boolean; // If true, only send to test email
}

class JobQueue {
  private jobs: Map<string, Job> = new Map();
  private runningJobs: Set<string> = new Set();

  /**
   * Add a new job to the queue
   */
  async addJob(type: 'news_collection', testMode: boolean = false): Promise<string> {
    const jobId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: Job = {
      id: jobId,
      type,
      status: 'pending',
      testMode,
    };
    
    this.jobs.set(jobId, job);
    
    // Start processing immediately
    this.processJob(jobId);
    
    return jobId;
  }

  /**
   * Get job status
   */
  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs
   */
  getAllJobs(): Job[] {
    return Array.from(this.jobs.values()).sort((a, b) => {
      const aTime = a.startedAt || new Date(0);
      const bTime = b.startedAt || new Date(0);
      return bTime.getTime() - aTime.getTime();
    });
  }

  /**
   * Process a job in the background
   */
  private async processJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    // Prevent duplicate processing
    if (this.runningJobs.has(jobId)) return;
    this.runningJobs.add(jobId);

    job.status = 'running';
    job.startedAt = new Date();
    
    console.log(`[JobQueue] Starting job ${jobId} (${job.type})`);

    try {
      let result;
      
      if (job.type === 'news_collection') {
        result = await this.runNewsCollection(jobId);
      }
      
      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;
      
      console.log(`[JobQueue] Job ${jobId} completed successfully`);
      
    } catch (error: any) {
      job.status = 'failed';
      job.completedAt = new Date();
      job.error = error.message;
      
      console.error(`[JobQueue] Job ${jobId} failed:`, error);
    } finally {
      this.runningJobs.delete(jobId);
    }
  }

  /**
   * Run news collection
   */
  private async runNewsCollection(jobId: string): Promise<any> {
    const { NewsCollector } = await import('./newsCollector');
    const { generateHTMLReport } = await import('./reportGenerator');
    const { saveArticles, saveReport, createCollectionLog } = await import('./db');
    const { emailService } = await import('./services/emailService');
    const { generateDailyNewsEmail } = await import('./services/emailTemplates');
    
    const startTime = new Date();
    const collector = new NewsCollector();
    
    console.log('[NewsCollection] Starting collection...');
    const result = await collector.collectNews();
    console.log(`[NewsCollection] Collected ${result.articles.length} articles`);
    
    if (result.articles.length === 0) {
      throw new Error('No articles collected');
    }
    
    // Flag articles relevant to AHA transformation pillars
    const flaggedArticles = collector.flagAHARelevance(result.articles);
    const ahaArticles = flaggedArticles.filter(a => a.ahaRelevant);
    console.log(`[NewsCollection] AHA-relevant articles: ${ahaArticles.length}/${flaggedArticles.length}`);
    
    console.log('[NewsCollection] Generating AI analysis...');
    const aiAnalysis = await collector.generateAIAnalysis(flaggedArticles);
    
    console.log('[NewsCollection] Categorizing articles...');
    const categorizedNews = collector.categorizeArticles(flaggedArticles);
    
    console.log('[NewsCollection] Generating HTML report...');
    const htmlContent = generateHTMLReport({
      articles: flaggedArticles,
      aiAnalysis,
      categorizedNews,
      stats: {
        articleCount: flaggedArticles.length,
        categoryCount: Object.keys(categorizedNews).length,
        regions: 11,
      },
    });
    
    console.log('[NewsCollection] Saving to database...');
    await saveArticles(flaggedArticles.map(a => ({
      title: a.title,
      url: a.url,
      source: a.source,
      publishedDate: a.publishedDate,
      snippet: a.snippet,
      category: a.category,
      region: a.region,
    })));
    
    // Send email if configured
    let emailSent = false;
    let emailsSentCount = 0;
    const job = this.jobs.get(jobId);
    const isTestMode = job?.testMode || false;
    
    if (emailService.isReady()) {
      try {
        const emailHtml = generateDailyNewsEmail(
          result.articles,
          aiAnalysis,
          categorizedNews
        );
        
        const today = new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        
        const subject = `Insurtech News Weekly Digest - ${today}`;
        
        if (isTestMode) {
          // TEST MODE: Send only to test email
          console.log('[NewsCollection] 🧪 TEST MODE - Sending to test email only');
          const testEmail = 'xingcheng4237@gmail.com';
          
          emailSent = await emailService.sendNewsReport(
            testEmail,
            `[TEST] ${subject}`,
            emailHtml,
            result.articles
          );
          
          if (emailSent) {
            emailsSentCount = 1;
            console.log('[NewsCollection] ✅ Test email sent to:', testEmail);
          } else {
            console.error('[NewsCollection] ❌ Test email failed');
          }
        } else {
          // PRODUCTION MODE: Send to all verified subscribers
          console.log('[NewsCollection] 📧 PRODUCTION MODE - Sending to all subscribers');
          const { getActiveSubscribers } = await import('./subscriptionService');
          const subscribers = await getActiveSubscribers();
          
          if (subscribers.length === 0) {
            console.warn('[NewsCollection] ⚠️  No active subscribers found');
            console.warn('   Add subscribers at: /api/trpc/subscription.subscribe');
          } else {
            console.log(`[NewsCollection] Sending to ${subscribers.length} subscriber(s)...`);
            
            for (let i = 0; i < subscribers.length; i++) {
              const subscriber = subscribers[i];
              try {
                const sent = await emailService.sendNewsReport(
                  subscriber.email,
                  subject,
                  emailHtml,
                  result.articles
                );
                
                if (sent) {
                  emailsSentCount++;
                  console.log(`  ✅ Sent to: ${subscriber.email}`);
                } else {
                  console.error(`  ❌ Failed to send to: ${subscriber.email}`);
                }
                
                // Rate limiting: Wait 600ms between emails (Resend limit: 2 emails/second)
                if (i < subscribers.length - 1) {
                  await new Promise(resolve => setTimeout(resolve, 600));
                }
              } catch (error: any) {
                console.error(`  ❌ Error sending to ${subscriber.email}:`, error?.message);
              }
            }
            
            emailSent = emailsSentCount > 0;
            console.log(`[NewsCollection] 📊 Emails sent: ${emailsSentCount}/${subscribers.length}`);
          }
        }
      } catch (error) {
        console.error('[NewsCollection] Email error:', error);
      }
    } else {
      console.warn('[NewsCollection] Email not configured - skipping email delivery');
      console.warn('   Set RESEND_API_KEY environment variable');
    }
    
    // Send Slack notification if webhook is configured
    await this.sendSlackNotification(flaggedArticles, ahaArticles, aiAnalysis, isTestMode);
    
    const reportResult = await saveReport({
      reportDate: new Date(),
      htmlContent,
      aiAnalysis,
      articleCount: flaggedArticles.length,
      categories: JSON.stringify(Object.keys(categorizedNews)),
      emailSent: emailSent ? 1 : 0,
    });
    
    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;
    
    await createCollectionLog({
      reportId: reportResult && 'insertId' in reportResult ? Number(reportResult.insertId) : null,
      startTime,
      endTime,
      collectionTime: result.collectionTime,
      articleCount: flaggedArticles.length,
      emailSent: emailSent,
      status: 'success',
    });
    
    console.log(`[NewsCollection] Complete! Duration: ${duration.toFixed(2)}s`);
    
    return {
      success: true,
      articleCount: flaggedArticles.length,
      collectionTime: result.collectionTime,
      totalDuration: duration,
      reportId: reportResult && 'insertId' in reportResult ? Number(reportResult.insertId) : null,
      emailSent,
    };
  }

  /**
   * Send a Slack notification with the weekly digest summary
   */
  private async sendSlackNotification(
    articles: Array<{ title: string; url: string; source: string; ahaRelevant?: boolean }>,
    ahaArticles: Array<{ title: string; url: string; source: string }>,
    aiAnalysis: string,
    isTestMode: boolean
  ): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.log('[Slack] No SLACK_WEBHOOK_URL configured — skipping Slack notification');
      return;
    }

    try {
      const today = new Date().toLocaleDateString('en-SG', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        timeZone: 'Asia/Singapore',
      });

      // Extract executive summary (first section before the next heading)
      const summaryMatch = aiAnalysis.match(/Executive Summary[\s\S]*?(?=\n##|\n\*\*Key|$)/i);
      const summary = summaryMatch
        ? summaryMatch[0].replace(/^#+\s*Executive Summary\s*/i, '').trim().substring(0, 600)
        : aiAnalysis.substring(0, 600);

      // Top 5 AHA-relevant articles, fallback to top 5 overall
      const top5 = (ahaArticles.length >= 3 ? ahaArticles : articles).slice(0, 5);

      const articleBlocks = top5.map(a =>
        `• <${a.url}|${a.title}> — _${a.source}_`
      ).join('\n');

      const modeTag = isTestMode ? ' [TEST]' : '';
      const ahaTag = ahaArticles.length > 0 ? ` • ${ahaArticles.length} AHA-relevant` : '';

      const payload = {
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: `📰 Insurtech Weekly Digest${modeTag} — ${today}`, emoji: true },
          },
          {
            type: 'section',
            text: { type: 'mrkdwn', text: `*${articles.length} articles collected${ahaTag}*` },
          },
          {
            type: 'section',
            text: { type: 'mrkdwn', text: `*🤖 AI Executive Summary*\n${summary}` },
          },
          { type: 'divider' },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*🏷️ Top ${top5.length} Articles${ahaArticles.length >= 3 ? ' (AHA-Relevant)' : ''}*\n${articleBlocks}`,
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: 'View Full Report', emoji: true },
                url: `${process.env.BASE_URL || 'https://insurtechnewstracker.chengxing.org'}/latest`,
                style: 'primary',
              },
            ],
          },
        ],
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log('[Slack] ✅ Notification sent successfully');
      } else {
        console.error('[Slack] ❌ Failed to send notification:', response.status, await response.text());
      }
    } catch (error: any) {
      console.error('[Slack] ❌ Error sending notification:', error?.message);
    }
  }

  /**
   * Clean up old completed jobs (keep last 50)
   */
  cleanup(): void {
    const jobs = this.getAllJobs();
    if (jobs.length > 50) {
      const toDelete = jobs.slice(50);
      toDelete.forEach(job => this.jobs.delete(job.id));
    }
  }
}

// Singleton instance
export const jobQueue = new JobQueue();

// Cleanup every hour
setInterval(() => {
  jobQueue.cleanup();
}, 60 * 60 * 1000);
