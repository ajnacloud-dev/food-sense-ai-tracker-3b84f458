
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { CaretakerDataProvider } from "@/contexts/CaretakerDataContext";
import RoleBasedLayout from "@/components/layout/RoleBasedLayout";
import CaretakerDashboard from "@/components/caretaker/CaretakerDashboard";

const Caretaker = () => {
  const { user, loading: authLoading } = useAuth();
  const { currentRole, isLoading: roleLoading, isPureParticipant } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    // If user is pure participant, redirect to participant dashboard
    if (!roleLoading && isPureParticipant) {
      console.log('Caretaker page: Pure participant detected, redirecting to /dashboard');
      navigate("/dashboard", { replace: true });
      return;
    }
  }, [user, authLoading, roleLoading, isPureParticipant, navigate]);

  if (authLoading || roleLoading) {
    return (
      <RoleBasedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </RoleBasedLayout>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
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
