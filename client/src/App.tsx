import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Verify from "@/pages/Verify";
import Unsubscribe from "@/pages/Unsubscribe";
import Login from "@/pages/Login";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AuthGuard from "./_core/components/AuthGuard";
import Home from "./pages/Home";
import LatestReport from "./pages/LatestReport";
import ReportHistory from "./pages/ReportHistory";
import ViewReport from "./pages/ViewReport";
import Jobs from "./pages/Jobs";
import Schedule from "./pages/Schedule";
import SubscriberGrowth from "./pages/SubscriberGrowth";

function Router() {
  return (
    <Switch>
      {/* Public routes - no authentication required */}
      <Route path={"/login"} component={Login} />
      <Route path={"/verify"} component={Verify} />
      <Route path={"/unsubscribe"} component={Unsubscribe} />
      <Route path={"/growth"} component={SubscriberGrowth} />

      {/* Protected routes - require Google OAuth authentication */}
      <Route path={"/"}>
        <AuthGuard>
          <Home />
        </AuthGuard>
      </Route>
      <Route path={"/latest"}>
        <AuthGuard>
          <LatestReport />
        </AuthGuard>
      </Route>
      <Route path={"/history"}>
        <AuthGuard>
          <ReportHistory />
        </AuthGuard>
      </Route>
      <Route path={"/report/:id"}>
        <AuthGuard>
          <ViewReport />
        </AuthGuard>
      </Route>
      <Route path={"/jobs"}>
        <AuthGuard>
          <Jobs />
        </AuthGuard>
      </Route>
      <Route path={"/schedule"}>
        <AuthGuard>
          <Schedule />
        </AuthGuard>
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
