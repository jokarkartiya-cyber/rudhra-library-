import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { queryClient } from "@/lib/queryClient";

import Landing from "@/pages/landing";
import Admin from "@/pages/admin";
import AdminAnnouncements from "@/pages/admin-announcements";
import StudentDetail from "@/pages/student-detail";
import Verify from "@/pages/verify";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/announcements" component={AdminAnnouncements} />
      <Route path="/admin/students/:id" component={StudentDetail} />
      <Route path="/verify" component={Verify} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" attribute="class">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
