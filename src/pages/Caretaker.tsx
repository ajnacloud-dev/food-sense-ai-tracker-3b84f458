
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { CaretakerDashboard } from "@/components/caretaker/CaretakerDashboard";
import { JoinWithCode } from "@/components/caretaker/JoinWithCode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, UserPlus, Users } from "lucide-react";

const Caretaker = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [hasCaretakerRelationships, setHasCaretakerRelationships] = useState(false);

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

      // Check if user has any caretaker relationships
      const { data: relationships } = await supabase
        .from('care_relationships')
        .select('id')
        .eq('caretaker_id', user.id)
        .eq('status', 'active');

      setHasCaretakerRelationships(relationships && relationships.length > 0);
    } catch (error) {
      console.error('Error checking user and relationships:', error);
      toast.error("Failed to load caretaker data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading caretaker dashboard...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Care Management</h1>
            <p className="text-gray-600">Manage your caretaker relationships and monitor participant health data</p>
          </div>
        </div>

        {!hasCaretakerRelationships ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-6 w-6 text-red-500" />
                  Welcome to Care Management
                </CardTitle>
                <CardDescription>
                  Get started by joining as a caretaker or inviting others to monitor your health data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  You don't have any active caretaker relationships yet. You can either:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 mb-6">
                  <li>Join as a caretaker using an invitation code from someone</li>
                  <li>Invite others to monitor your health data by creating invitation codes</li>
                </ul>
              </CardContent>
            </Card>

            <Tabs defaultValue="join" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="join" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Join as Caretaker
                </TabsTrigger>
                <TabsTrigger value="invite" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Invite Caretakers
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="join" className="space-y-4">
                <JoinWithCode />
              </TabsContent>
              
              <TabsContent value="invite" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Invite Caretakers
                    </CardTitle>
                    <CardDescription>
                      Create invitation codes for people to monitor your health data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Go to the Invite Caretakers page to create and manage invitation codes for your health data.
                    </p>
                    <button 
                      onClick={() => navigate("/invite-caretakers")}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Manage Invitations
                    </button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="space-y-6">
            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="join">Join with Code</TabsTrigger>
                <TabsTrigger value="invite">Invite Others</TabsTrigger>
              </TabsList>
              
              <TabsContent value="dashboard">
                <CaretakerDashboard />
              </TabsContent>
              
              <TabsContent value="join" className="space-y-4">
                <JoinWithCode />
              </TabsContent>
              
              <TabsContent value="invite" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Manage Your Invitations</CardTitle>
                    <CardDescription>
                      Create and manage invitation codes for people to monitor your health data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <button 
                      onClick={() => navigate("/invite-caretakers")}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Manage Invitations
                    </button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};

export default Caretaker;
