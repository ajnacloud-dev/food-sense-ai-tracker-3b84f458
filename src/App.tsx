import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserTypeProvider } from "@/contexts/UserTypeContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { CaretakerDataProvider } from "@/contexts/CaretakerDataContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import PWAUpdateManager from "@/components/pwa/PWAUpdateManager";
import { PWAUpdatePrompt } from "@/components/pwa/PWAUpdatePrompt";
import NotificationPanel from "@/components/notifications/NotificationPanel";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import CaretakerDashboard from "./pages/CaretakerDashboard";
import CaretakerFood from "./pages/CaretakerFood";
import CaretakerFoodDetails from "./pages/CaretakerFoodDetails";
import CaretakerReceipts from "./pages/CaretakerReceipts";
import CaretakerReceiptDetails from "./pages/CaretakerReceiptDetails";
import CaretakerPermissions from "./pages/CaretakerPermissions";
import Settings from "./pages/Settings";
import Food from "./pages/Food";
import FoodDetails from "./pages/FoodDetails";
import Workout from "./pages/Workout";
import WorkoutDetails from "./pages/WorkoutDetails";
import Receipts from "./pages/Receipts";
import ReceiptDetails from "./pages/ReceiptDetails";
import PermissionRequests from "./pages/PermissionRequests";
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
                      <Route path="/workout" element={<PrivateRoute><Workout /></PrivateRoute>} />
                      <Route path="/workout/:id" element={<PrivateRoute><WorkoutDetails /></PrivateRoute>} />
                      <Route path="/receipts" element={<PrivateRoute><Receipts /></PrivateRoute>} />
                      <Route path="/receipts/:id" element={<PrivateRoute><ReceiptDetails /></PrivateRoute>} />
                      <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                      <Route path="/permission-requests" element={<PrivateRoute><PermissionRequests /></PrivateRoute>} />

                      {/* Caretaker Routes */}
                      <Route path="/caretaker" element={<RoleBasedRoute allowedRoles={['caretaker']}><CaretakerDashboard /></RoleBasedRoute>} />
                      <Route path="/caretaker/food" element={<RoleBasedRoute allowedRoles={['caretaker']}><CaretakerFood /></RoleBasedRoute>} />
                      <Route path="/caretaker/food/:id" element={<RoleBasedRoute allowedRoles={['caretaker']}><CaretakerFoodDetails /></RoleBasedRoute>} />
                      <Route path="/caretaker/receipts" element={<RoleBasedRoute allowedRoles={['caretaker']}><CaretakerReceipts /></RoleBasedRoute>} />
                      <Route path="/caretaker/receipts/:id" element={<RoleBasedRoute allowedRoles={['caretaker']}><CaretakerReceiptDetails /></RoleBasedRoute>} />
                      <Route path="/caretaker/permissions" element={<RoleBasedRoute allowedRoles={['caretaker']}><CaretakerPermissions /></RoleBasedRoute>} />
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
