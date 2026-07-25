import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";

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
    // Restricted to admin users to prevent unauthorised email dispatch
    collect: adminProcedure.mutation(async () => {
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
    // Restricted to admin users
    testCollect: adminProcedure.mutation(async () => {
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
    // Restricted to admin users
    verifyAll: adminProcedure.mutation(async () => {
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

  // One-time admin bootstrap: promote a user to admin by email
  // Protected by BOOTSTRAP_SECRET env var; remove after first use
  admin: router({
    bootstrap: publicProcedure
      .input((input: unknown) => {
        if (typeof input !== 'object' || input === null) throw new Error('Invalid input');
        const { email, secret } = input as { email?: unknown; secret?: unknown };
        if (typeof email !== 'string' || !email.includes('@')) throw new Error('Valid email required');
        if (typeof secret !== 'string') throw new Error('Secret required');
        return { email, secret };
      })
      .mutation(async ({ input }) => {
        const bootstrapSecret = process.env.BOOTSTRAP_SECRET;
        if (!bootstrapSecret || input.secret !== bootstrapSecret) {
          throw new Error('Invalid bootstrap secret');
        }
        const { getDb } = await import('./db');
        const { users } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        const result = await db.update(users)
          .set({ role: 'admin' })
          .where(eq(users.email, input.email.toLowerCase()));
        return { success: true, message: `Promoted ${input.email} to admin` };
      }),
  }),

  // Public subscriber growth stats (no auth required)
  growth: router({
    stats: publicProcedure.query(async () => {
      const { getDb } = await import('./db');
      const { subscribers } = await import('../drizzle/schema');
      const db = await getDb();
      if (!db) {
        return { total: 0, verified: 0, weeklyGrowth: [], milestones: [] };
      }

      const all = await db.select().from(subscribers);
      const active = all.filter(s => s.active);
      const verified = active.filter(s => s.verified);

      // Build weekly cumulative growth from subscribedAt dates
      const sorted = [...active].sort((a, b) =>
        new Date(a.subscribedAt).getTime() - new Date(b.subscribedAt).getTime()
      );

      // Group by ISO week (Mon-Sun)
      const weekMap = new Map<string, number>();
      for (const sub of sorted) {
        const d = new Date(sub.subscribedAt);
        // Get Monday of that week
        const day = d.getDay();
        const monday = new Date(d);
        monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
        const key = monday.toISOString().substring(0, 10);
        weekMap.set(key, (weekMap.get(key) || 0) + 1);
      }

      // Build cumulative series
      const weeklyGrowth: { week: string; newSubs: number; total: number }[] = [];
      let cumulative = 0;
      for (const [week, count] of Array.from(weekMap.entries()).sort()) {
        cumulative += count;
        weeklyGrowth.push({ week, newSubs: count, total: cumulative });
      }

      // Milestones
      const milestones = [1, 5, 10, 25, 50, 100].filter(n => verified.length >= n);

      return {
        total: active.length,
        verified: verified.length,
        weeklyGrowth,
        milestones,
        latestWeekNewSubs: weeklyGrowth.length > 0 ? weeklyGrowth[weeklyGrowth.length - 1].newSubs : 0,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
