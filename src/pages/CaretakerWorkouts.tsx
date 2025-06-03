
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RoleBasedLayout from "@/components/layout/RoleBasedLayout";
import WorkoutTable from "@/components/workouts/WorkoutTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Dumbbell } from "lucide-react";

const CaretakerWorkouts = () => {
  const navigate = useNavigate();
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('');
  const [participantName, setParticipantName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        navigate("/auth");
        return;
      }

      // Get first active participant
      const { data: relationships } = await supabase
        .from('care_relationships')
        .select(`
          user_id,
          users!care_relationships_user_id_fkey (
            full_name
          )
        `)
        .eq('caretaker_id', user.id)
        .eq('status', 'active')
        .limit(1);

      if (relationships && relationships.length > 0) {
        const participantId = relationships[0].user_id;
        const userData = relationships[0].users as any;
        setSelectedParticipantId(participantId);
        setParticipantName(userData?.full_name || 'Participant');
      } else {
        toast.error("No active participants found");
        navigate("/caretaker");
      }
    } catch (error) {
      console.error('Error checking access:', error);
      toast.error("Failed to load participant data");
      navigate("/caretaker");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <RoleBasedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading participant workouts...</p>
          </div>
        </div>
      </RoleBasedLayout>
    );
  }

  return (
    <RoleBasedLayout 
      selectedParticipantId={selectedParticipantId}
      onParticipantChange={setSelectedParticipantId}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Dumbbell className="h-8 w-8 text-purple-600" />
              Workouts - {participantName}
            </h1>
            <p className="text-gray-600">Monitor participant's fitness activities and progress</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/caretaker')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {selectedParticipantId ? (
          <WorkoutTable participantId={selectedParticipantId} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Participant Selected</CardTitle>
              <CardDescription>
                Please select a participant from the sidebar to view their workouts.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </RoleBasedLayout>
  );
};

export default CaretakerWorkouts;
