
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RoleBasedLayout from "@/components/layout/RoleBasedLayout";
import CaretakerDashboard from "@/components/caretaker/CaretakerDashboard";
import { JoinWithCode } from "@/components/caretaker/JoinWithCode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, UserPlus, ArrowLeft } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";

const Caretaker = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('');
  const { hasCaretakerRelationships, isParticipant, refreshRoles } = useRole();

  useEffect(() => {
    checkUserAndRelationships();
  }, []);

  const checkUserAndRelationships = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        navigate("/auth");
        return;
      }

      setUser(user);

      // Refresh roles to get latest data
      await refreshRoles();

      // Check if user has any caretaker relationships
      const { data: relationships } = await supabase
        .from('care_relationships')
        .select('id, user_id')
        .eq('caretaker_id', user.id)
        .eq('status', 'active');

      // Set first participant as selected by default
      if (relationships && relationships.length > 0) {
        setSelectedParticipantId(relationships[0].user_id);
      }
    } catch (error) {
      console.error('Error checking user and relationships:', error);
      toast.error("Failed to load caretaker data");
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
            <p>Loading caretaker dashboard...</p>
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
        {!hasCaretakerRelationships ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome to Care Management</h1>
                <p className="text-gray-600">Join as a caretaker to start monitoring participant health data</p>
              </div>
              {isParticipant && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to My Dashboard
                </Button>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-6 w-6 text-red-500" />
                  Get Started as a Caretaker
                </CardTitle>
                <CardDescription>
                  You need an invitation code from a participant to start monitoring their health data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <JoinWithCode />
              </CardContent>
            </Card>

            {isParticipant && (
              <Card>
                <CardHeader>
                  <CardTitle>Already a Participant?</CardTitle>
                  <CardDescription>
                    You can invite others to be your caretakers from your participant dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => navigate('/participant/invitations')}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Invite Caretakers
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <CaretakerDashboard />
        )}
      </div>
    </RoleBasedLayout>
  );
};

export default Caretaker;
