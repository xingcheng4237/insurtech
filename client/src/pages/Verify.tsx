import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Newspaper, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { APP_TITLE } from "@/const";

export default function Verify() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    setToken(tokenParam);
  }, []);

  const verifyMutation = trpc.subscription.verify.useMutation();

  useEffect(() => {
    if (token && !verifyMutation.isSuccess && !verifyMutation.isError) {
      verifyMutation.mutate({ token });
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
              {verifyMutation.isPending && (
                <>
                  <Loader2 className="h-14 w-14 text-primary mx-auto mb-4 animate-spin" />
                  <h2 className="text-2xl font-bold mb-2">
                    Verifying Your Email…
                  </h2>
                  <p className="text-muted-foreground">
                    Please wait while we verify your subscription.
                  </p>
                </>
              )}

              {verifyMutation.isSuccess && verifyMutation.data.success && (
                <>
                  <CheckCircle className="h-14 w-14 text-emerald-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Email Verified!</h2>
                  <p className="text-muted-foreground mb-3">
                    {verifyMutation.data.message}
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    You'll start receiving the Insurtech News Weekly Digest
                    every Friday at 9:00 AM SGT.
                  </p>
                  <Button onClick={() => setLocation("/")} className="w-full">
                    Go to Homepage
                  </Button>
                </>
              )}

              {(verifyMutation.isError ||
                (verifyMutation.isSuccess && !verifyMutation.data.success)) && (
                <>
                  <XCircle className="h-14 w-14 text-destructive mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">
                    Verification Failed
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {verifyMutation.isError
                      ? "An error occurred during verification."
                      : verifyMutation.data?.message ||
                        "Invalid or expired verification link."}
                  </p>
                  <Button
                    onClick={() => setLocation("/")}
                    variant="outline"
                    className="w-full"
                  >
                    Return to Homepage
                  </Button>
                </>
              )}

              {!token && (
                <>
                  <XCircle className="h-14 w-14 text-destructive mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Invalid Link</h2>
                  <p className="text-muted-foreground mb-6">
                    No verification token provided. Please check your email for
                    the correct link.
                  </p>
                  <Button
                    onClick={() => setLocation("/")}
                    variant="outline"
                    className="w-full"
                  >
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
          <p>
            Insurtech News Tracker &bull; Powered by AI &bull;{" "}
            {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
