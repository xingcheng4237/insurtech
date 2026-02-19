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
}

class JobQueue {
  private jobs: Map<string, Job> = new Map();
  private runningJobs: Set<string> = new Set();

  /**
   * Add a new job to the queue
   */
  async addJob(type: 'news_collection'): Promise<string> {
    const jobId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: Job = {
      id: jobId,
      type,
      status: 'pending',
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
        result = await this.runNewsCollection();
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
  private async runNewsCollection(): Promise<any> {
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
    
    console.log('[NewsCollection] Generating AI analysis...');
    const aiAnalysis = await collector.generateAIAnalysis(result.articles);
    
    console.log('[NewsCollection] Categorizing articles...');
    const categorizedNews = collector.categorizeArticles(result.articles);
    
    console.log('[NewsCollection] Generating HTML report...');
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
    
    console.log('[NewsCollection] Saving to database...');
    await saveArticles(result.articles.map(a => ({
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
    const recipientEmail = process.env.EMAIL_TO || process.env.SMTP_USER;
    
    if (emailService.isReady() && recipientEmail) {
      console.log('[NewsCollection] Sending email report...');
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
        
        emailSent = await emailService.sendNewsReport(
          recipientEmail,
          `Insurtech News Daily Digest - ${today}`,
          emailHtml,
          result.articles
        );
        
        if (emailSent) {
          console.log('[NewsCollection] Email sent successfully to:', recipientEmail);
        } else {
          console.error('[NewsCollection] Email sending failed');
        }
      } catch (error) {
        console.error('[NewsCollection] Email error:', error);
      }
    } else {
      console.warn('[NewsCollection] Email not configured - skipping email delivery');
    }
    
    const reportResult = await saveReport({
      reportDate: new Date(),
      htmlContent,
      aiAnalysis,
      articleCount: result.articles.length,
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
      articleCount: result.articles.length,
      emailSent: emailSent,
      status: 'success',
    });
    
    console.log(`[NewsCollection] Complete! Duration: ${duration.toFixed(2)}s`);
    
    return {
      success: true,
      articleCount: result.articles.length,
      collectionTime: result.collectionTime,
      totalDuration: duration,
      reportId: reportResult && 'insertId' in reportResult ? Number(reportResult.insertId) : null,
      emailSent,
    };
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
