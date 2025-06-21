
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserTypeProvider } from "@/contexts/UserTypeContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { CaretakerDataProvider } from "@/contexts/CaretakerDataContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import PWAUpdateManager from "@/components/pwa/PWAUpdateManager";
import PWAUpdatePrompt from "@/components/pwa/PWAUpdatePrompt";
import NotificationPanel from "@/components/notifications/NotificationPanel";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import SimplifiedCaretaker from "./pages/SimplifiedCaretaker";
import CaretakerFood from "./pages/CaretakerFood";
import CaretakerFoodDetails from "./pages/CaretakerFoodDetails";
import CaretakerReceipts from "./pages/CaretakerReceipts";
import CaretakerReceiptDetails from "./pages/CaretakerReceiptDetails";
import CaretakerWorkouts from "./pages/CaretakerWorkouts";
import Food from "./pages/Food";
import FoodDetails from "./pages/FoodDetails";
import Workouts from "./pages/Workouts";
import WorkoutDetails from "./pages/WorkoutDetails";
import Receipts from "./pages/Receipts";
import ReceiptDetails from "./pages/ReceiptDetails";
import ParticipantPermissions from "./pages/ParticipantPermissions";
import PublicRoute from "./components/routes/PublicRoute";
import PrivateRoute from "./components/routes/PrivateRoute";
import RoleBasedRoute from "./components/routes/RoleBasedRoute";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UserTypeProvider>
          <RoleProvider>
            <CaretakerDataProvider>
              <NotificationProvider>
                <Router>
                  <div className="min-h-screen bg-background">
                    <PWAUpdateManager />
                    <PWAUpdatePrompt />
                    
                    {/* Notification Panel - positioned globally */}
                    <div className="fixed top-4 right-4 z-50">
                      <NotificationPanel />
                    </div>
                    
                    <Routes>
                      <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
                      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                      <Route path="/food" element={<PrivateRoute><Food /></PrivateRoute>} />
                      <Route path="/food/:id" element={<PrivateRoute><FoodDetails /></PrivateRoute>} />
                      <Route path="/workout" element={<PrivateRoute><Workouts /></PrivateRoute>} />
                      <Route path="/workout/:id" element={<PrivateRoute><WorkoutDetails /></PrivateRoute>} />
                      <Route path="/receipts" element={<PrivateRoute><Receipts /></PrivateRoute>} />
                      <Route path="/receipts/:id" element={<PrivateRoute><ReceiptDetails /></PrivateRoute>} />
                      <Route path="/permissions" element={<PrivateRoute><ParticipantPermissions /></PrivateRoute>} />

                      {/* Caretaker Routes */}
                      <Route path="/caretaker" element={<RoleBasedRoute allowedRoles={['caretaker']}><SimplifiedCaretaker /></RoleBasedRoute>} />
                      <Route path="/caretaker/food" element={<RoleBasedRoute allowedRoles={['caretaker']}><CaretakerFood /></RoleBasedRoute>} />
                      <Route path="/caretaker/food/:id" element={<RoleBasedRoute allowedRoles={['caretaker']}><CaretakerFoodDetails /></RoleBasedRoute>} />
                      <Route path="/caretaker/receipts" element={<RoleBasedRoute allowedRoles={['caretaker']}><CaretakerReceipts /></RoleBasedRoute>} />
                      <Route path="/caretaker/receipts/:id" element={<RoleBasedRoute allowedRoles={['caretaker']}><CaretakerReceiptDetails /></RoleBasedRoute>} />
                      <Route path="/caretaker/workouts" element={<RoleBasedRoute allowedRoles={['caretaker']}><CaretakerWorkouts /></RoleBasedRoute>} />
                    </Routes>
                  </div>
                  <Toaster />
                  <ShadcnToaster />
                </Router>
              </NotificationProvider>
            </CaretakerDataProvider>
          </RoleProvider>
        </UserTypeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
