
export type WorkoutType = 'cardio' | 'strength' | 'flexibility' | 'sports' | 'other';

export interface WorkoutEntry {
  id: string;
  workout_type: WorkoutType;
  duration: number;
  calories_burned: number;
  notes: string;
  created_at: string;
}
