import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard";
import AgentsPage from "@/pages/AgentsPage";
import ProjectManualPage from "@/pages/ProjectManualPage";
import ProjectAssistedPage from "@/pages/ProjectAssistedPage";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      
      {/* Rutas Protegidas */}
      <Route path={"/dashboard"}>
        <SignedIn>
          <Dashboard />
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </Route>

      <Route path={"/agents"}>
        <SignedIn>
          <AgentsPage />
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </Route>

      <Route path={"/projects/new"}>
        <SignedIn>
          <ProjectManualPage />
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </Route>

      <Route path={"/projects/assisted"}>
        <SignedIn>
          <ProjectAssistedPage />
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
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
      <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
        <ThemeProvider
          defaultTheme="dark"
          // switchable
        >
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default App;
