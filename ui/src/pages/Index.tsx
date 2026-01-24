
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserType } from "@/contexts/UserTypeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Heart, Shield, Users, UserCheck, Activity, BarChart3 } from "lucide-react";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { userType, isLoading: userTypeLoading } = useUserType();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || userTypeLoading) {
      console.log('Index: Still loading auth or user type');
      return;
    }

    if (!user) {
      console.log('Index: No user, staying on landing page');
      return;
    }

    console.log('Index: Routing user with type:', userType);

    if (userType === 'caretaker') {
      console.log('Index: Routing caretaker to /caretaker');
      navigate("/caretaker", { replace: true });
    } else {
      console.log('Index: Routing to participant dashboard');
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, userTypeLoading, userType, navigate]);

  const handleSignIn = () => {
    navigate("/auth");
  };

  if (authLoading || (user && userTypeLoading)) {
    return (
      <div className="nw-page-container flex items-center justify-center">
        <Card className="nw-card-modern max-w-md">
          <CardContent className="p-8 text-center">
            <div className="nw-loading-spinner h-12 w-12 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading your personalized experience...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user) {
    return (
      <div className="nw-page-container flex items-center justify-center">
        <Card className="nw-card-modern max-w-md">
          <CardContent className="p-8 text-center">
            <div className="nw-loading-spinner h-12 w-12 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Redirecting you to your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="nw-page-container">
      <div className="nw-content-wrapper">
        {/* Hero Section */}
        <div className="text-center mb-16 nw-clinical-slide-in">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center shadow-lg">
              <Brain className="h-9 w-9 text-white" />
            </div>
            <h1 className="nw-page-title nw-text-medical">
              NutriWealth
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto nw-text-balance leading-relaxed">
            Your personal wellness companion for tracking nutrition, fitness, and health goals. 
            Designed for individuals and their support teams to achieve better health together.
          </p>
          
          <Button 
            onClick={handleSignIn}
            className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-4 h-auto"
          >
            Start Your Journey
          </Button>
        </div>

        {/* Features Grid */}
        <div className="nw-feature-grid mb-16">
          <Card className="nw-card-clinical nw-transition-slow hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Users className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">For Individuals</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-center">
              <CardDescription className="text-gray-600 leading-relaxed">
                Track your nutrition, exercise, and wellness metrics with intelligent insights and personalized recommendations.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="nw-card-clinical nw-transition-slow hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <UserCheck className="h-10 w-10 text-blue-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">For Care Teams</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-center">
              <CardDescription className="text-gray-600 leading-relaxed">
                Support your loved ones with permission-based access to wellness data and progress monitoring.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="nw-card-clinical nw-transition-slow hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Shield className="h-10 w-10 text-purple-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">Privacy Focused</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-center">
              <CardDescription className="text-gray-600 leading-relaxed">
                Your data stays secure with privacy-first design and granular permission controls you can trust.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Key Features Section */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Wellness
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools to help you track, understand, and improve your health journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Tracking</h3>
              <p className="text-gray-600 text-sm">Live wellness data monitoring and insights</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Insights</h3>
              <p className="text-gray-600 text-sm">AI-powered analysis and personalized tips</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Health Reports</h3>
              <p className="text-gray-600 text-sm">Comprehensive wellness reports and analytics</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600 text-sm">Bank-level security for your personal data</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-3xl p-8 md:p-12 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Wellness?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of people using NutriWealth to achieve their health and fitness goals
            </p>
            <Button 
              onClick={handleSignIn}
              variant="secondary"
              className="bg-white text-green-700 hover:bg-gray-100 text-lg px-8 py-4 h-auto font-semibold"
            >
              Get Started Today
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 py-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            Secure • Private • Personal Wellness Management
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
