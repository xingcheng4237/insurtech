import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, articles, reports, InsertArticle, InsertReport, collectionLogs, InsertCollectionLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Articles and Reports queries
export async function saveArticles(articlesData: InsertArticle[]) {
  const db = await getDb();
  if (!db || articlesData.length === 0) return;
  
  try {
    await db.insert(articles).values(articlesData);
  } catch (error) {
    console.error('[Database] Failed to save articles:', error);
    throw error;
  }
}

export async function saveReport(reportData: InsertReport) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const result = await db.insert(reports).values(reportData);
    return result;
  } catch (error) {
    console.error('[Database] Failed to save report:', error);
    throw error;
  }
}

export async function getLatestReport() {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(reports).orderBy(desc(reports.reportDate)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllReports(limit: number = 30) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(reports).orderBy(desc(reports.reportDate)).limit(limit);
  return result;
}

export async function getReportById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// Collection Logs helpers
export async function createCollectionLog(log: InsertCollectionLog) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create collection log: database not available");
    return null;
  }
  
  try {
    const result = await db.insert(collectionLogs).values(log);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create collection log:", error);
    throw error;
  }
}

export async function getCollectionLogsByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get collection logs: database not available");
    return [];
  }
  
  try {
    const { and, gte, lte } = await import("drizzle-orm");
    const logs = await db
      .select()
      .from(collectionLogs)
      .where(
        and(
          gte(collectionLogs.createdAt, startDate),
          lte(collectionLogs.createdAt, endDate)
        )
      )
      .orderBy(collectionLogs.createdAt);
    return logs;
  } catch (error) {
    console.error("[Database] Failed to get collection logs:", error);
    return [];
  }
}

export async function getWeeklyPerformanceStats(startDate: Date, endDate: Date) {
  const logs = await getCollectionLogsByDateRange(startDate, endDate);
  
  if (logs.length === 0) {
    return {
      totalCollections: 0,
      successfulCollections: 0,
      failedCollections: 0,
      avgCollectionTime: 0,
      avgArticleCount: 0,
      emailSuccessRate: 0,
      totalArticles: 0,
    };
  }
  
  const successfulLogs = logs.filter(log => log.status === "success");
  const emailSentLogs = logs.filter(log => log.emailSent);
  
  return {
    totalCollections: logs.length,
    successfulCollections: successfulLogs.length,
    failedCollections: logs.filter(log => log.status === "failed").length,
    avgCollectionTime: successfulLogs.reduce((sum, log) => sum + log.collectionTime, 0) / successfulLogs.length,
    avgArticleCount: successfulLogs.reduce((sum, log) => sum + log.articleCount, 0) / successfulLogs.length,
    emailSuccessRate: (emailSentLogs.length / logs.length) * 100,
    totalArticles: logs.reduce((sum, log) => sum + log.articleCount, 0),
  };
}
