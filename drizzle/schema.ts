import { boolean, float, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// News articles table
export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  title: text("title").notNull(),
  url: varchar("url", { length: 1024 }).notNull(),
  source: varchar("source", { length: 256 }),
  publishedDate: varchar("publishedDate", { length: 128 }),
  snippet: text("snippet"),
  category: varchar("category", { length: 128 }),
  region: varchar("region", { length: 64 }),
  collectedAt: timestamp("collectedAt").defaultNow().notNull(),
});

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

// Daily reports table
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  reportDate: timestamp("reportDate").notNull(),
  htmlContent: text("htmlContent").notNull(),
  aiAnalysis: text("aiAnalysis"),
  articleCount: int("articleCount").default(0).notNull(),
  categories: text("categories"), // JSON string of categories
  emailSent: int("emailSent").default(0).notNull(), // 0 = false, 1 = true
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * Collection logs table for tracking performance metrics
 */
export const collectionLogs = mysqlTable("collection_logs", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("reportId").references(() => reports.id),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  collectionTime: float("collectionTime").notNull(), // in seconds
  articleCount: int("articleCount").notNull(),
  emailSent: boolean("emailSent").default(false).notNull(),
  emailSentAt: timestamp("emailSentAt"),
  errorMessage: text("errorMessage"),
  status: mysqlEnum("status", ["success", "partial", "failed"]).default("success").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CollectionLog = typeof collectionLogs.$inferSelect;
export type InsertCollectionLog = typeof collectionLogs.$inferInsert;