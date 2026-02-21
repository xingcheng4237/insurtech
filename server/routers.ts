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
    // Trigger news collection as background job (PRODUCTION MODE - sends to all subscribers)
    collect: publicProcedure.mutation(async () => {
      const { jobQueue } = await import('./jobQueue');
      const jobId = await jobQueue.addJob('news_collection', false); // Production mode
      
      return {
        success: true,
        message: 'News collection started in PRODUCTION mode (will send to all subscribers)',
        jobId,
        mode: 'production',
      };
    }),
    
    // Trigger TEST news collection (sends only to xingcheng4237@gmail.com)
    testCollect: publicProcedure.mutation(async () => {
      const { jobQueue } = await import('./jobQueue');
      const jobId = await jobQueue.addJob('news_collection', true); // Test mode
      
      return {
        success: true,
        message: 'News collection started in TEST mode (will send to xingcheng4237@gmail.com only)',
        jobId,
        mode: 'test',
        testEmail: 'xingcheng4237@gmail.com',
      };
    }),
    
    // Get job status
    jobStatus: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'object' && val !== null && 'jobId' in val) {
          return val as { jobId: string };
        }
        throw new Error('Invalid input: jobId required');
      })
      .query(async ({ input }) => {
        const { jobQueue } = await import('./jobQueue');
        const job = jobQueue.getJob(input.jobId);
        
        if (!job) {
          return { found: false };
        }
        
        return {
          found: true,
          ...job,
        };
      }),
    
    // Get all jobs
    jobs: publicProcedure.query(async () => {
      const { jobQueue } = await import('./jobQueue');
      return jobQueue.getAllJobs();
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
    
    // Get schedule status
    scheduleStatus: publicProcedure.query(async () => {
      const { scheduler } = await import('./scheduler');
      return scheduler.getStatus();
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
    
    // Admin: Verify all unverified subscribers (for migration)
    verifyAll: publicProcedure.mutation(async () => {
      const { getDb } = await import('./db');
      const { subscribers } = await import('../drizzle/schema');
      const { eq, and } = await import('drizzle-orm');
      
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }
      
      // Get all active but unverified subscribers
      const unverified = await db.select().from(subscribers)
        .where(
          and(
            eq(subscribers.active, true),
            eq(subscribers.verified, false)
          )
        );
      
      if (unverified.length === 0) {
        return { 
          success: true, 
          message: 'No unverified subscribers found',
          count: 0 
        };
      }
      
      // Verify all of them
      for (const sub of unverified) {
        await db.update(subscribers)
          .set({ 
            verified: true, 
            verifiedAt: new Date(),
            verificationToken: null 
          })
          .where(eq(subscribers.id, sub.id));
      }
      
      return { 
        success: true, 
        message: `Successfully verified ${unverified.length} subscriber(s)`,
        count: unverified.length,
        emails: unverified.map(s => s.email)
      };
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
