import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserType } from "@/contexts/UserTypeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Heart, Shield, Users, Stethoscope, Activity, FileText } from "lucide-react";

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
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <Brain className="h-9 w-9 text-white" />
            </div>
            <h1 className="nw-page-title nw-text-medical">
              NutriWealth
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto nw-text-balance leading-relaxed">
            Professional health monitoring platform for participants and healthcare providers. 
            Secure, compliant, and designed for clinical excellence.
          </p>
          
          <Button 
            onClick={handleSignIn}
            className="nw-button-modern text-lg px-8 py-4 h-auto"
          >
            Access Platform
          </Button>
        </div>

        {/* Features Grid */}
        <div className="nw-feature-grid mb-16">
          <Card className="nw-card-clinical nw-transition-slow hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Users className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">For Participants</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-center">
              <CardDescription className="text-gray-600 leading-relaxed">
                Track nutrition, exercise, and health metrics with professional-grade analysis and personalized insights.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="nw-card-clinical nw-transition-slow hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Stethoscope className="h-10 w-10 text-blue-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">For Healthcare Providers</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-center">
              <CardDescription className="text-gray-600 leading-relaxed">
                Monitor patient progress with granular permissions and comprehensive health data oversight.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="nw-card-clinical nw-transition-slow hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Shield className="h-10 w-10 text-purple-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">HIPAA Compliant</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-center">
              <CardDescription className="text-gray-600 leading-relaxed">
                Enterprise-grade security with granular permission controls and comprehensive audit trails.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Key Features Section */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Health Platform
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need for professional health monitoring and patient care
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Monitoring</h3>
              <p className="text-gray-600 text-sm">Live health data tracking and analysis</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Health Insights</h3>
              <p className="text-gray-600 text-sm">AI-powered analysis and recommendations</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Clinical Reports</h3>
              <p className="text-gray-600 text-sm">Comprehensive health reports and analytics</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Access</h3>
              <p className="text-gray-600 text-sm">HIPAA-compliant data protection</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-8 md:p-12 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start Your Health Journey Today
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of patients and healthcare providers using NutriWealth for better health outcomes
            </p>
            <Button 
              onClick={handleSignIn}
              variant="secondary"
              className="bg-white text-blue-700 hover:bg-gray-100 text-lg px-8 py-4 h-auto font-semibold"
            >
              Get Started Now
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 py-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            Secure • Professional • Clinical-Grade Health Management
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
