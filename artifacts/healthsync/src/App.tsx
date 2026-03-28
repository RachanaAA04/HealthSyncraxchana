import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@workspace/replit-auth-web";
import NotFound from "@/pages/not-found";

// Components
import { AppLayout } from "./components/layout/AppLayout";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tracking from "./pages/Tracking";
import Medications from "./pages/Medications";
import WaterTracker from "./pages/WaterTracker";
import Exercise from "./pages/Exercise";
import Nutrition from "./pages/Nutrition";
import AIChatbot from "./pages/AIChatbot";
import RiskAssessment from "./pages/RiskAssessment";
import HospitalLocator from "./pages/HospitalLocator";
import ProgressReport from "./pages/ProgressReport";
import EmergencySOS from "./pages/EmergencySOS";
import Profile from "./pages/Profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Guarded Route Wrapper
function ProtectedRoute({ component: Component }: { component: any }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center" />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      {/* Protected Routes */}
      <Route path="/">
        {() => <Redirect to="/dashboard" />}
      </Route>
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/tracking" component={() => <ProtectedRoute component={Tracking} />} />
      <Route path="/medications" component={() => <ProtectedRoute component={Medications} />} />
      <Route path="/water" component={() => <ProtectedRoute component={WaterTracker} />} />
      <Route path="/exercise" component={() => <ProtectedRoute component={Exercise} />} />
      <Route path="/nutrition" component={() => <ProtectedRoute component={Nutrition} />} />
      <Route path="/chat" component={() => <ProtectedRoute component={AIChatbot} />} />
      <Route path="/risk" component={() => <ProtectedRoute component={RiskAssessment} />} />
      <Route path="/hospitals" component={() => <ProtectedRoute component={HospitalLocator} />} />
      <Route path="/report" component={() => <ProtectedRoute component={ProgressReport} />} />
      <Route path="/sos" component={() => <ProtectedRoute component={EmergencySOS} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
