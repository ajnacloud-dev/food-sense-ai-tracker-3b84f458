
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Capture from "./pages/Capture";
import Food from "./pages/Food";
import FoodDetails from "./pages/FoodDetails";
import Receipts from "./pages/Receipts";
import ReceiptDetails from "./pages/ReceiptDetails";
import Workouts from "./pages/Workouts";
import WorkoutDetails from "./pages/WorkoutDetails";
import Insights from "./pages/Insights";
import Billing from "./pages/Billing";
import Admin from "./pages/Admin";
import Caretaker from "./pages/Caretaker";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/capture" element={<Capture />} />
          <Route path="/food" element={<Food />} />
          <Route path="/food/:id" element={<FoodDetails />} />
          <Route path="/receipts" element={<Receipts />} />
          <Route path="/receipts/:id" element={<ReceiptDetails />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/workouts/:id" element={<WorkoutDetails />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/caretaker" element={<Caretaker />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
