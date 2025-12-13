import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // News collection and reports
  news: router({
    // Trigger man    // Collect news
    collect: publicProcedure.mutation(async () => {
      const startTime = new Date();
      const { NewsCollector } = await import('./newsCollector');
      const { generateHTMLReport } = await import('./reportGenerator');
      const { saveArticles, saveReport } = await import('./db');
      
      const collector = new NewsCollector();
      const result = await collector.collectNews();
      
      if (result.articles.length === 0) {
        return { success: false, message: 'No articles collected' };
      }
      
      // Generate AI analysis
      const aiAnalysis = await collector.generateAIAnalysis(result.articles);
      
      // Categorize articles
      const categorizedNews = collector.categorizeArticles(result.articles);
      
      // Generate HTML report
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
      
      // Save to database
      await saveArticles(result.articles.map(a => ({
        title: a.title,
        url: a.url,
        source: a.source,
        publishedDate: a.publishedDate,
        snippet: a.snippet,
        category: a.category,
        region: a.region,
      })));
      
      const reportResult = await saveReport({
        reportDate: new Date(),
        htmlContent,
        aiAnalysis,
        articleCount: result.articles.length,
        categories: JSON.stringify(Object.keys(categorizedNews)),
        emailSent: 0,
      });
      
      const endTime = new Date();
      
      // Log performance metrics
      const { createCollectionLog } = await import('./db');
      await createCollectionLog({
        reportId: reportResult && 'insertId' in reportResult ? Number(reportResult.insertId) : null,
        startTime,
        endTime,
        collectionTime: result.collectionTime,
        articleCount: result.articles.length,
        emailSent: false,
        status: 'success',
      });
      
      return {
        success: true,
        articleCount: result.articles.length,
        collectionTime: result.collectionTime,
      };
    }),
    
    // Get latest report
    latest: publicProcedure.query(async () => {
      const { getLatestReport } = await import('./db');
      return await getLatestReport();
    }),
    
    // Get all reports
    list: publicProcedure.query(async () => {
      const { getAllReports } = await import('./db');
      return await getAllReports();
    }),
    
    // Get report by ID
    byId: publicProcedure.input((input: unknown) => {
      if (typeof input !== 'object' || input === null || !('id' in input)) {
        throw new Error('Invalid input');
      }
      const { id } = input as { id: unknown };
      if (typeof id !== 'number') {
        throw new Error('ID must be a number');
      }
      return { id };
    }).query(async ({ input }) => {
      const { getReportById } = await import('./db');
      return await getReportById(input.id);
    }),
  }),

  // Email subscription
  subscription: router({
    // Subscribe to newsletter
    subscribe: publicProcedure.input((input: unknown) => {
      if (typeof input !== 'object' || input === null || !('email' in input)) {
        throw new Error('Invalid input');
      }
      const { email, name } = input as { email: unknown; name?: unknown };
      if (typeof email !== 'string' || !email.includes('@')) {
        throw new Error('Valid email is required');
      }
      return { email, name: typeof name === 'string' ? name : undefined };
    }).mutation(async ({ input }) => {
      const { subscribeEmail } = await import('./subscriptionService');
      return await subscribeEmail(input.email, input.name);
    }),
    
    // Verify email
    verify: publicProcedure.input((input: unknown) => {
      if (typeof input !== 'object' || input === null || !('token' in input)) {
        throw new Error('Invalid input');
      }
      const { token } = input as { token: unknown };
      if (typeof token !== 'string') {
        throw new Error('Token must be a string');
      }
      return { token };
    }).mutation(async ({ input }) => {
      const { verifySubscription } = await import('./subscriptionService');
      return await verifySubscription(input.token);
    }),
    
    // Unsubscribe
    unsubscribe: publicProcedure.input((input: unknown) => {
      if (typeof input !== 'object' || input === null || !('token' in input)) {
        throw new Error('Invalid input');
      }
      const { token } = input as { token: unknown };
      if (typeof token !== 'string') {
        throw new Error('Token must be a string');
      }
      return { token };
    }).mutation(async ({ input }) => {
      const { unsubscribeEmail } = await import('./subscriptionService');
      return await unsubscribeEmail(input.token);
    }),
    
    // Get subscription stats
    stats: publicProcedure.query(async () => {
      const { getSubscriptionStats } = await import('./subscriptionService');
      return await getSubscriptionStats();
    }),
  }),

  // Weekly performance review
  performance: router({
    weekly: publicProcedure.query(async () => {
      const { generateWeeklyReport } = await import('./weeklyReportGenerator');
      const { html, stats } = await generateWeeklyReport();
      return { html, stats };
    }),
  }),
});

export type AppRouter = typeof appRouter;
