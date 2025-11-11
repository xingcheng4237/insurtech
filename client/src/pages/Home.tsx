import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper, History, TrendingUp } from "lucide-react";
import { APP_TITLE } from "@/const";
import { Link } from "wouter";

export default function Home() {
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

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-5xl font-bold tracking-tight">
            Your Daily Insurtech Intelligence
          </h2>
          <p className="text-xl text-muted-foreground">
            AI-powered news digest covering life & healthcare insurance, digital platforms, 
            embedded insurance, AI/ML, regulatory changes, and funding across Asia-Pacific.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link href="/latest">
              <Button size="lg" className="gap-2">
                <Newspaper className="h-5 w-5" />
                View Latest Report
              </Button>
            </Link>
            <Link href="/history">
              <Button size="lg" variant="outline" className="gap-2">
                <History className="h-5 w-5" />
                Browse History
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>AI-Powered Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                GPT-4 analyzes news articles to provide executive summaries, key developments, 
                and strategic insights tailored for insurtech leaders.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Newspaper className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Comprehensive Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Tracks 11 Asia-Pacific markets with 99+ search queries across Google News 
                and 7 premium RSS feeds for maximum coverage.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <History className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Daily Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automated daily collection at 9:00 AM SGT with email delivery and 
                web access to current and historical reports.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>Insurtech News Tracker &bull; Powered by AI &bull; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
