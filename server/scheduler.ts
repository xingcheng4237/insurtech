/**
 * External Schedule Status
 *
 * Railway (or another managed scheduler) is the sole production owner of
 * collection timing. This module intentionally reports configured schedule
 * metadata only; it never starts timers or executes collection work.
 */

interface ScheduleConfig {
  enabled: boolean;
  time: string;
  timezone: string;
  mode: "production" | "test";
  dayOfWeek: string;
}

interface ScheduleStatus {
  enabled: boolean;
  nextRun: string | null;
  lastRun: string | null;
  cronExpression: string | null;
  timezone: string;
  mode: "production" | "test";
}

function getConfig(): ScheduleConfig {
  const configuredMode = process.env.SCHEDULE_MODE;
  const mode = configuredMode === "test" ? "test" : "production";

  return {
    enabled: process.env.SCHEDULE_ENABLED === "true",
    time: process.env.SCHEDULE_TIME || "09:00",
    timezone: process.env.SCHEDULE_TIMEZONE || "Asia/Singapore",
    mode,
    dayOfWeek: process.env.SCHEDULE_DAY_OF_WEEK || "daily",
  };
}

function timeToCron(time: string, dayOfWeek: string): string | null {
  const [hours, minutes] = time.split(":").map(Number);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  const day = dayOfWeek === "daily" ? "*" : dayOfWeek;
  if (!/^(\*|[0-6])$/.test(day)) return null;

  // Railway's documented cron format is minute hour day month weekday (UTC).
  return `${minutes} ${hours} * * ${day}`;
}

class ExternalScheduleStatus {
  getStatus(): ScheduleStatus {
    const config = getConfig();
    const cronExpression = timeToCron(config.time, config.dayOfWeek);

    return {
      enabled: config.enabled && cronExpression !== null,
      // A managed scheduler owns the actual next/last execution timestamps.
      // The UI must not infer these values from an in-process process clock.
      nextRun: null,
      lastRun: null,
      cronExpression: config.enabled ? cronExpression : null,
      timezone: config.timezone,
      mode: config.mode,
    };
  }
}

export const scheduler = new ExternalScheduleStatus();
