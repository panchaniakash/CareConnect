import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isAuthenticated } from "@/lib/auth";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import PatientsPage from "@/pages/patients";
import SchedulePage from "@/pages/schedule";
import ReportsPage from "@/pages/reports";
import AdminConsole from "@/pages/admin-console";
import Header from "@/components/layout/header";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  if (!isAuthenticated()) {
    return <LoginPage />;
  }
  return <Component />;
}

function Router() {
  const authenticated = isAuthenticated();
  
  if (!authenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <Switch>
        <Route path="/" component={() => <ProtectedRoute component={DashboardPage} />} />
        <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
        <Route path="/patients" component={() => <ProtectedRoute component={PatientsPage} />} />
        <Route path="/schedule" component={() => <ProtectedRoute component={SchedulePage} />} />
        <Route path="/reports" component={() => <ProtectedRoute component={ReportsPage} />} />
        <Route path="/admin-console" component={() => <ProtectedRoute component={AdminConsole} />} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
