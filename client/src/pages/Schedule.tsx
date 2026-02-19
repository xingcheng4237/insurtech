import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Newspaper, Home, Clock, Calendar, Globe, Settings, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "wouter";
import { APP_TITLE } from "@/const";
import { useEffect, useState } from "react";

export default function Schedule() {
  const { data: status, isLoading, refetch } = trpc.news.scheduleStatus.useQuery();
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');

  // Calculate time until next run
  useEffect(() => {
    if (!status?.nextRun) return;

    const updateCountdown = () => {
      // Try to parse the formatted date string
      // Format: "Friday, February 20, 2026 at 05:00 PM GMT+8"
      const dateMatch = status.nextRun!.match(/(\w+), (\w+) (\d+), (\d+) at (\d+):(\d+) (AM|PM)/);
      if (!dateMatch) {
        setTimeUntilNext('Unable to calculate');
        return;
      }
      
      const [_, weekday, month, day, year, hour12, minute, ampm] = dateMatch;
      let hour = parseInt(hour12);
      if (ampm === 'PM' && hour !== 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
      
      const monthMap: {[key: string]: number} = {
        'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
        'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
      };
      
      const next = new Date(parseInt(year), monthMap[month], parseInt(day), hour, parseInt(minute));
      const now = new Date();
      const diff = next.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilNext('Running now or past due');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      if (seconds > 0 && days === 0) parts.push(`${seconds}s`);

      setTimeUntilNext(parts.join(' ') || 'Less than a second');
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [status?.nextRun]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Newspaper className="h-6 w-6" />
              <h1 className="text-xl font-semibold">{APP_TITLE}</h1>
            </div>
            <nav className="flex gap-4">
              <Link href="/">
                <Button variant="ghost" className="gap-2">
                  <Home className="h-4 w-4" />
                  Home
                </Button>
              </Link>
              <Link href="/latest">
                <Button variant="ghost">Latest Report</Button>
              </Link>
              <Link href="/history">
                <Button variant="ghost">History</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Schedule Configuration</h2>
          <p className="text-muted-foreground">
            Automated daily news collection and email delivery
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : status ? (
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {status.enabled ? (
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    ) : (
                      <XCircle className="h-8 w-8 text-gray-400" />
                    )}
                    <div>
                      <CardTitle className="text-2xl">
                        Schedule Status
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {status.enabled 
                          ? 'Automated collection is active' 
                          : 'Automated collection is disabled'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={status.enabled ? "default" : "secondary"} className="text-base px-4 py-1">
                    {status.enabled ? 'ENABLED' : 'DISABLED'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Next Run */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Next Run</span>
                    </div>
                    {status.enabled && status.nextRun ? (
                      <>
                        <div className="text-lg font-semibold">
                          {status.nextRun}
                        </div>
                        {timeUntilNext && (
                          <div className="text-sm text-muted-foreground">
                            in {timeUntilNext}
                          </div>
                        )}
                      <>
                    ) : (
                      <div className="text-lg text-muted-foreground">
                        Not scheduled
                      </div>
                    )}
                  </div>

                  {/* Last Run */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Last Run</span>
                    </div>
                    {status.lastRun ? (
                      <div className="text-lg font-semibold">
                        {new Date(status.lastRun).toLocaleString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    ) : (
                      <div className="text-lg text-muted-foreground">
                        Never run
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuration Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings className="h-6 w-6" />
                  <CardTitle>Configuration</CardTitle>
                </div>
                <CardDescription>
                  Current schedule settings from environment variables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Timezone */}
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Timezone</div>
                        <div className="text-lg font-semibold mt-1">{status.timezone}</div>
                      </div>
                    </div>

                    {/* Mode */}
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <Settings className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Mode</div>
                        <div className="text-lg font-semibold mt-1 capitalize">
                          {status.mode}
                          {status.mode === 'test' && (
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                              (xingcheng4237@gmail.com only)
                            </span>
                          )}
                          {status.mode === 'production' && (
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                              (all subscribers)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cron Expression */}
                  {status.enabled && status.cronExpression && (
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-muted-foreground">Cron Expression</div>
                        <div className="text-lg font-mono font-semibold mt-1">{status.cronExpression}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Runs daily at the configured time
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* How to Configure */}
            <Card>
              <CardHeader>
                <CardTitle>How to Configure</CardTitle>
                <CardDescription>
                  Schedule settings are managed via Railway environment variables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex gap-3">
                    <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs min-w-[180px]">
                      SCHEDULE_ENABLED
                    </code>
                    <span className="text-muted-foreground">
                      Set to <code className="bg-gray-100 px-1 rounded">true</code> to enable, 
                      <code className="bg-gray-100 px-1 rounded ml-1">false</code> to disable
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs min-w-[180px]">
                      SCHEDULE_TIME
                    </code>
                    <span className="text-muted-foreground">
                      Time in HH:MM format (24-hour), e.g., <code className="bg-gray-100 px-1 rounded">09:00</code>
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs min-w-[180px]">
                      SCHEDULE_TIMEZONE
                    </code>
                    <span className="text-muted-foreground">
                      IANA timezone, e.g., <code className="bg-gray-100 px-1 rounded">Asia/Singapore</code>
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs min-w-[180px]">
                      SCHEDULE_MODE
                    </code>
                    <span className="text-muted-foreground">
                      <code className="bg-gray-100 px-1 rounded">production</code> (all subscribers) or 
                      <code className="bg-gray-100 px-1 rounded ml-1">test</code> (test email only)
                    </span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> Changes to environment variables require a Railway redeploy to take effect.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <XCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Unable to Load Schedule Status</h3>
              <p className="text-muted-foreground mb-4">
                Failed to fetch schedule configuration
              </p>
              <Button onClick={() => refetch()}>Retry</Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
