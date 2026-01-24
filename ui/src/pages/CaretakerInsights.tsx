
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserType } from "@/contexts/UserTypeContext";
import CaretakerPageLayout from "@/components/caretaker/CaretakerPageLayout";
import CaretakerLoadingState from "@/components/caretaker/CaretakerLoadingState";
import CaretakerPageHeader from "@/components/caretaker/CaretakerPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3, Activity, Apple } from "lucide-react";

const CaretakerInsights = () => {
  const { user, loading: authLoading } = useAuth();
  const { userType, isLoading: userTypeLoading } = useUserType();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (!userTypeLoading && userType !== 'caretaker') {
      console.log('CaretakerInsights: User is not a caretaker, redirecting to /dashboard');
      navigate("/dashboard", { replace: true });
      return;
    }
  }, [user, authLoading, userTypeLoading, userType, navigate]);

  const handleBack = () => {
    navigate('/caretaker');
  };

  if (authLoading || userTypeLoading) {
    return <CaretakerLoadingState message="Loading participant insights..." fullHeight />;
  }

  if (!user || userType !== 'caretaker') {
    return null;
  }

  return (
    <CaretakerPageLayout>
      <div className="space-y-6">
        <CaretakerPageHeader
          title="Participant Insights"
          subtitle="Analytics and trends for your participant"
          icon={TrendingUp}
          onBack={handleBack}
        />

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>Nutrition Analytics</CardTitle>
                <CardDescription>
                  Detailed nutrition trends and insights
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600">Coming soon - comprehensive nutrition analytics dashboard</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>Fitness Tracking</CardTitle>
                <CardDescription>
                  Exercise patterns and progress monitoring
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600">Coming soon - workout analytics and progress tracking</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Apple className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle>Health Insights</CardTitle>
                <CardDescription>
                  Overall wellness and health recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600">Coming soon - AI-powered health insights and recommendations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle>Progress Reports</CardTitle>
                <CardDescription>
                  Weekly and monthly progress summaries
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600">Coming soon - automated progress reports and goal tracking</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CaretakerPageLayout>
  );
};

export default CaretakerInsights;
