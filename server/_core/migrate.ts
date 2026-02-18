import mysql from 'mysql2/promise';

export async function runMigrations() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL not set, skipping migrations');
    return;
  }

  console.log('🔄 Running database migrations...');

  try {
    const connection = await mysql.createConnection(DATABASE_URL);

    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        openId VARCHAR(64) NOT NULL UNIQUE,
        name TEXT,
        email VARCHAR(320),
        loginMethod VARCHAR(64),
        role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        lastSignedIn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create articles table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title TEXT NOT NULL,
        url VARCHAR(1024) NOT NULL,
        source VARCHAR(256),
        publishedDate VARCHAR(128),
        snippet TEXT,
        category VARCHAR(128),
        region VARCHAR(64),
        collectedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create reports table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reportDate TIMESTAMP NOT NULL,
        htmlContent TEXT NOT NULL,
        aiAnalysis TEXT,
        articleCount INT NOT NULL DEFAULT 0,
        categories TEXT,
        emailSent INT NOT NULL DEFAULT 0,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create collection_logs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS collection_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reportId INT,
        startTime TIMESTAMP NOT NULL,
        endTime TIMESTAMP NOT NULL,
        collectionTime FLOAT NOT NULL,
        articleCount INT NOT NULL,
        emailSent BOOLEAN NOT NULL DEFAULT FALSE,
        emailSentAt TIMESTAMP,
        errorMessage TEXT,
        status ENUM('success', 'partial', 'failed') NOT NULL DEFAULT 'success',
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reportId) REFERENCES reports(id)
      )
    `);

    // Create subscribers table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(320) NOT NULL UNIQUE,
        name VARCHAR(255),
        verified BOOLEAN NOT NULL DEFAULT FALSE,
        verificationToken VARCHAR(64),
        unsubscribeToken VARCHAR(64) NOT NULL,
        subscribedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        verifiedAt TIMESTAMP,
        unsubscribedAt TIMESTAMP,
        active BOOLEAN NOT NULL DEFAULT TRUE
      )
    `);

    await connection.end();
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}
