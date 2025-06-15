
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserType } from "@/contexts/UserTypeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Heart, Shield, Users, ArrowRight, CheckCircle, Star, Zap, TrendingUp, Clock, Award } from "lucide-react";

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

  const handlePricing = () => {
    navigate("/pricing");
  };

  // Show loading if auth or user type are still loading
  if (authLoading || (user && userTypeLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
        <Card className="max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading your personalized experience...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is logged in, they should be redirected via useEffect
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
        <Card className="max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Redirecting to your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                NutriWealth
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handlePricing} className="text-gray-600 hover:text-green-600">
                Pricing
              </Button>
              <Button onClick={handleSignIn} className="bg-green-600 hover:bg-green-700 text-white px-6">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full text-green-700 text-sm font-medium mb-8">
              <Zap className="h-4 w-4" />
              AI-Powered Wellness Tracking
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-green-800 to-gray-900 bg-clip-text text-transparent">
              Transform Your
              <span className="block text-green-600">Health Journey</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Track nutrition, fitness, and wellness with intelligent insights. Designed for individuals 
              and their care teams to achieve better health together.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button 
                onClick={handleSignIn}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg h-auto group"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={handlePricing}
                className="px-8 py-4 text-lg h-auto"
              >
                View Pricing
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Free 14-day trial
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need for Wellness
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools powered by AI to help you understand and improve your health
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl text-gray-900">Smart Tracking</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-center">
                <CardDescription className="text-gray-600 leading-relaxed">
                  AI-powered food recognition, automatic calorie counting, and intelligent meal suggestions based on your goals.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl text-gray-900">Progress Analytics</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-center">
                <CardDescription className="text-gray-600 leading-relaxed">
                  Advanced analytics and insights to track your progress, identify patterns, and optimize your wellness journey.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl text-gray-900">Care Team Support</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-center">
                <CardDescription className="text-gray-600 leading-relaxed">
                  Connect with healthcare providers and family members with secure, permission-based data sharing.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-xl text-gray-900">Privacy First</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-center">
                <CardDescription className="text-gray-600 leading-relaxed">
                  Your data stays secure with end-to-end encryption and granular privacy controls you can trust.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Clock className="h-8 w-8 text-indigo-600" />
                </div>
                <CardTitle className="text-xl text-gray-900">Real-time Sync</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-center">
                <CardDescription className="text-gray-600 leading-relaxed">
                  Seamless synchronization across all devices with offline support for uninterrupted tracking.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Award className="h-8 w-8 text-pink-600" />
                </div>
                <CardTitle className="text-xl text-gray-900">Goal Achievement</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-center">
                <CardDescription className="text-gray-600 leading-relaxed">
                  Set personalized goals with AI-powered recommendations and celebrate milestones along the way.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
              Trusted by Health-Conscious Individuals Worldwide
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">10K+</div>
                <div className="text-gray-600">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">50M+</div>
                <div className="text-gray-600">Meals Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">4.9</div>
                <div className="text-gray-600 flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  App Store Rating
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-green-600 to-green-700">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Health?
            </h2>
            <p className="text-xl text-green-100 mb-8 opacity-90">
              Join thousands of people using NutriWealth to achieve their wellness goals
            </p>
            <Button 
              onClick={handleSignIn}
              size="lg"
              variant="secondary"
              className="bg-white text-green-700 hover:bg-gray-100 text-lg px-8 py-4 h-auto font-semibold"
            >
              Start Your Free Trial Today
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-white">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">NutriWealth</span>
          </div>
          <p className="text-gray-400 text-sm">
            Secure • Private • Personal Wellness Management
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SimplifiedIndex;
