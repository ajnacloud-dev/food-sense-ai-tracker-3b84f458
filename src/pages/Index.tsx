
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Heart, Shield, Users } from "lucide-react";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { 
    currentRole, 
    isPureCaretaker, 
    isPureParticipant, 
    isDualRole, 
    isLoading: roleLoading 
  } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't redirect if still loading
    if (authLoading || roleLoading) {
      console.log('Index: Still loading auth or roles');
      return;
    }

    // If not authenticated, stay on landing page
    if (!user) {
      console.log('Index: No user, staying on landing page');
      return;
    }

    // Simplified routing logic - pure caretakers go to caretaker dashboard
    console.log('Index: Routing user with roles:', {
      isPureCaretaker,
      isPureParticipant,
      isDualRole,
      currentRole
    });

    if (isPureCaretaker) {
      console.log('Index: Routing pure caretaker to /caretaker');
      navigate("/caretaker", { replace: true });
    } else {
      console.log('Index: Routing to participant dashboard');
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, roleLoading, isPureCaretaker, navigate]);

  const handleSignIn = () => {
    navigate("/auth");
  };

  // Show loading if auth or roles are still loading
  if (authLoading || (user && roleLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your personalized experience...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is logged in, they should be redirected via useEffect
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecting you to your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Medical-grade landing page design
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900">
              NutriWealth
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Professional health monitoring platform for participants and healthcare providers. 
            Secure, compliant, and designed for clinical excellence.
          </p>
          <Button 
            onClick={handleSignIn}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium"
          >
            Access Platform
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">For Participants</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-center text-gray-600">
                Track nutrition, exercise, and health metrics with professional-grade analysis and insights.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">For Healthcare Providers</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-center text-gray-600">
                Monitor patient progress with granular permissions and comprehensive health data oversight.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">HIPAA Compliant</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-center text-gray-600">
                Enterprise-grade security with granular permission controls and audit trails.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-16">
          <p className="text-gray-500 text-sm">
            Secure • Professional • Clinical-Grade Health Management
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
