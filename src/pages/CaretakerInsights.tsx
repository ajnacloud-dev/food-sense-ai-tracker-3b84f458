
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RoleBasedLayout from "@/components/layout/RoleBasedLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3 } from "lucide-react";

const CaretakerInsights = () => {
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
            <p>Loading participant insights...</p>
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
              <BarChart3 className="h-8 w-8 text-green-600" />
              Insights - {participantName}
            </h1>
            <p className="text-gray-600">Analyze participant's health trends and patterns</p>
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

        <Card>
          <CardHeader>
            <CardTitle>Health Analytics</CardTitle>
            <CardDescription>
              Comprehensive insights for {participantName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Advanced Analytics Coming Soon
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                We're working on comprehensive health insights including nutrition trends, 
                activity patterns, and personalized recommendations for {participantName}.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleBasedLayout>
  );
};

export default CaretakerInsights;
