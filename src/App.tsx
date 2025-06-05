import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { UserTypeProvider } from "./contexts/UserTypeContext";
import { RoleProvider } from "./contexts/RoleContext";
import { CaretakerDataProvider } from "./contexts/CaretakerDataContext";
import EnhancedPWAInstallPrompt from "./components/pwa/EnhancedPWAInstallPrompt";
import PWAUpdatePrompt from "./components/pwa/PWAUpdatePrompt";
import OfflineIndicator from "./components/pwa/OfflineIndicator";

import SimplifiedIndex from "./pages/SimplifiedIndex";
import SimplifiedAuth from "./pages/SimplifiedAuth";
import Join from "./pages/Join";
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
import AdminTestWorkflow from "./pages/AdminTestWorkflow";
import SimplifiedCaretaker from "./pages/SimplifiedCaretaker";
import CaretakerFood from "./pages/CaretakerFood";
import CaretakerFoodDetails from "./pages/CaretakerFoodDetails";
import CaretakerReceipts from "./pages/CaretakerReceipts";
import CaretakerReceiptDetails from "./pages/CaretakerReceiptDetails";
import CaretakerWorkouts from "./pages/CaretakerWorkouts";
import CaretakerWorkoutDetails from "./pages/CaretakerWorkoutDetails";
import CaretakerInsights from "./pages/CaretakerInsights";
import InviteCaretakers from "./pages/InviteCaretakers";
import Participant from "./pages/Participant";
import ParticipantPermissions from "./pages/ParticipantPermissions";
import ParticipantInvitations from "./pages/ParticipantInvitations";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <UserTypeProvider>
        <RoleProvider>
          <CaretakerDataProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <EnhancedPWAInstallPrompt />
              <PWAUpdatePrompt />
              <OfflineIndicator />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<SimplifiedIndex />} />
                  <Route path="/auth" element={<SimplifiedAuth />} />
                  <Route path="/join" element={<Join />} />
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
                  <Route path="/admin/test-workflow" element={<AdminTestWorkflow />} />
                  <Route path="/caretaker" element={<SimplifiedCaretaker />} />
                  <Route path="/caretaker/food" element={<CaretakerFood />} />
                  <Route path="/caretaker/food/:id" element={<CaretakerFoodDetails />} />
                  <Route path="/caretaker/receipts" element={<CaretakerReceipts />} />
                  <Route path="/caretaker/receipts/:id" element={<CaretakerReceiptDetails />} />
                  <Route path="/caretaker/workouts" element={<CaretakerWorkouts />} />
                  <Route path="/caretaker/workouts/:id" element={<CaretakerWorkoutDetails />} />
                  <Route path="/caretaker/insights" element={<CaretakerInsights />} />
                  <Route path="/invite-caretakers" element={<InviteCaretakers />} />
                  <Route path="/participant" element={<Participant />} />
                  <Route path="/participant/permissions" element={<ParticipantPermissions />} />
                  <Route path="/participant/invitations" element={<ParticipantInvitations />} />
                  <Route path="/privacy" element={<Privacy />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </CaretakerDataProvider>
        </RoleProvider>
      </UserTypeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
