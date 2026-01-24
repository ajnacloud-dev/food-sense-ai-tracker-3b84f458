
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserType } from "@/contexts/UserTypeContext";
import CaretakerPageLayout from "@/components/caretaker/CaretakerPageLayout";
import CaretakerLoadingState from "@/components/caretaker/CaretakerLoadingState";
import CaretakerFoodContent from "@/components/caretaker/CaretakerFoodContent";

const CaretakerFood = () => {
  const { user, loading: authLoading } = useAuth();
  const { userType, isLoading: userTypeLoading } = useUserType();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (!userTypeLoading && userType !== 'caretaker') {
      console.log('CaretakerFood: User is not a caretaker, redirecting to /dashboard');
      navigate("/dashboard", { replace: true });
      return;
    }
  }, [user, authLoading, userTypeLoading, userType, navigate]);

  if (authLoading || userTypeLoading) {
    return <CaretakerLoadingState message="Loading participant food entries..." fullHeight />;
  }

  if (!user || userType !== 'caretaker') {
    return null;
  }

  return (
    <CaretakerPageLayout>
      <CaretakerFoodContent />
    </CaretakerPageLayout>
  );
};

export default CaretakerFood;
