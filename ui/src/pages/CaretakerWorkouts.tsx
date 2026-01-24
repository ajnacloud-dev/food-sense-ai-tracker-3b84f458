
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserType } from "@/contexts/UserTypeContext";
import CaretakerPageLayout from "@/components/caretaker/CaretakerPageLayout";
import CaretakerLoadingState from "@/components/caretaker/CaretakerLoadingState";
import CaretakerWorkoutContent from "@/components/caretaker/CaretakerWorkoutContent";

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
      <CaretakerWorkoutContent />
    </CaretakerPageLayout>
  );
};

export default CaretakerWorkouts;
