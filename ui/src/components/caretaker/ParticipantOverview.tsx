
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Activity, Calendar, Heart } from "lucide-react";
import { backendApi } from "@/lib/api/client";
import { toast } from "sonner";
import { useCaretakerData } from "@/contexts/CaretakerDataContext";
import FoodTable from "@/components/food/FoodTable";
import ReceiptTable from "@/components/receipts/ReceiptTable";
import WorkoutTable from "@/components/workouts/WorkoutTable";

interface ParticipantOverviewProps {
  participantId: string;
  onBack: () => void;
}

interface ParticipantStats {
  foodEntries: number;
  receipts: number;
  workouts: number;
  totalCalories: number;
}

const ParticipantOverview = ({ participantId, onBack }: ParticipantOverviewProps) => {
  const { participantData } = useCaretakerData();
  const [stats, setStats] = useState<ParticipantStats>({
    foodEntries: 0,
    receipts: 0,
    workouts: 0,
    totalCalories: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (participantId) {
      fetchParticipantStats();
    }
  }, [participantId]);

  const fetchParticipantStats = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('ParticipantOverview: Fetching stats for participant:', participantId);

      // Optimized parallel queries for stats
      const [
        { count: foodCount, error: foodError },
        { count: receiptsCount, error: receiptsError },
        { count: workoutsCount, error: workoutsError },
        { data: foodEntries, error: caloriesError }
      ] = await Promise.all([
        backendApi
          .from('food_entries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', participantId),
        backendApi
          .from('app_receipts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', participantId),
        backendApi
          .from('workouts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', participantId),
        backendApi
          .from('food_entries')
          .select('calories')
          .eq('user_id', participantId)
      ]);

      if (foodError) throw foodError;
      if (receiptsError) throw receiptsError;
      if (workoutsError) throw workoutsError;
      if (caloriesError) throw caloriesError;

      const totalCalories = foodEntries?.reduce((sum, entry) => sum + (entry.calories || 0), 0) || 0;

      setStats({
        foodEntries: foodCount || 0,
        receipts: receiptsCount || 0,
        workouts: workoutsCount || 0,
        totalCalories
      });

      console.log('ParticipantOverview: Stats fetched successfully:', {
        foodEntries: foodCount,
        receipts: receiptsCount,
        workouts: workoutsCount,
        totalCalories
      });

    } catch (error) {
      console.error('ParticipantOverview: Error fetching stats:', error);
      setError('Failed to load participant data');
      toast.error('Failed to load participant data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading participant data...</p>
        </div>
      </div>
    );
  }

  if (error || !participantData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Participant not found'}</p>
          <Button onClick={onBack}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <User className="h-8 w-8 text-blue-600" />
              {participantData.full_name}
            </h1>
            <p className="text-gray-600">{participantData.email}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">{participantData.caretaker_type.replace('_', ' ')}</Badge>
              <Badge variant={participantData.status === 'active' ? 'default' : 'secondary'}>
                {participantData.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Food Entries</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.foodEntries}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receipts</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.receipts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workouts</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.workouts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <Heart className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{participantData.health_score}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${participantData.health_score}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Data Tabs */}
      <Tabs defaultValue="food" className="space-y-4">
        <TabsList>
          <TabsTrigger value="food">Food Entries</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
          <TabsTrigger value="workouts">Workouts</TabsTrigger>
        </TabsList>

        <TabsContent value="food">
          <FoodTable participantId={participantId} />
        </TabsContent>

        <TabsContent value="receipts">
          <ReceiptTable participantId={participantId} />
        </TabsContent>

        <TabsContent value="workouts">
          <WorkoutTable participantId={participantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ParticipantOverview;
