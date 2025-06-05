
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserType } from "@/contexts/UserTypeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Heart, Shield, Users } from "lucide-react";

const SimplifiedIndex = () => {
  const { user, loading: authLoading } = useAuth();
  const { userType, isLoading: userTypeLoading } = useUserType();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't redirect if still loading
    if (authLoading || userTypeLoading) {
      console.log('SimplifiedIndex: Still loading auth or user type');
      return;
    }

    // If not authenticated, stay on landing page
    if (!user) {
      console.log('SimplifiedIndex: No user, staying on landing page');
      return;
    }

    // Route based on user type
    console.log('SimplifiedIndex: Routing user with type:', userType);

    if (userType === 'caretaker') {
      console.log('SimplifiedIndex: Routing caretaker to /caretaker');
      navigate("/caretaker", { replace: true });
    } else {
      console.log('SimplifiedIndex: Routing participant to /dashboard');
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, userTypeLoading, userType, navigate]);

  const handleSignIn = () => {
    navigate("/auth");
  };

  // Show loading if auth or user type are still loading
  if (authLoading || (user && userTypeLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your personalized experience...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is logged in, they should be redirected via useEffect
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecting you to your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Updated consumer-friendly landing page design with green theme
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900">
              NutriWealth
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your personal wellness companion for tracking nutrition, fitness, and health goals. 
            Designed for individuals and their support teams to achieve better health together.
          </p>
          <Button 
            onClick={handleSignIn}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-medium"
          >
            Start Your Journey
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">For Individuals</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-center text-gray-600">
                Track nutrition, exercise, and health metrics with intelligent insights and personalized recommendations.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">For Care Teams</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-center text-gray-600">
                Support your loved ones with permission-based access to wellness data and progress monitoring.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">Privacy Focused</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-center text-gray-600">
                Your data stays secure with privacy-first design and granular permission controls you can trust.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-16">
          <p className="text-gray-500 text-sm">
            Secure • Private • Personal Wellness Management
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedIndex;
