
import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { initializeLocalAuth } from "@/config/local";
import { UserDataProvider } from "@/contexts/UserDataContext";
import { UserTypeProvider } from "@/contexts/UserTypeContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { CaretakerDataProvider } from "@/contexts/CaretakerDataContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import PWAUpdateManager from "@/components/pwa/PWAUpdateManager";
import EnhancedPWAInstallPrompt from "@/components/pwa/EnhancedPWAInstallPrompt";
import NotificationPanel from "@/components/notifications/NotificationPanel";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import SimplifiedIndex from "./pages/SimplifiedIndex";
import SimplifiedCaretaker from "./pages/SimplifiedCaretaker";
import CaretakerFood from "./pages/CaretakerFood";
import CaretakerFoodDetails from "./pages/CaretakerFoodDetails";
import CaretakerReceipts from "./pages/CaretakerReceipts";
import CaretakerReceiptDetails from "./pages/CaretakerReceiptDetails";
import CaretakerWorkouts from "./pages/CaretakerWorkouts";
import CaretakerWorkoutDetailsPage from "./pages/CaretakerWorkoutDetails";
import CaretakerInsights from "./pages/CaretakerInsights";
import Food from "./pages/Food";
import FoodDetails from "./pages/FoodDetails";
import Workouts from "./pages/Workouts";
import WorkoutDetails from "./pages/WorkoutDetails";
import Receipts from "./pages/Receipts";
import ReceiptDetails from "./pages/ReceiptDetails";
import ParticipantPermissions from "./pages/ParticipantPermissions";
import Pricing from "./pages/Pricing";
import Capture from "./pages/Capture";
import Queue from "./pages/Queue";
import Admin from "./pages/Admin";
import Insights from "./pages/Insights";
import Billing from "./pages/Billing";
import InviteCaretakers from "./pages/InviteCaretakers";
import NotFound from "./pages/NotFound";
import PublicRoute from "./components/routes/PublicRoute";
import PrivateRoute from "./components/routes/PrivateRoute";
import RoleBasedRoute from "./components/routes/RoleBasedRoute";

const queryClient = new QueryClient();

function App() {
  // Initialize local auth on app start
  useEffect(() => {
    initializeLocalAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UserDataProvider>
          <UserTypeProvider>
            <RoleProvider>
              <CaretakerDataProvider>
                <NotificationProvider>
                <Router>
                  <div className="min-h-screen bg-background w-full">
                    <PWAUpdateManager />
                    <EnhancedPWAInstallPrompt />
                    
                    {/* Notification Panel - positioned globally */}
                    <div className="fixed top-4 right-4 z-50">
                      <NotificationPanel />
                    </div>
                    
                    <Routes>
                      <Route path="/" element={<PublicRoute><SimplifiedIndex /></PublicRoute>} />
                      <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
                      <Route path="/pricing" element={<Pricing />} />
                      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                      <Route path="/capture" element={<PrivateRoute><Capture /></PrivateRoute>} />
                      <Route path="/queue" element={<PrivateRoute><Queue /></PrivateRoute>} />
                      <Route path="/food" element={<PrivateRoute><Food /></PrivateRoute>} />
                      <Route path="/food/:id" element={<PrivateRoute><FoodDetails /></PrivateRoute>} />
                      <Route path="/workouts" element={<PrivateRoute><Workouts /></PrivateRoute>} />
                      <Route path="/workouts/:id" element={<PrivateRoute><WorkoutDetails /></PrivateRoute>} />
                      <Route path="/receipts" element={<PrivateRoute><Receipts /></PrivateRoute>} />
                      <Route path="/receipts/:id" element={<PrivateRoute><ReceiptDetails /></PrivateRoute>} />
                      <Route path="/permissions" element={<PrivateRoute><ParticipantPermissions /></PrivateRoute>} />
                      <Route path="/insights" element={<PrivateRoute><Insights /></PrivateRoute>} />
                      <Route path="/billing" element={<PrivateRoute><Billing /></PrivateRoute>} />
                      <Route path="/invite-caretakers" element={<PrivateRoute><InviteCaretakers /></PrivateRoute>} />
                      <Route path="/participant" element={<PrivateRoute><ParticipantPermissions /></PrivateRoute>} />
                      <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />

                      {/* Caretaker Routes */}
                      <Route path="/caretaker" element={<RoleBasedRoute allowedRoles={['caretaker']}><SimplifiedCaretaker /></RoleBasedRoute>} />
                      <Route path="/caretaker/food" element={<RoleBasedRoute allowedRoles={['caretaker']}><CaretakerFood /></RoleBasedRoute>} />
                      <Route path="/caretaker/food/:id" element={<RoleBasedRoute allowedRoles={['caretaker']}><CaretakerFoodDetails /></RoleBasedRoute>} />
                      <Route path="/caretaker/receipts" element={<RoleBasedRoute allowedRoles={['caretaker']}><CaretakerReceipts /></RoleBasedRoute>} />
                      <Route path="/caretaker/receipts/:id" element={<RoleBasedRoute allowedRoles={['caretaker']}><CaretakerReceiptDetails /></RoleBasedRoute>} />
                      <Route path="/caretaker/workouts" element={<RoleBasedRoute allowedRoles={['caretaker']}><CaretakerWorkouts /></RoleBasedRoute>} />
                      <Route path="/caretaker/workouts/:id" element={<RoleBasedRoute allowedRoles={['caretaker']}><CaretakerWorkoutDetailsPage /></RoleBasedRoute>} />
                      <Route path="/caretaker/insights" element={<RoleBasedRoute allowedRoles={['caretaker']}><CaretakerInsights /></RoleBasedRoute>} />
                      
                      {/* 404 Catch-all route */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                  <Toaster />
                  <ShadcnToaster />
                </Router>
              </NotificationProvider>
            </CaretakerDataProvider>
          </RoleProvider>
        </UserTypeProvider>
        </UserDataProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
