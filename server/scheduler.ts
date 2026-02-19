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
    
    // Get current UTC time
    const now = new Date();
    
    // Format current time in target timezone to get date components
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: this.config.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    
    const parts = formatter.formatToParts(now);
    const getValue = (type: string) => parts.find(p => p.type === type)?.value || '0';
    
    const currentYear = parseInt(getValue('year'));
    const currentMonth = parseInt(getValue('month')) - 1; // JS months are 0-indexed
    const currentDay = parseInt(getValue('day'));
    const currentHour = parseInt(getValue('hour'));
    const currentMinute = parseInt(getValue('minute'));
    
    // Create next run date in target timezone
    // We'll create a date string in ISO format for the target timezone
    let nextDay = currentDay;
    let nextMonth = currentMonth;
    let nextYear = currentYear;
    
    // If scheduled time has passed today in target timezone, schedule for tomorrow
    if (hours < currentHour || (hours === currentHour && minutes <= currentMinute)) {
      nextDay++;
      // Handle month/year rollover
      const daysInMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
      if (nextDay > daysInMonth) {
        nextDay = 1;
        nextMonth++;
        if (nextMonth > 11) {
          nextMonth = 0;
          nextYear++;
        }
      }
    }
    
    // Create a date object representing the scheduled time in target timezone
    // We'll format it directly using the target timezone
    const scheduledDate = new Date(Date.UTC(nextYear, nextMonth, nextDay, hours, minutes, 0));
    
    // Adjust for timezone offset
    // Get the offset between UTC and target timezone
    const offsetFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: this.config.timezone,
      timeZoneName: 'longOffset',
    });
    const offsetParts = offsetFormatter.formatToParts(now);
    const offsetString = offsetParts.find(p => p.type === 'timeZoneName')?.value || 'GMT';
    const offsetMatch = offsetString.match(/GMT([+-])(\d+)/);
    
    let offsetHours = 0;
    if (offsetMatch) {
      offsetHours = parseInt(offsetMatch[2]) * (offsetMatch[1] === '+' ? 1 : -1);
    }
    
    // Adjust the UTC time by the offset
    const adjustedTime = new Date(scheduledDate.getTime() - (offsetHours * 60 * 60 * 1000));
    
    // Format the result
    return adjustedTime.toLocaleString('en-US', {
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
