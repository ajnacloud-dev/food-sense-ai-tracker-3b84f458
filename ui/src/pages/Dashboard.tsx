
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserType } from "@/contexts/UserTypeContext";
import SimpleRoleBasedLayout from "@/components/layout/SimpleRoleBasedLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Utensils, Dumbbell, BarChart3, Users, Settings, Plus, Activity, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { userType, isLoading: userTypeLoading } = useUserType();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Dashboard page: Auth and user type state:', {
      user: !!user,
      authLoading,
      userTypeLoading,
      userType
    });

    if (!authLoading && !user) {
      console.log('Dashboard page: No user, redirecting to /auth');
      navigate("/auth");
      return;
    }

    if (userTypeLoading) {
      console.log('Dashboard page: Still loading user type...');
      return;
    }

    if (userType === 'caretaker') {
      console.log('Dashboard page: Caretaker detected, redirecting to /caretaker');
      navigate("/caretaker", { replace: true });
      return;
    }

    console.log('Dashboard page: Participant user, showing dashboard');
  }, [user, authLoading, userTypeLoading, userType, navigate]);

  if (authLoading || userTypeLoading) {
    return (
      <SimpleRoleBasedLayout>
        <div className="nw-page-container flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="nw-loading-spinner h-12 w-12 mx-auto"></div>
            <p className="text-gray-600 font-medium">Loading your dashboard...</p>
          </div>
        </div>
      </SimpleRoleBasedLayout>
    );
  }

  if (!user || userType === 'caretaker') {
    return null;
  }

  return (
    <SimpleRoleBasedLayout>
      <div className="space-y-6 nw-clinical-slide-in">
        {/* Enhanced Header */}
        <div className="nw-page-header">
          <div>
            <h1 className="nw-page-title flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-md">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <span className="nw-text-gradient">Health Dashboard</span>
            </h1>
            <p className="nw-page-subtitle">Track your nutrition, fitness, and wellness journey with intelligent insights</p>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="nw-stats-grid">
          <Card className="nw-card-modern group hover:scale-105 nw-transition-slow cursor-pointer">
            <Link to="/capture" className="block">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Quick Capture</CardTitle>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center group-hover:shadow-md nw-transition-fast">
                  <Camera className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 mb-1">Scan</div>
                <p className="text-xs text-gray-600">Food & receipts</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="nw-card-modern group hover:scale-105 nw-transition-slow cursor-pointer">
            <Link to="/food" className="block">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Nutrition</CardTitle>
                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center group-hover:shadow-md nw-transition-fast">
                  <Utensils className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 mb-1">Food</div>
                <p className="text-xs text-gray-600">Track your meals</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="nw-card-modern group hover:scale-105 nw-transition-slow cursor-pointer">
            <Link to="/workouts" className="block">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Fitness</CardTitle>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center group-hover:shadow-md nw-transition-fast">
                  <Dumbbell className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 mb-1">Exercise</div>
                <p className="text-xs text-gray-600">Log workouts</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="nw-card-modern group hover:scale-105 nw-transition-slow cursor-pointer">
            <Link to="/insights" className="block">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Analytics</CardTitle>
                <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center group-hover:shadow-md nw-transition-fast">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600 mb-1">Insights</div>
                <p className="text-xs text-gray-600">View progress</p>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="nw-content-grid">
          {/* Quick Actions Card */}
          <Card className="nw-card-modern">
            <CardHeader className="border-b border-green-100/50 bg-gradient-to-r from-green-50/50 to-white">
              <CardTitle className="flex items-center gap-3 text-xl text-green-700">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Button asChild className="w-full justify-start h-12 nw-button-outline group">
                <Link to="/capture">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 nw-transition-fast">
                    <Camera className="h-4 w-4 text-blue-600" />
                  </div>
                  Capture Food or Receipt
                </Link>
              </Button>
              <Button asChild className="w-full justify-start h-12 nw-button-outline group">
                <Link to="/workouts">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-purple-200 nw-transition-fast">
                    <Dumbbell className="h-4 w-4 text-purple-600" />
                  </div>
                  Log Workout
                </Link>
              </Button>
              <Button asChild className="w-full justify-start h-12 nw-button-outline group">
                <Link to="/insights">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-orange-200 nw-transition-fast">
                    <BarChart3 className="h-4 w-4 text-orange-600" />
                  </div>
                  View Health Insights
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Care Team Card */}
          <Card className="nw-card-modern">
            <CardHeader className="border-b border-green-100/50 bg-gradient-to-r from-green-50/50 to-white">
              <CardTitle className="flex items-center gap-3 text-xl text-green-700">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                Care Team
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                Manage your healthcare providers and share your health data securely with trusted professionals.
              </p>
              <div className="space-y-3">
                <Button asChild className="w-full justify-start h-12 nw-button-outline group">
                  <Link to="/participant/invitations">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200 nw-transition-fast">
                      <Plus className="h-4 w-4 text-green-600" />
                    </div>
                    Invite Healthcare Providers
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start h-12 nw-button-outline group">
                  <Link to="/participant/permissions">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-gray-200 nw-transition-fast">
                      <Settings className="h-4 w-4 text-gray-600" />
                    </div>
                    Manage Permissions
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Message */}
        <Card className="nw-card-clinical">
          <CardContent className="p-6 md:p-8 text-center">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Welcome to Your Health Journey
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Track your nutrition, exercise, and health metrics with professional-grade tools. 
                Share your progress with trusted healthcare providers and get personalized insights 
                to achieve your wellness goals.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SimpleRoleBasedLayout>
  );
};

export default Dashboard;
