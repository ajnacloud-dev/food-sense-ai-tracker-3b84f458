
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Save, X, Dumbbell, Clock, Flame, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { WorkoutHeader } from "@/components/workouts/WorkoutHeader";
import { WorkoutBasicInfo } from "@/components/workouts/WorkoutBasicInfo";
import { WorkoutAnalysis } from "@/components/workouts/WorkoutAnalysis";
import { WorkoutExercises } from "@/components/workouts/WorkoutExercises";
import { WorkoutNotes } from "@/components/workouts/WorkoutNotes";

type WorkoutType = 'cardio' | 'strength' | 'flexibility' | 'sports' | 'other';

interface WorkoutEntry {
  id: string;
  workout_type: WorkoutType;
  duration: number;
  calories_burned: number;
  notes: string;
  created_at: string;
}

const WorkoutDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<WorkoutEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<WorkoutEntry>>({});

  useEffect(() => {
    if (id) {
      fetchWorkout();
    }
  }, [id]);

  const fetchWorkout = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setWorkout(data);
      setEditedData(data);
    } catch (error: any) {
      console.error('Error fetching workout:', error);
      toast.error("Failed to load workout");
      navigate("/workouts");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const allowedWorkoutTypes: WorkoutType[] = ['cardio', 'strength', 'flexibility', 'sports', 'other'];
      const updateData = {
        ...editedData,
        workout_type: allowedWorkoutTypes.includes(editedData.workout_type as WorkoutType) 
          ? editedData.workout_type as WorkoutType 
          : 'other' as WorkoutType
      };

      const { error } = await supabase
        .from('workouts')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setWorkout({ ...workout!, ...updateData });
      setEditing(false);
      toast.success("Workout updated successfully");
    } catch (error: any) {
      console.error('Error updating workout:', error);
      toast.error("Failed to update workout");
    }
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading workout...</div>
        </div>
      </SidebarLayout>
    );
  }

  if (!workout) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Workout not found</div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <WorkoutHeader
          workout={workout}
          editing={editing}
          onEdit={() => setEditing(true)}
          onSave={handleSave}
          onCancel={() => {setEditing(false); setEditedData(workout);}}
          onBack={() => navigate("/workouts")}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-1">
            <WorkoutBasicInfo
              workout={workout}
              editing={editing}
              editedData={editedData}
              onEditedDataChange={setEditedData}
            />
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="analysis" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="exercises">Exercises</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="analysis" className="space-y-4">
                <WorkoutAnalysis workout={workout} />
              </TabsContent>
              
              <TabsContent value="exercises" className="space-y-4">
                <WorkoutExercises workout={workout} />
              </TabsContent>
              
              <TabsContent value="notes" className="space-y-4">
                <WorkoutNotes
                  workout={workout}
                  editing={editing}
                  editedData={editedData}
                  onEditedDataChange={setEditedData}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default WorkoutDetails;
