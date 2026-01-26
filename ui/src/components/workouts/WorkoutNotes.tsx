import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { WorkoutEntry } from "@/types/workout";

interface WorkoutNotesProps {
  workout: WorkoutEntry;
  editing: boolean;
  editedData: Partial<WorkoutEntry>;
  onEditedDataChange: (data: Partial<WorkoutEntry>) => void;
}

export const WorkoutNotes = ({ workout, editing, editedData, onEditedDataChange }: WorkoutNotesProps) => {
  const formatNotes = (notes: string) => {
    if (!notes) return 'No notes available';
    
    try {
      const parsed = JSON.parse(notes);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return notes;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent>
        {editing ? (
          <Textarea
            value={editedData.notes || ''}
            onChange={(e) => onEditedDataChange({ ...editedData, notes: e.target.value })}
            rows={10}
            placeholder="Add your workout notes here..."
            className="font-mono text-sm"
          />
        ) : (
          <div className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg border overflow-x-auto">
            <code>{formatNotes(workout.notes)}</code>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
