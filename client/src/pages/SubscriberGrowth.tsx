/**
 * Public Subscriber Growth Page — no auth required.
 * Designed to be linkable from chengxing.org as professional CPO intel.
 * Matches the app-wide design system: Tailwind + shadcn/ui, gradient bg, sticky header.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Newspaper, TrendingUp, Users, CheckCircle, CalendarDays } from "lucide-react";
import { Link } from "wouter";
import { APP_TITLE } from "@/const";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-white px-3 py-2 shadow-md text-sm">
      <p className="font-semibold text-foreground mb-1">Week of {label}</p>
      <p className="text-primary">Total: <span className="font-bold">{payload[0]?.value}</span></p>
      {payload[1] && (
        <p className="text-emerald-600">New this week: <span className="font-bold">{payload[1]?.value}</span></p>
      )}
    </div>
  );
}

export default function SubscriberGrowth() {
  const { data, isLoading, error } = trpc.growth.stats.useQuery();

  const chartData = data?.weeklyGrowth.map(w => ({
    week: w.week,
    total: w.total,
    new: w.newSubs,
  })) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header — matches all other pages exactly */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Newspaper className="h-6 w-6" />
              <h1 className="text-xl font-semibold">{APP_TITLE}</h1>
            </div>
            <nav className="flex gap-4">
              <Link href="/">
                <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Home
                </span>
              </Link>
              <Link href="/latest">
                <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Latest Report
                </span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">

          {/* Page title */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold tracking-tight">Newsletter Growth</h2>
            </div>
            <p className="text-muted-foreground max-w-xl">
              Weekly insurtech intelligence for insurance leaders across Asia-Pacific.
              Tracking subscriber growth since launch.
            </p>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Error state */}
          {error && (
            <Card className="border-destructive/50 bg-destructive/5 mb-8">
              <CardContent className="pt-6 text-destructive text-sm">
                Could not load subscriber data. Please try again later.
              </CardContent>
            </Card>
          )}

          {data && (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      Total Subscribers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{data.total}</p>
                    <p className="text-xs text-muted-foreground mt-1">Active</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4" />
                      Verified
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{data.verified}</p>
                    <p className="text-xs text-muted-foreground mt-1">Email confirmed</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4" />
                      Latest Week
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">+{data.latestWeekNewSubs}</p>
                    <p className="text-xs text-muted-foreground mt-1">New subscribers</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                      Weeks Tracked
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{data.weeklyGrowth.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Since launch</p>
                  </CardContent>
                </Card>
              </div>

              {/* Growth chart */}
              {chartData.length > 0 ? (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="text-base">Cumulative Subscriber Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                        <defs>
                          <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="week"
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="total"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fill="url(#growthGrad)"
                          dot={false}
                          activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ) : (
                <Card className="mb-8 border-primary/20 bg-primary/5">
                  <CardContent className="pt-8 pb-8 text-center">
                    <TrendingUp className="h-10 w-10 text-primary mx-auto mb-3" />
                    <p className="font-semibold text-foreground">Growth tracking starts here</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Subscribe to start tracking weekly growth.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Milestones */}
              {data.milestones.length > 0 && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="text-base">Milestones Reached 🎉</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {data.milestones.map(m => (
                        <span
                          key={m}
                          className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-sm font-medium text-primary"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          {m} subscribers
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Subscribe CTA */}
              <Card className="bg-primary text-primary-foreground border-0">
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-lg">Get the weekly digest</p>
                      <p className="text-sm opacity-80 mt-1">
                        Every Friday — top insurtech news curated for APAC insurance leaders.
                      </p>
                    </div>
                    <a
                      href="https://insurtechnewstracker.chengxing.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-white/90 transition-colors"
                    >
                      Subscribe →
                    </a>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>

      {/* Footer — matches Home.tsx exactly */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>
            Insurtech News Tracker &bull; Powered by AI &bull; {new Date().getFullYear()} &bull;{" "}
            <a
              href="https://chengxing.org"
              className="hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              chengxing.org
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
