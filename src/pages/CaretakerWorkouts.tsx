
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserType } from "@/contexts/UserTypeContext";
import CaretakerPageLayout from "@/components/caretaker/CaretakerPageLayout";
import CaretakerLoadingState from "@/components/caretaker/CaretakerLoadingState";

const CaretakerWorkouts = () => {
  const { user, loading: authLoading } = useAuth();
  const { userType, isLoading: userTypeLoading } = useUserType();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (!userTypeLoading && userType !== 'caretaker') {
      console.log('CaretakerWorkouts: User is not a caretaker, redirecting to /dashboard');
      navigate("/dashboard", { replace: true });
      return;
    }
  }, [user, authLoading, userTypeLoading, userType, navigate]);

  if (authLoading || userTypeLoading) {
    return <CaretakerLoadingState message="Loading participant workouts..." fullHeight />;
  }

  if (!user || userType !== 'caretaker') {
    return null;
  }

  return (
    <CaretakerPageLayout>
      {/* TODO: Implement CaretakerWorkoutsContent component */}
      <div className="p-6">
        <h1 className="text-2xl font-bold">Participant Workouts</h1>
        <p className="text-gray-600 mt-2">Workout management implementation coming soon...</p>
      </div>
    </CaretakerPageLayout>
  );
};

export default CaretakerWorkouts;
