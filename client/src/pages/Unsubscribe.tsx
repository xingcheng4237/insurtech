import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Newspaper, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { APP_TITLE } from '@/const';

export default function Unsubscribe() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    setToken(tokenParam);
  }, []);

  const unsubscribeMutation = trpc.subscription.unsubscribe.useMutation();

  useEffect(() => {
    if (token && !unsubscribeMutation.isSuccess && !unsubscribeMutation.isError) {
      unsubscribeMutation.mutate({ token });
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      {/* Header — matches all other pages */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Newspaper className="h-6 w-6" />
            <h1 className="text-xl font-semibold">{APP_TITLE}</h1>
          </div>
        </div>
      </header>

      {/* Centered card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="shadow-sm">
            <CardContent className="pt-10 pb-10 text-center">
              {unsubscribeMutation.isPending && (
                <>
                  <Loader2 className="h-14 w-14 text-primary mx-auto mb-4 animate-spin" />
                  <h2 className="text-2xl font-bold mb-2">Processing…</h2>
                  <p className="text-muted-foreground">
                    Please wait while we unsubscribe you from the newsletter.
                  </p>
                </>
              )}

              {unsubscribeMutation.isSuccess && unsubscribeMutation.data.success && (
                <>
                  <CheckCircle className="h-14 w-14 text-emerald-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Successfully Unsubscribed</h2>
                  <p className="text-muted-foreground mb-3">
                    {unsubscribeMutation.data.message}
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    You will no longer receive the Insurtech News Weekly Digest. We're sorry to see you go!
                  </p>
                  <Button onClick={() => setLocation('/')} className="w-full">
                    Go to Homepage
                  </Button>
                </>
              )}

              {(unsubscribeMutation.isError || (unsubscribeMutation.isSuccess && !unsubscribeMutation.data.success)) && (
                <>
                  <XCircle className="h-14 w-14 text-destructive mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Unsubscribe Failed</h2>
                  <p className="text-muted-foreground mb-6">
                    {unsubscribeMutation.isError
                      ? 'An error occurred while unsubscribing.'
                      : unsubscribeMutation.data?.message || 'Invalid or expired unsubscribe link.'}
                  </p>
                  <Button onClick={() => setLocation('/')} variant="outline" className="w-full">
                    Return to Homepage
                  </Button>
                </>
              )}

              {!token && (
                <>
                  <XCircle className="h-14 w-14 text-destructive mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Invalid Link</h2>
                  <p className="text-muted-foreground mb-6">
                    No unsubscribe token provided. Please check your email for the correct link.
                  </p>
                  <Button onClick={() => setLocation('/')} variant="outline" className="w-full">
                    Return to Homepage
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>Insurtech News Tracker &bull; Powered by AI &bull; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
