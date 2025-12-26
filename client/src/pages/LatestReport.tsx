import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Newspaper, Home, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { APP_TITLE } from "@/const";
import { toast } from "sonner";

export default function LatestReport() {
  const { data: report, isLoading, refetch } = trpc.news.latest.useQuery();
  const collectNews = trpc.news.collect.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || 'News collection started');
        toast.info('This may take 5-10 minutes. Refresh the page to see the new report.');
        // Refresh after 30 seconds to check for updates
        setTimeout(() => refetch(), 30000);
      } else {
        toast.error(data.message || 'Failed to start collection');
      }
    },
    onError: () => {
      toast.error('Failed to start news collection');
    },
  });

  const handleCollect = () => {
    toast.info('Starting news collection...');
    collectNews.mutate();
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
              <Link href="/history">
                <Button variant="ghost">History</Button>
              </Link>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={handleCollect}
                disabled={collectNews.isPending}
              >
                <RefreshCw className={`h-4 w-4 ${collectNews.isPending ? 'animate-spin' : ''}`} />
                Collect News
              </Button>
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
              Click "Collect News" to generate your first daily digest.
            </p>
            <Button onClick={handleCollect} disabled={collectNews.isPending} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${collectNews.isPending ? 'animate-spin' : ''}`} />
              Collect News Now
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
