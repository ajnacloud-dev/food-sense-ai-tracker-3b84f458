
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Calendar, Target, Utensils, Receipt, Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";

interface InsightData {
  totalFoodEntries: number;
  totalCalories: number;
  totalReceipts: number;
  totalSpending: number;
  totalWorkouts: number;
  totalCaloriesBurned: number;
  avgCaloriesPerDay: number;
  avgSpendingPerWeek: number;
  avgWorkoutsPerWeek: number;
  topFoodCategories: string[];
  topSpendingCategories: string[];
  workoutTypes: { [key: string]: number };
}

const Insights = () => {
  const navigate = useNavigate();
  const [insights, setInsights] = useState<InsightData>({
    totalFoodEntries: 0,
    totalCalories: 0,
    totalReceipts: 0,
    totalSpending: 0,
    totalWorkouts: 0,
    totalCaloriesBurned: 0,
    avgCaloriesPerDay: 0,
    avgSpendingPerWeek: 0,
    avgWorkoutsPerWeek: 0,
    topFoodCategories: [],
    topSpendingCategories: [],
    workoutTypes: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch food data
      const { data: foodData } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', user.id);

      // Fetch receipts data
      const { data: receiptsData } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', user.id);

      // Fetch workouts data
      const { data: workoutsData } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id);

      // Calculate insights
      const totalFoodEntries = foodData?.length || 0;
      const totalCalories = foodData?.reduce((sum, entry) => sum + (entry.calories || 0), 0) || 0;
      
      const totalReceipts = receiptsData?.length || 0;
      const totalSpending = receiptsData?.reduce((sum, receipt) => sum + (receipt.total_amount || 0), 0) || 0;
      
      const totalWorkouts = workoutsData?.length || 0;
      const totalCaloriesBurned = workoutsData?.reduce((sum, workout) => sum + (workout.calories_burned || 0), 0) || 0;

      // Calculate averages (assuming data spans multiple days/weeks)
      const avgCaloriesPerDay = totalFoodEntries > 0 ? Math.round(totalCalories / Math.max(1, totalFoodEntries / 2)) : 0;
      const avgSpendingPerWeek = totalReceipts > 0 ? totalSpending / Math.max(1, totalReceipts / 7) : 0;
      const avgWorkoutsPerWeek = totalWorkouts > 0 ? totalWorkouts / Math.max(1, totalWorkouts / 7) : 0;

      // Analyze workout types
      const workoutTypes: { [key: string]: number } = {};
      workoutsData?.forEach(workout => {
        const type = workout.workout_type || 'other';
        workoutTypes[type] = (workoutTypes[type] || 0) + 1;
      });

      setInsights({
        totalFoodEntries,
        totalCalories,
        totalReceipts,
        totalSpending,
        totalWorkouts,
        totalCaloriesBurned,
        avgCaloriesPerDay,
        avgSpendingPerWeek,
        avgWorkoutsPerWeek,
        topFoodCategories: ['Healthy', 'Protein-rich', 'Balanced'], // Mock data
        topSpendingCategories: ['Groceries', 'Restaurants', 'Health'], // Mock data
        workoutTypes,
      });

    } catch (error: any) {
      console.error('Error fetching insights:', error);
      toast.error("Failed to load insights");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getHealthScore = () => {
    // Simple health score calculation based on activity
    let score = 0;
    if (insights.totalFoodEntries > 10) score += 30;
    if (insights.totalWorkouts > 5) score += 40;
    if (insights.avgCaloriesPerDay < 2500 && insights.avgCaloriesPerDay > 1500) score += 30;
    return Math.min(100, score);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading insights...</div>
        </div>
      </SidebarLayout>
    );
  }

  const healthScore = getHealthScore();

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Insights</h1>
          <p className="text-gray-600">Comprehensive analysis of your health and spending patterns</p>
        </div>

        {/* Health Score */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Health Score
            </CardTitle>
            <CardDescription>Based on your nutrition, fitness, and lifestyle tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-bold ${getScoreColor(healthScore)}`}>
                {healthScore}/100
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${healthScore >= 80 ? 'bg-green-500' : healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${healthScore}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {healthScore >= 80 ? 'Excellent! Keep up the great work!' :
                   healthScore >= 60 ? 'Good progress! Room for improvement.' :
                   'Getting started! Track more activities to improve your score.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nutrition Tracking</CardTitle>
              <Utensils className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights.totalFoodEntries}</div>
              <p className="text-xs text-muted-foreground">Food entries analyzed</p>
              <div className="mt-2">
                <Badge variant="outline">{insights.totalCalories.toLocaleString()} calories tracked</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expense Tracking</CardTitle>
              <Receipt className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights.totalReceipts}</div>
              <p className="text-xs text-muted-foreground">Receipts processed</p>
              <div className="mt-2">
                <Badge variant="outline">{formatCurrency(insights.totalSpending)} tracked</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fitness Tracking</CardTitle>
              <Dumbbell className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights.totalWorkouts}</div>
              <p className="text-xs text-muted-foreground">Workouts completed</p>
              <div className="mt-2">
                <Badge variant="outline">{insights.totalCaloriesBurned} calories burned</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weekly Averages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Daily Calories</span>
                <Badge variant="outline">{Math.round(insights.avgCaloriesPerDay)} cal</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Weekly Spending</span>
                <Badge variant="outline">{formatCurrency(insights.avgSpendingPerWeek)}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Weekly Workouts</span>
                <Badge variant="outline">{Math.round(insights.avgWorkoutsPerWeek)} sessions</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Workout Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(insights.workoutTypes).length === 0 ? (
                <p className="text-gray-500 text-center py-4">No workout data available</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(insights.workoutTypes).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm capitalize">{type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(count / insights.totalWorkouts) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Personalized Recommendations
            </CardTitle>
            <CardDescription>Based on your current tracking patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800">Nutrition</h4>
                <p className="text-sm text-green-700 mt-1">
                  {insights.totalFoodEntries < 10 
                    ? "Track more meals to get better insights into your nutrition patterns."
                    : "Great job tracking your nutrition! Consider adding more variety to your diet."}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800">Fitness</h4>
                <p className="text-sm text-blue-700 mt-1">
                  {insights.totalWorkouts < 5 
                    ? "Add more workouts to boost your health score and fitness level."
                    : "Excellent workout consistency! Try mixing different workout types."}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-800">Spending</h4>
                <p className="text-sm text-purple-700 mt-1">
                  {insights.totalReceipts < 5 
                    ? "Track more expenses to understand your spending patterns better."
                    : "Good expense tracking! Look for opportunities to optimize your spending."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
};

export default Insights;
