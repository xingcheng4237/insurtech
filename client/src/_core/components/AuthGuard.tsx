import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * AuthGuard wraps protected routes and redirects unauthenticated users to /login.
 * Shows a loading spinner while the auth state is being determined.
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: "/login",
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Will be redirected by useAuth; render nothing in the meantime
    return null;
  }

  return <>{children}</>;
}
