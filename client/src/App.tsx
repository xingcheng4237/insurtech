import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Verify from "@/pages/Verify";
import Unsubscribe from "@/pages/Unsubscribe";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import LatestReport from "./pages/LatestReport";
import ReportHistory from "./pages/ReportHistory";
import ViewReport from "./pages/ViewReport";
import Jobs from "./pages/Jobs";
import Schedule from "./pages/Schedule";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/latest"} component={LatestReport} />
      <Route path={"/history"} component={ReportHistory} />
      <Route path={"/report/:id"} component={ViewReport} />
      <Route path={"/jobs"} component={Jobs} />
      <Route path={"/schedule"} component={Schedule} />
      <Route path={"/verify"} component={Verify} />
      <Route path={"/unsubscribe"} component={Unsubscribe} />
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
