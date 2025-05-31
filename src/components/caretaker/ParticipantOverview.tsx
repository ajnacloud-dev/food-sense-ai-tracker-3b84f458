import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Utensils, Receipt, Dumbbell, MessageSquare, Target, Lock, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type PermissionCategory = Database['public']['Enums']['permission_category'];

interface ParticipantData {
  id: string;
  full_name: string;
  email: string;
  categoryAccess: {
    food_entries: boolean;
    receipts: boolean;
    workouts: boolean;
    goals: boolean;
    health_metrics: boolean;
  };
  stats: {
    foodEntries: number;
    receipts: number;
    workouts: number;
    totalCalories: number;
  };
  recentActivities: Array<{
    type: string;
    description: string;
    date: string;
    calories?: number;
  }>;
}

interface ParticipantOverviewProps {
  participantId: string;
  onBack: () => void;
}

const ParticipantOverview = ({ participantId, onBack }: ParticipantOverviewProps) => {
  const [participantData, setParticipantData] = useState<ParticipantData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParticipantData();
  }, [participantId]);

  const fetchParticipantData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch participant basic info
      const { data: participant } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', participantId)
        .single();

      if (!participant) {
        toast.error('Participant not found');
        onBack();
        return;
      }

      // Fetch category permissions
      const { data: permissions } = await supabase
        .from('participant_permissions')
        .select('category, is_granted')
        .eq('participant_id', participantId)
        .eq('caretaker_id', user.id);

      const categoryAccess = {
        food_entries: false,
        receipts: false,
        workouts: false,
        goals: false,
        health_metrics: false
      };

      permissions?.forEach(permission => {
        if (permission.is_granted) {
          categoryAccess[permission.category as keyof typeof categoryAccess] = true;
        }
      });

      // Initialize stats
      let stats = {
        foodEntries: 0,
        receipts: 0,
        workouts: 0,
        totalCalories: 0
      };

      let recentActivities: any[] = [];

      // Fetch data only for categories with permission
      if (categoryAccess.food_entries) {
        const { count: foodCount } = await supabase
          .from('food_entries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', participantId);

        const { data: foodEntries } = await supabase
          .from('food_entries')
          .select('calories, description, created_at')
          .eq('user_id', participantId)
          .order('created_at', { ascending: false })
          .limit(5);

        stats.foodEntries = foodCount || 0;
        stats.totalCalories = foodEntries?.reduce((sum, entry) => sum + (entry.calories || 0), 0) || 0;

        recentActivities.push(...(foodEntries || []).map(entry => ({
          type: 'food',
          description: entry.description || 'Food entry',
          date: entry.created_at,
          calories: entry.calories
        })));
      }

      if (categoryAccess.receipts) {
        const { count: receiptsCount } = await supabase
          .from('receipts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', participantId);

        stats.receipts = receiptsCount || 0;
      }

      if (categoryAccess.workouts) {
        const { count: workoutsCount } = await supabase
          .from('workouts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', participantId);

        const { data: recentWorkouts } = await supabase
          .from('workouts')
          .select('workout_type, calories_burned, created_at')
          .eq('user_id', participantId)
          .order('created_at', { ascending: false })
          .limit(3);

        stats.workouts = workoutsCount || 0;

        recentActivities.push(...(recentWorkouts || []).map(workout => ({
          type: 'workout',
          description: `${workout.workout_type} workout`,
          date: workout.created_at,
          calories: workout.calories_burned
        })));
      }

      // Sort recent activities by date
      recentActivities = recentActivities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

      setParticipantData({
        id: participant.id,
        full_name: participant.full_name || 'Unknown',
        email: participant.email,
        categoryAccess,
        stats,
        recentActivities
      });

    } catch (error) {
      console.error('Error fetching participant data:', error);
      toast.error('Failed to load participant data');
    } finally {
      setLoading(false);
    }
  };

  const requestCategoryAccess = async (category: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('permission_requests')
        .insert({
          participant_id: participantId,
          caretaker_id: user.id,
          category: category as PermissionCategory,
          message: `Requesting access to ${category.replace('_', ' ')} data`
        });

      if (error) throw error;

      toast.success(`Access request sent for ${category.replace('_', ' ')}`);
    } catch (error) {
      console.error('Error requesting access:', error);
      toast.error('Failed to send access request');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food_entries': return <Utensils className="h-4 w-4" />;
      case 'receipts': return <Receipt className="h-4 w-4" />;
      case 'workouts': return <Dumbbell className="h-4 w-4" />;
      case 'goals': return <Target className="h-4 w-4" />;
      case 'health_metrics': return <MessageSquare className="h-4 w-4" />;
      default: return <Lock className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading participant data...</div>;
  }

  if (!participantData) {
    return <div className="flex items-center justify-center h-64">Participant not found</div>;
  }

  const categories = ['food_entries', 'receipts', 'workouts', 'goals', 'health_metrics'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{participantData.full_name}</h1>
            <p className="text-gray-600">{participantData.email}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-600">
          Active Participant
        </Badge>
      </div>

      {/* Category Access Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Category Access</CardTitle>
          <CardDescription>
            Your access permissions for this participant's data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map((category) => {
              const hasAccess = participantData.categoryAccess[category as keyof typeof participantData.categoryAccess];
              return (
                <div key={category} className={`p-4 border rounded-lg ${hasAccess ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`${hasAccess ? 'text-green-600' : 'text-gray-400'}`}>
                      {getCategoryIcon(category)}
                    </div>
                    {hasAccess ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="text-sm font-medium">{getCategoryLabel(category)}</div>
                  {!hasAccess && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2 w-full"
                      onClick={() => requestCategoryAccess(category)}
                    >
                      Request Access
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stats - Only show if has access */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {participantData.categoryAccess.food_entries && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Food Entries</CardTitle>
              <Utensils className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{participantData.stats.foodEntries}</div>
            </CardContent>
          </Card>
        )}

        {participantData.categoryAccess.receipts && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receipts</CardTitle>
              <Receipt className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{participantData.stats.receipts}</div>
            </CardContent>
          </Card>
        )}

        {participantData.categoryAccess.workouts && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workouts</CardTitle>
              <Dumbbell className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{participantData.stats.workouts}</div>
            </CardContent>
          </Card>
        )}

        {participantData.categoryAccess.food_entries && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calories</CardTitle>
              <Target className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{participantData.stats.totalCalories.toLocaleString()}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="activities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activities">Recent Activities</TabsTrigger>
          <TabsTrigger value="goals">Goals & Progress</TabsTrigger>
          <TabsTrigger value="notes">Caretaker Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>
                Latest activities from accessible categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {participantData.recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {participantData.recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                      {activity.type === 'food' && <Utensils className="h-4 w-4 text-green-600" />}
                      {activity.type === 'workout' && <Dumbbell className="h-4 w-4 text-purple-600" />}
                      <div className="flex-1">
                        <div className="font-medium">{activity.description}</div>
                        <div className="text-sm text-gray-500">{new Date(activity.date).toLocaleDateString()}</div>
                      </div>
                      {activity.calories && (
                        <Badge variant="outline">
                          {activity.calories} cal
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No accessible activities or no data available.</p>
                  <p className="text-sm">Request access to categories to see participant activities.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle>Goals & Progress</CardTitle>
              <CardDescription>
                Set and track goals for your participant
              </CardDescription>
            </CardHeader>
            <CardContent>
              {participantData.categoryAccess.goals ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No goals set yet. Create goals to help your participant stay on track.</p>
                  <Button className="mt-4">
                    <Target className="h-4 w-4 mr-2" />
                    Set New Goal
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>You don't have access to goals for this participant.</p>
                  <Button 
                    className="mt-4"
                    onClick={() => requestCategoryAccess('goals')}
                  >
                    Request Goals Access
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Caretaker Notes</CardTitle>
              <CardDescription>
                Private notes and communication with your participant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notes yet. Add notes to track progress and communicate with your participant.</p>
                <Button className="mt-4">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ParticipantOverview;
