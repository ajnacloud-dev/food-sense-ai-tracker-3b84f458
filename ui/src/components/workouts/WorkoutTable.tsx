import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { backendApi } from "@/lib/api/client";
import { toast } from "sonner";

interface Workout {
  id: string;
  created_at: string;
  description?: string;
  notes?: string;
  user_id: string;
  workout_type?: string;
  duration?: number;
  calories_burned?: number;
  workout_exercises: {
    exercise_name: string;
    sets?: number;
    reps?: number;
    weight?: number;
  }[];
}

interface WorkoutTableProps {
  participantId?: string;
  workouts?: Workout[];
  onDelete?: (id: string) => Promise<void>;
  onView?: (id: string) => void;
}

export const WorkoutTable = ({ 
  participantId, 
  workouts: propWorkouts,
  onDelete,
  onView 
}: WorkoutTableProps) => {
  const [workouts, setWorkouts] = useState<Workout[]>(propWorkouts || []);
  const [loading, setLoading] = useState(!propWorkouts);
  const [filters, setFilters] = useState({
    date: undefined as DateRange | undefined,
    search: ''
  });

  const fetchWorkouts = async () => {
    if (!participantId || propWorkouts) {
      console.log('WorkoutTable: No participantId provided or workouts already provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('WorkoutTable: Fetching workouts for participant:', participantId);

      let query = backendApi
        .from('workouts')
        .select(`
          *,
          workout_exercises (*)
        `)
        .eq('user_id', participantId)
        .order('created_at', { ascending: false });

      if (filters.date?.from) {
        const fromDate = format(filters.date.from, 'yyyy-MM-dd');
        query = query.gte('created_at', fromDate);
      }
      if (filters.date?.to) {
        const toDate = format(filters.date.to, 'yyyy-MM-dd');
        query = query.lte('created_at', toDate);
      }
      if (filters.search) {
        query = query.or(`description.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('WorkoutTable: Error fetching workouts:', error);
        throw error;
      }

      console.log('WorkoutTable: Fetched workouts:', data?.length || 0);
      setWorkouts(data || []);
    } catch (error) {
      console.error('WorkoutTable: Error:', error);
      toast.error('Failed to fetch workouts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!propWorkouts) {
      fetchWorkouts();
    }
  }, [participantId, filters, propWorkouts]);

  useEffect(() => {
    if (propWorkouts) {
      setWorkouts(propWorkouts);
      setLoading(false);
    }
  }, [propWorkouts]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleDateChange = (date: DateRange | undefined) => {
    setFilters(prev => ({ ...prev, date: date }));
  };

  const handleView = (id: string) => {
    if (onView) {
      onView(id);
    }
  };

  const handleDelete = async (id: string) => {
    if (onDelete) {
      await onDelete(id);
      // Refresh workouts if we're fetching our own data
      if (!propWorkouts) {
        fetchWorkouts();
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workouts</CardTitle>
        <CardDescription>
          View and manage workout logs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!propWorkouts && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input 
                type="search" 
                id="search" 
                placeholder="Search workouts..." 
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
            <div>
              <Label>Date Range</Label>
              <DatePicker
                mode="range"
                defaultMonth={filters.date?.from}
                selected={filters.date}
                onSelect={handleDateChange}
                className="w-full"
              >
                <Button id="date" variant={"outline"} className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.date?.from ? (
                    filters.date.to ? (
                      `${format(filters.date.from, "MMM dd, yyyy")} - ${format(filters.date.to, "MMM dd, yyyy")}`
                    ) : (
                      format(filters.date.from, "MMM dd, yyyy")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </DatePicker>
            </div>
          </div>
        )}

        <ScrollArea>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Exercises</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Loading workouts...</TableCell>
                </TableRow>
              ) : workouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No workouts found.</TableCell>
                </TableRow>
              ) : (
                workouts.map((workout) => (
                  <TableRow key={workout.id}>
                    <TableCell>{format(new Date(workout.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{workout.workout_type || 'Other'}</Badge>
                    </TableCell>
                    <TableCell>{workout.description || workout.notes || 'No description'}</TableCell>
                    <TableCell>
                      <ScrollArea className="max-h-24">
                        <div className="space-y-1">
                          {workout.workout_exercises?.map((exercise, index) => (
                            <div key={index} className="text-sm">
                              <Badge variant="secondary">{exercise.exercise_name}</Badge>
                              {exercise.sets && exercise.reps && (
                                <div className="text-xs text-gray-500">
                                  {exercise.sets} sets x {exercise.reps} reps
                                  {exercise.weight && ` at ${exercise.weight} lbs`}
                                </div>
                              )}
                            </div>
                          )) || <span className="text-gray-500">No exercises</span>}
                        </div>
                      </ScrollArea>
                    </TableCell>
                    <TableCell>{workout.duration ? `${workout.duration} min` : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleView(workout.id)}
                        >
                          View Details
                        </Button>
                        {onDelete && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDelete(workout.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default WorkoutTable;
