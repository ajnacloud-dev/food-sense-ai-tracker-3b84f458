
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Edit, Save, X, Dumbbell, Clock, Flame, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";

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
      // Ensure workout_type is valid
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

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWorkoutTypeColor = (type: string) => {
    switch (type) {
      case 'cardio':
        return 'bg-red-100 text-red-800';
      case 'strength':
        return 'bg-blue-100 text-blue-800';
      case 'flexibility':
        return 'bg-green-100 text-green-800';
      case 'sports':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderExercises = (notes: string) => {
    try {
      const parsedNotes = JSON.parse(notes);
      if (parsedNotes.exercises && Array.isArray(parsedNotes.exercises)) {
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exercise</TableHead>
                <TableHead>Sets</TableHead>
                <TableHead>Reps</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Distance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsedNotes.exercises.map((exercise: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{exercise.name}</TableCell>
                  <TableCell>{exercise.sets || '-'}</TableCell>
                  <TableCell>{exercise.reps || '-'}</TableCell>
                  <TableCell>{exercise.duration_seconds ? `${exercise.duration_seconds}s` : '-'}</TableCell>
                  <TableCell>{exercise.distance_km ? `${exercise.distance_km}km` : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
      }
    } catch (e) {
      // If notes is not JSON or doesn't have exercises, fall back to regular notes display
    }
    return null;
  };

  const renderWorkoutSummary = (notes: string) => {
    try {
      const parsedNotes = JSON.parse(notes);
      if (parsedNotes.workout_summary) {
        const summary = parsedNotes.workout_summary;
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{summary.duration_minutes || 0}min</div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">{summary.estimated_calories_burned || 0}</div>
              <div className="text-sm text-gray-600">Calories</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">{summary.intensity || 'N/A'}</div>
              <div className="text-sm text-gray-600">Intensity</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{summary.workout_type || 'General'}</div>
              <div className="text-sm text-gray-600">Type</div>
            </div>
          </div>
        );
      }
    } catch (e) {
      // If notes is not JSON, return null
    }
    return null;
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate("/workouts")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Workouts
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Dumbbell className="h-8 w-8 text-purple-500" />
                Workout Details
              </h1>
              <p className="text-gray-600">View and edit your workout</p>
            </div>
          </div>
          {!editing ? (
            <Button onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={() => {setEditing(false); setEditedData(workout);}}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Workout Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Workout Type</label>
              {editing ? (
                <Select 
                  value={editedData.workout_type || 'other'} 
                  onValueChange={(value: WorkoutType) => setEditedData({ ...editedData, workout_type: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cardio">Cardio</SelectItem>
                    <SelectItem value="strength">Strength</SelectItem>
                    <SelectItem value="flexibility">Flexibility</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-1">
                  <Badge className={getWorkoutTypeColor(workout.workout_type)}>
                    {workout.workout_type?.charAt(0).toUpperCase() + workout.workout_type?.slice(1) || 'Other'}
                  </Badge>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Duration</label>
              {editing ? (
                <Input
                  type="number"
                  value={editedData.duration || 0}
                  onChange={(e) => setEditedData({ ...editedData, duration: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-900">{formatDuration(workout.duration || 0)}</span>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Calories Burned</label>
              {editing ? (
                <Input
                  type="number"
                  value={editedData.calories_burned || 0}
                  onChange={(e) => setEditedData({ ...editedData, calories_burned: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-gray-900">{workout.calories_burned || 0} calories</span>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Date</label>
              <p className="text-gray-900 mt-1">{formatDate(workout.created_at)}</p>
            </div>
          </CardContent>
        </Card>

        {/* AI Analysis Summary */}
        {renderWorkoutSummary(workout.notes) && (
          <Card>
            <CardHeader>
              <CardTitle>AI Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {renderWorkoutSummary(workout.notes)}
            </CardContent>
          </Card>
        )}

        {/* Exercises */}
        {renderExercises(workout.notes) && (
          <Card>
            <CardHeader>
              <CardTitle>Exercises</CardTitle>
              <CardDescription>Detailed breakdown of your workout</CardDescription>
            </CardHeader>
            <CardContent>
              {renderExercises(workout.notes)}
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <Textarea
                value={editedData.notes || ''}
                onChange={(e) => setEditedData({ ...editedData, notes: e.target.value })}
                rows={6}
              />
            ) : (
              <div className="whitespace-pre-wrap text-gray-900">
                {typeof workout.notes === 'string' && workout.notes.startsWith('{') 
                  ? JSON.stringify(JSON.parse(workout.notes), null, 2)
                  : workout.notes || 'No notes available'
                }
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
};

export default WorkoutDetails;
