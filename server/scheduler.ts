/**
 * Scheduled Job Service
 * Handles automated daily news collection using node-cron
 */

import cron from 'node-cron';
import { jobQueue } from './jobQueue';

interface ScheduleConfig {
  enabled: boolean;
  time: string; // HH:MM format (24-hour)
  timezone: string;
  mode: 'production' | 'test';
}

interface ScheduleStatus {
  enabled: boolean;
  nextRun: string | null;
  lastRun: string | null;
  cronExpression: string | null;
  timezone: string;
  mode: 'production' | 'test';
}

class Scheduler {
  private task: cron.ScheduledTask | null = null;
  private config: ScheduleConfig;
  private lastRunTime: Date | null = null;

  constructor() {
    // Load configuration from environment variables
    this.config = {
      enabled: process.env.SCHEDULE_ENABLED === 'true',
      time: process.env.SCHEDULE_TIME || '09:00',
      timezone: process.env.SCHEDULE_TIMEZONE || 'Asia/Singapore',
      mode: (process.env.SCHEDULE_MODE as 'production' | 'test') || 'production',
    };

    this.initialize();
  }

  /**
   * Initialize the scheduler based on configuration
   */
  private initialize() {
    if (!this.config.enabled) {
      console.log('📅 Scheduler: DISABLED (set SCHEDULE_ENABLED=true to enable)');
      return;
    }

    const cronExpression = this.timeToCron(this.config.time);
    
    console.log('📅 Scheduler: ENABLED');
    console.log(`   Time: ${this.config.time} (${this.config.timezone})`);
    console.log(`   Cron: ${cronExpression}`);
    console.log(`   Mode: ${this.config.mode.toUpperCase()}`);

    try {
      this.task = cron.schedule(
        cronExpression,
        async () => {
          await this.runScheduledCollection();
        },
        {
          scheduled: true,
          timezone: this.config.timezone,
        }
      );

      console.log('✅ Scheduler: Started successfully');
      this.logNextRun();
    } catch (error: any) {
      console.error('❌ Scheduler: Failed to start', error?.message);
    }
  }

  /**
   * Convert HH:MM time to cron expression
   */
  private timeToCron(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error(`Invalid time format: ${time}. Expected HH:MM (24-hour)`);
    }

    // Cron format: minute hour day month weekday
    // Run every day at specified time
    return `${minutes} ${hours} * * *`;
  }

  /**
   * Run the scheduled news collection
   */
  private async runScheduledCollection() {
    const timestamp = new Date().toISOString();
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🕐 SCHEDULED JOB TRIGGERED`);
    console.log(`   Time: ${timestamp}`);
    console.log(`   Mode: ${this.config.mode.toUpperCase()}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      const isTestMode = this.config.mode === 'test';
      const jobId = await jobQueue.addJob('news_collection', isTestMode);
      
      this.lastRunTime = new Date();
      
      console.log(`✅ Scheduled job started successfully`);
      console.log(`   Job ID: ${jobId}`);
      console.log(`   Test Mode: ${isTestMode}`);
      
      if (isTestMode) {
        console.log(`   📧 Email will be sent to: xingcheng4237@gmail.com`);
      } else {
        console.log(`   📧 Email will be sent to all verified subscribers`);
      }
      
      this.logNextRun();
    } catch (error: any) {
      console.error(`❌ Scheduled job failed to start:`, error?.message);
    }
  }

  /**
   * Log the next scheduled run time
   */
  private logNextRun() {
    const nextRun = this.getNextRunTime();
    if (nextRun) {
      console.log(`⏰ Next scheduled run: ${nextRun}`);
    }
  }

  /**
   * Get the next scheduled run time
   */
  private getNextRunTime(): string | null {
    if (!this.config.enabled || !this.config.time) {
      return null;
    }

    const [hours, minutes] = this.config.time.split(':').map(Number);
    
    // Get current time in the target timezone
    const nowInTimezone = new Date().toLocaleString('en-US', { timeZone: this.config.timezone });
    const now = new Date(nowInTimezone);
    
    // Create next run time in the target timezone
    const next = new Date(nowInTimezone);
    next.setHours(hours, minutes, 0, 0);
    
    // If the time has passed today, schedule for tomorrow
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    return next.toLocaleString('en-US', {
      timeZone: this.config.timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  }

  /**
   * Get current schedule status
   */
  getStatus(): ScheduleStatus {
    return {
      enabled: this.config.enabled,
      nextRun: this.getNextRunTime(),
      lastRun: this.lastRunTime?.toISOString() || null,
      cronExpression: this.config.enabled ? this.timeToCron(this.config.time) : null,
      timezone: this.config.timezone,
      mode: this.config.mode,
    };
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.task) {
      this.task.stop();
      console.log('🛑 Scheduler: Stopped');
    }
  }

  /**
   * Restart the scheduler with new configuration
   */
  restart() {
    this.stop();
    this.initialize();
  }
}

// Export singleton instance
export const scheduler = new Scheduler();
