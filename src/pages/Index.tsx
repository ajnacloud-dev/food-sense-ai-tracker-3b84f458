
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

    // If not authenticated, stay on index
    if (!user) {
      console.log('Index: No user, staying on landing page');
      return;
    }

    // Route based on user type with detailed logging
    console.log('Index: Routing user with roles:', {
      isPureCaretaker,
      isPureParticipant,
      isDualRole,
      currentRole
    });

    if (isPureCaretaker) {
      console.log('Index: Routing pure caretaker to /caretaker');
      navigate("/caretaker", { replace: true });
    } else if (isPureParticipant || isDualRole) {
      console.log('Index: Routing participant/dual role to /dashboard');
      navigate("/dashboard", { replace: true });
    } else {
      console.log('Index: No clear role detected, defaulting to /dashboard');
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, roleLoading, isPureCaretaker, isPureParticipant, isDualRole, navigate]);

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

  // Landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              NutriWealth
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Comprehensive health tracking and caretaker support platform. Monitor nutrition, exercise, and wellness with intelligent insights.
          </p>
          <Button 
            onClick={handleSignIn}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 text-lg"
          >
            Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">For Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-600">
                Track your daily nutrition, exercise, and health metrics with AI-powered insights and recommendations.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl">For Caretakers</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-600">
                Monitor and support your loved ones' health journey with comprehensive oversight and care management tools.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl">Privacy First</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-600">
                Granular permission controls ensure your health data is shared only with those you trust, when you choose.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-16">
          <p className="text-gray-500 text-sm">
            Secure • Private • Intelligent Health Management
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
