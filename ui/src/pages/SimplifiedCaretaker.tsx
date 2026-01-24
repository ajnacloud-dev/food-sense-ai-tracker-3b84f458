
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserType } from "@/contexts/UserTypeContext";
import { CaretakerDataProvider } from "@/contexts/CaretakerDataContext";
import SimpleRoleBasedLayout from "@/components/layout/SimpleRoleBasedLayout";
import CaretakerDashboard from "@/components/caretaker/CaretakerDashboard";

const SimplifiedCaretaker = () => {
  const { user, loading: authLoading } = useAuth();
  const { userType, isLoading: userTypeLoading } = useUserType();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('SimplifiedCaretaker page: Auth and user type state:', {
      user: !!user,
      authLoading,
      userTypeLoading,
      userType
    });

    if (!authLoading && !user) {
      console.log('SimplifiedCaretaker page: No user, redirecting to /auth');
      navigate("/auth");
      return;
    }

    // Wait for user type loading to complete
    if (userTypeLoading) {
      console.log('SimplifiedCaretaker page: Still loading user type...');
      return;
    }

    // If user is not a caretaker, redirect to participant dashboard
    if (userType !== 'caretaker') {
      console.log('SimplifiedCaretaker page: User is not a caretaker, redirecting to /dashboard');
      navigate("/dashboard", { replace: true });
      return;
    }

    console.log('SimplifiedCaretaker page: User is caretaker, showing dashboard');
  }, [user, authLoading, userTypeLoading, userType, navigate]);

  if (authLoading || userTypeLoading) {
    return (
      <SimpleRoleBasedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
            <p className="text-gray-600 font-medium">Loading your caretaker dashboard...</p>
          </div>
        </div>
      </SimpleRoleBasedLayout>
    );
  }

  if (!user || userType !== 'caretaker') {
    return null; // Will redirect via useEffect
  }

  return (
    <CaretakerDataProvider>
      <SimpleRoleBasedLayout>
        <CaretakerDashboard />
      </SimpleRoleBasedLayout>
    </CaretakerDataProvider>
  );
};

export default SimplifiedCaretaker;
