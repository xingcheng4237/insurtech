import { APP_TITLE } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";

// Google logo SVG as inline component
function GoogleLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Your email address is not authorized to access this application. Please contact the administrator.",
  auth_failed: "Authentication failed. Please try again.",
  oauth_error: "An error occurred during sign-in. Please try again.",
  no_code: "Sign-in was cancelled. Please try again.",
};

export default function Login() {
  const [location] = useLocation();
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // If already authenticated, redirect to home
  useEffect(() => {
    if (meQuery.data) {
      window.location.href = "/";
    }
  }, [meQuery.data]);

  // Parse error from query string
  const params = new URLSearchParams(window.location.search);
  const errorCode = params.get("error");
  const errorMessage = errorCode ? (ERROR_MESSAGES[errorCode] ?? "An unexpected error occurred. Please try again.") : null;

  const handleSignIn = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2">
            <Newspaper className="h-8 w-8 text-foreground" />
            <span className="text-2xl font-semibold tracking-tight">{APP_TITLE}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            AI-powered daily insurtech intelligence
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-sm border">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Sign in</CardTitle>
            <CardDescription className="text-center">
              Access is restricted to authorized users only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error message */}
            {errorMessage && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Sign in button */}
            <Button
              onClick={handleSignIn}
              variant="outline"
              className="w-full gap-3 h-11 text-sm font-medium"
              disabled={meQuery.isLoading}
            >
              <GoogleLogo />
              Continue with Google
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to the terms of use.
        </p>
      </div>
    </div>
  );
}
