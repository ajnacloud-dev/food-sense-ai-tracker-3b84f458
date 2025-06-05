
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserType } from "@/contexts/UserTypeContext";
import SimpleRoleBasedLayout from "@/components/layout/SimpleRoleBasedLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Utensils, Dumbbell, BarChart3, Users, Settings } from "lucide-react";
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

    // Wait for user type loading to complete
    if (userTypeLoading) {
      console.log('Dashboard page: Still loading user type...');
      return;
    }

    // If user is a caretaker, redirect to caretaker dashboard
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
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto"></div>
            <p className="text-gray-600 font-medium">Loading your dashboard...</p>
          </div>
        </div>
      </SimpleRoleBasedLayout>
    );
  }

  if (!user || userType === 'caretaker') {
    return null; // Will redirect via useEffect
  }

  return (
    <SimpleRoleBasedLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Health Dashboard</h1>
            <p className="text-gray-600 mt-2">Track your nutrition, fitness, and wellness journey</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/capture">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quick Capture</CardTitle>
                <Camera className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">Scan</div>
                <p className="text-xs text-muted-foreground">
                  Food & receipts
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/food">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nutrition</CardTitle>
                <Utensils className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Food</div>
                <p className="text-xs text-muted-foreground">
                  Track your meals
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/workouts">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fitness</CardTitle>
                <Dumbbell className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">Exercise</div>
                <p className="text-xs text-muted-foreground">
                  Log workouts
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/insights">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Analytics</CardTitle>
                <BarChart3 className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">Insights</div>
                <p className="text-xs text-muted-foreground">
                  View progress
                </p>
              </CardContent>
            </Link>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start" variant="outline">
                <Link to="/capture">
                  <Camera className="mr-2 h-4 w-4" />
                  Capture Food or Receipt
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link to="/workouts">
                  <Dumbbell className="mr-2 h-4 w-4" />
                  Log Workout
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link to="/insights">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Health Insights
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Care Team
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Manage your healthcare providers and share your health data securely.
              </p>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link to="/participant/invitations">
                  <Users className="mr-2 h-4 w-4" />
                  Invite Healthcare Providers
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link to="/participant/permissions">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Permissions
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </SimpleRoleBasedLayout>
  );
};

export default Dashboard;
