import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

interface AdminGuardProps {
  children: ReactNode;
}

/**
 * AdminGuard supplements server-side RBAC by preventing standard users from
 * entering operational screens whose APIs require the administrator role.
 */
export default function AdminGuard({ children }: AdminGuardProps) {
  const { isAuthenticated, loading, user } = useAuth({
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

  if (!isAuthenticated) return null;

  if (user?.role !== "admin") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-6">
        <section className="max-w-md text-center space-y-4">
          <ShieldAlert className="h-10 w-10 mx-auto text-destructive" />
          <h1 className="text-2xl font-semibold">
            Administrator access required
          </h1>
          <p className="text-muted-foreground">
            This operational page is available only to application
            administrators.
          </p>
          <Button asChild>
            <a href="/">Return to the dashboard</a>
          </Button>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
