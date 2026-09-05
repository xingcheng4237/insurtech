import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Newspaper, Home, Calendar, FileText } from "lucide-react";
import { Link } from "wouter";
import { APP_TITLE } from "@/const";

export default function ReportHistory() {
  const { data: reports, isLoading } = trpc.news.list.useQuery();

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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
              <Link href="/schedule">
                <Button variant="ghost">Schedule</Button>
              </Link>
              <Link href="/growth">
                <Button variant="ghost">Growth</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Report History</h2>
            <p className="text-muted-foreground">
              Browse all past weekly insurtech news digests
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : reports && reports.length > 0 ? (
            <div className="space-y-4">
              {reports.map(report => (
                <Link key={report.id} href={`/report/${report.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Weekly Digest — {formatDate(report.reportDate)}
                          </CardTitle>
                          <CardDescription className="mt-2 flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(report.createdAt).toLocaleString(
                                "en-US",
                                {
                                  timeZone: "Asia/Singapore",
                                  year: "numeric",
                                  month: "numeric",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "numeric",
                                  second: "numeric",
                                  hour12: true,
                                }
                              )}{" "}
                              GMT+8
                            </span>
                            <span>{report.articleCount} articles</span>
                            <span>
                              {JSON.parse(report.categories || "[]").length}{" "}
                              categories
                            </span>
                          </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm">
                          View →
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Reports Yet</h3>
              <p className="text-muted-foreground mb-6">
                Reports will appear here once they are generated.
              </p>
              <Link href="/latest">
                <Button>Go to Latest Report</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <footer className="border-t bg-white/80 mt-8">
        <div className="container mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          {APP_TITLE} &mdash; Weekly Insurtech Intelligence
        </div>
      </footer>
    </div>
  );
}
