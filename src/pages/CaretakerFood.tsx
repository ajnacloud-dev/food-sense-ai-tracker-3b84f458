
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import SimpleRoleBasedLayout from "@/components/layout/SimpleRoleBasedLayout";
import { CaretakerDataProvider } from "@/contexts/CaretakerDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserType } from "@/contexts/UserTypeContext";
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
    return (
      <SimpleRoleBasedLayout>
        <div className="nw-page-container flex items-center justify-center">
          <Card className="nw-card-modern max-w-md">
            <CardContent className="p-8 text-center">
              <div className="nw-loading-spinner h-12 w-12 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading participant food entries...</p>
            </CardContent>
          </Card>
        </div>
      </SimpleRoleBasedLayout>
    );
  }

  if (!user || userType !== 'caretaker') {
    return null;
  }

  return (
    <CaretakerDataProvider>
      <SimpleRoleBasedLayout>
        <CaretakerFoodContent />
      </SimpleRoleBasedLayout>
    </CaretakerDataProvider>
  );
};

export default CaretakerFood;
