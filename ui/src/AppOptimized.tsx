import { useEffect, lazy, Suspense } from "react";
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
import PublicRoute from "./components/routes/PublicRoute";
import PrivateRoute from "./components/routes/PrivateRoute";
import RoleBasedRoute from "./components/routes/RoleBasedRoute";

// Loading component for suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="nw-loading-spinner h-12 w-12 mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

// Lazy load all route components for code splitting
// Critical pages (auth, dashboard) loaded with higher priority
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SimplifiedIndex = lazy(() => import("./pages/SimplifiedIndex"));

// Main app pages - loaded on demand
const Food = lazy(() => import("./pages/Food"));
const FoodDetails = lazy(() => import("./pages/FoodDetails"));
const Workouts = lazy(() => import("./pages/Workouts"));
const WorkoutDetails = lazy(() => import("./pages/WorkoutDetails"));
const Receipts = lazy(() => import("./pages/Receipts"));
const ReceiptDetails = lazy(() => import("./pages/ReceiptDetails"));
const Capture = lazy(() => import("./pages/Capture"));
const Queue = lazy(() => import("./pages/Queue"));
const Insights = lazy(() => import("./pages/Insights"));
const ParticipantPermissions = lazy(() => import("./pages/ParticipantPermissions"));
const InviteCaretakers = lazy(() => import("./pages/InviteCaretakers"));

// Less frequently used pages
const Pricing = lazy(() => import("./pages/Pricing"));
const Billing = lazy(() => import("./pages/Billing"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Caretaker pages - loaded only when needed
const SimplifiedCaretaker = lazy(() => import("./pages/SimplifiedCaretaker"));
const CaretakerFood = lazy(() => import("./pages/CaretakerFood"));
const CaretakerFoodDetails = lazy(() => import("./pages/CaretakerFoodDetails"));
const CaretakerReceipts = lazy(() => import("./pages/CaretakerReceipts"));
const CaretakerReceiptDetails = lazy(() => import("./pages/CaretakerReceiptDetails"));
const CaretakerWorkouts = lazy(() => import("./pages/CaretakerWorkouts"));
const CaretakerWorkoutDetailsPage = lazy(() => import("./pages/CaretakerWorkoutDetails"));
const CaretakerInsights = lazy(() => import("./pages/CaretakerInsights"));

// Optimized query client with better defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 1,
    },
  },
});

function AppOptimized() {
  // Initialize local auth on app start
  useEffect(() => {
    initializeLocalAuth();

    // Preload critical routes after initial render
    const preloadTimer = setTimeout(() => {
      // Preload commonly accessed pages
      import("./pages/Food");
      import("./pages/FoodDetails");
    }, 2000);

    return () => clearTimeout(preloadTimer);
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

                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<PublicRoute><SimplifiedIndex /></PublicRoute>} />
                        <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
                        <Route path="/pricing" element={<Pricing />} />

                        {/* Private Routes - Participant */}
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

                        {/* 404 */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>

                    <Toaster />
                    <ShadcnToaster />
                  </div>
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

export default AppOptimized;