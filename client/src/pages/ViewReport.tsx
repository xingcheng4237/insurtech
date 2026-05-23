import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Newspaper, Home, ArrowLeft } from "lucide-react";
import { Link, useRoute } from "wouter";
import { APP_TITLE } from "@/const";

export default function ViewReport() {
  const [, params] = useRoute("/report/:id");
  const reportId = params?.id ? parseInt(params.id, 10) : 0;
  
  const { data: report, isLoading } = trpc.news.byId.useQuery({ id: reportId });

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
                <Button variant="ghost" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to History
                </Button>
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
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : report ? (
          <div className="w-full">
            <div 
              className="report-html-content bg-white"
              dangerouslySetInnerHTML={{ __html: report.htmlContent }}
            />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center py-20">
            <Newspaper className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">Report Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The report you're looking for doesn't exist.
            </p>
            <Link href="/history">
              <Button>Back to History</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
