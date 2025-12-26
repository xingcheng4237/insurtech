import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Newspaper, Home, RefreshCw, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { APP_TITLE } from "@/const";

export default function Jobs() {
  const { data: jobs, isLoading, refetch } = trpc.news.jobs.useQuery();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: 'default',
      failed: 'destructive',
      running: 'secondary',
      pending: 'outline',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const formatDuration = (start?: Date, end?: Date) => {
    if (!start) return 'N/A';
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = (endTime - startTime) / 1000;
    return `${duration.toFixed(1)}s`;
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
              <Link href="/history">
                <Button variant="ghost">History</Button>
              </Link>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Collection Jobs</h2>
          <p className="text-muted-foreground">
            Monitor background news collection jobs and their status
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : jobs && jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <CardTitle className="text-lg">
                          News Collection
                        </CardTitle>
                        <CardDescription className="font-mono text-xs mt-1">
                          {job.id}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(job.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground mb-1">Started</div>
                      <div className="font-medium">
                        {job.startedAt 
                          ? new Date(job.startedAt).toLocaleString() 
                          : 'Not started'}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Duration</div>
                      <div className="font-medium">
                        {formatDuration(job.startedAt, job.completedAt)}
                      </div>
                    </div>
                    {job.status === 'completed' && job.result && (
                      <>
                        <div>
                          <div className="text-muted-foreground mb-1">Articles</div>
                          <div className="font-medium">
                            {job.result.articleCount || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Report ID</div>
                          <div className="font-medium">
                            {job.result.reportId || 'N/A'}
                          </div>
                        </div>
                      </>
                    )}
                    {job.status === 'failed' && job.error && (
                      <div className="col-span-2">
                        <div className="text-muted-foreground mb-1">Error</div>
                        <div className="font-medium text-red-600">
                          {job.error}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Jobs Yet</h3>
              <p className="text-muted-foreground mb-4">
                Collection jobs will appear here when you trigger news collection
              </p>
              <Link href="/latest">
                <Button>Go to Latest Report</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
