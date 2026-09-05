import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Newspaper, Home, RefreshCw, Lock } from "lucide-react";
import { Link } from "wouter";
import { APP_TITLE } from "@/const";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function LatestReport() {
  const { data: report, isLoading, refetch } = trpc.news.latest.useQuery();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Production mode: sends to all subscribers (admin only)
  const collectNews = trpc.news.collect.useMutation({
    onSuccess: data => {
      if (data.success) {
        toast.success(data.message || "News collection started");
        toast.info(
          "This may take 5-10 minutes. Refresh the page to see the new report."
        );
        setTimeout(() => refetch(), 30000);
      } else {
        toast.error(data.message || "Failed to start collection");
      }
    },
    onError: err => {
      if (err.data?.code === "FORBIDDEN") {
        toast.error("Admin access required to trigger news collection.");
      } else {
        toast.error("Failed to start news collection");
      }
    },
  });

  // Test mode: sends only to xingcheng4237@gmail.com (admin only)
  const testCollectNews = trpc.news.testCollect.useMutation({
    onSuccess: data => {
      if (data.success) {
        toast.success("🧪 " + (data.message || "Test collection started"));
        toast.info(`Email will be sent to: ${data.testEmail}`);
        toast.info("This may take 5-10 minutes. Check your email!");
        setTimeout(() => refetch(), 30000);
      } else {
        toast.error(data.message || "Failed to start test collection");
      }
    },
    onError: err => {
      if (err.data?.code === "FORBIDDEN") {
        toast.error("Admin access required to trigger test collection.");
      } else {
        toast.error("Failed to start test news collection");
      }
    },
  });

  const handleCollect = () => {
    toast.info("Starting news collection (PRODUCTION MODE)...");
    collectNews.mutate();
  };

  const handleTestCollect = () => {
    toast.info("🧪 Starting TEST collection...");
    testCollectNews.mutate();
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
            <nav className="flex gap-4 items-center">
              <Link href="/">
                <Button variant="ghost" className="gap-2">
                  <Home className="h-4 w-4" />
                  Home
                </Button>
              </Link>
              <Link href="/history">
                <Button variant="ghost">History</Button>
              </Link>
              <Link href="/schedule">
                <Button variant="ghost">Schedule</Button>
              </Link>
              <Link href="/growth">
                <Button variant="ghost">Growth</Button>
              </Link>
              {isAdmin ? (
                <>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleTestCollect}
                    disabled={
                      testCollectNews.isPending || collectNews.isPending
                    }
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${testCollectNews.isPending ? "animate-spin" : ""}`}
                    />
                    🧪 Test Collect
                  </Button>
                  <Button
                    variant="default"
                    className="gap-2"
                    onClick={handleCollect}
                    disabled={
                      collectNews.isPending || testCollectNews.isPending
                    }
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${collectNews.isPending ? "animate-spin" : ""}`}
                    />
                    Collect News
                  </Button>
                </>
              ) : (
                <span className="flex items-center gap-1 text-xs text-muted-foreground px-2">
                  <Lock className="h-3 w-3" />
                  Admin only
                </span>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="w-full">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : report ? (
          <div className="w-full bg-white">
            <div
              className="report-html-content"
              dangerouslySetInnerHTML={{ __html: report.htmlContent }}
            />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center py-20">
            <Newspaper className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No Reports Yet</h2>
            <p className="text-muted-foreground mb-6">
              {isAdmin
                ? 'Click "Collect News" to generate your first weekly digest.'
                : "No reports have been generated yet. Please check back later."}
            </p>
            {isAdmin && (
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleTestCollect}
                  disabled={testCollectNews.isPending || collectNews.isPending}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${testCollectNews.isPending ? "animate-spin" : ""}`}
                  />
                  🧪 Test Collect
                </Button>
                <Button
                  onClick={handleCollect}
                  disabled={collectNews.isPending || testCollectNews.isPending}
                  className="gap-2"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${collectNews.isPending ? "animate-spin" : ""}`}
                  />
                  Collect News Now
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
