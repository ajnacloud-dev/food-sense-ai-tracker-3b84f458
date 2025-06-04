
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { CaretakerDataProvider } from "@/contexts/CaretakerDataContext";
import RoleBasedLayout from "@/components/layout/RoleBasedLayout";
import CaretakerDashboard from "@/components/caretaker/CaretakerDashboard";

const Caretaker = () => {
  const { user, loading: authLoading } = useAuth();
  const { currentRole, isLoading: roleLoading, isPureParticipant, isCaretaker } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    // If user is pure participant (no caretaker relationships), redirect to participant dashboard
    if (!roleLoading && isPureParticipant) {
      console.log('Caretaker page: Pure participant detected, redirecting to /dashboard');
      navigate("/dashboard", { replace: true });
      return;
    }

    // If user is not a caretaker at all, redirect to dashboard
    if (!roleLoading && !isCaretaker) {
      console.log('Caretaker page: User is not a caretaker, redirecting to /dashboard');
      navigate("/dashboard", { replace: true });
      return;
    }
  }, [user, authLoading, roleLoading, isPureParticipant, isCaretaker, navigate]);

  if (authLoading || roleLoading) {
    return (
      <RoleBasedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
            <p className="text-gray-600 font-medium">Loading your caretaker dashboard...</p>
          </div>
        </div>
      </RoleBasedLayout>
    );
  }

  if (!user || isPureParticipant || !isCaretaker) {
    return null; // Will redirect via useEffect
  }

  return (
    <CaretakerDataProvider>
      <RoleBasedLayout>
        <CaretakerDashboard />
      </RoleBasedLayout>
    </CaretakerDataProvider>
  );
};

export default Caretaker;
