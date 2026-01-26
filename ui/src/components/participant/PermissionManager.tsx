import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Utensils, Receipt, Dumbbell, Target, Heart, Check, X, Clock, ArrowRight } from "lucide-react";
import { backendApi } from "@/lib/api/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import BulkPermissionActions from "./BulkPermissionActions";
import type { Database } from "@/integrations/supabase/types";

type PermissionCategory = Database['public']['Enums']['permission_category'];

interface CaretakerUser {
  full_name: string | null;
  email: string;
}

interface CaretakerRelationship {
  id: string;
  caretaker_id: string;
  caretaker_type: string;
  status: string;
  caretaker: CaretakerUser;
}

interface Permission {
  id: string;
  caretaker_id: string;
  category: PermissionCategory;
  is_granted: boolean;
  requested_at: string;
  granted_at?: string;
}

interface PermissionRequest {
  id: string;
  caretaker_id: string;
  category: PermissionCategory;
  status: string;
  message?: string;
  created_at: string;
  caretaker: CaretakerUser;
}

const PermissionManager = () => {
  const navigate = useNavigate();
  const [relationships, setRelationships] = useState<CaretakerRelationship[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PermissionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { key: 'food_entries' as PermissionCategory, label: 'Food Entries', icon: Utensils, color: 'text-green-600' },
    { key: 'receipts' as PermissionCategory, label: 'Receipts', icon: Receipt, color: 'text-blue-600' },
    { key: 'workouts' as PermissionCategory, label: 'Workouts', icon: Dumbbell, color: 'text-purple-600' },
    { key: 'goals' as PermissionCategory, label: 'Goals', icon: Target, color: 'text-orange-600' },
    { key: 'health_metrics' as PermissionCategory, label: 'Health Metrics', icon: Heart, color: 'text-red-600' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await backendApi.auth.getUser();
      if (!user) return;

      console.log('Fetching data for user:', user.id);

      // Fetch caretaker relationships with more detailed logging
      const { data: relationshipsData, error: relationshipsError } = await backendApi
        .from('care_relationships')
        .select('id, caretaker_id, caretaker_type, status')
        .eq('user_id', user.id);

      console.log('Relationships query result:', { relationshipsData, relationshipsError });

      if (relationshipsError) {
        console.error('Error fetching relationships:', relationshipsError);
        toast.error('Failed to load caretaker relationships');
        return;
      }

      // Process relationships and fetch caretaker details
      const processedRelationships: CaretakerRelationship[] = [];
      
      if (relationshipsData && relationshipsData.length > 0) {
        for (const rel of relationshipsData) {
          const { data: caretakerData, error: caretakerError } = await backendApi
            .from('users')
            .select('full_name, email')
            .eq('id', rel.caretaker_id)
            .single();

          if (caretakerError) {
            console.error('Error fetching caretaker data:', caretakerError);
            continue;
          }

          if (caretakerData) {
            processedRelationships.push({
              id: rel.id,
              caretaker_id: rel.caretaker_id,
              caretaker_type: rel.caretaker_type,
              status: rel.status,
              caretaker: {
                full_name: caretakerData.full_name,
                email: caretakerData.email
              }
            });
          }
        }
      }

      console.log('Processed relationships:', processedRelationships);
      setRelationships(processedRelationships);

      // Fetch current permissions
      const { data: permissionsData, error: permissionsError } = await backendApi
        .from('participant_permissions')
        .select('*')
        .eq('participant_id', user.id);

      console.log('Permissions query result:', { permissionsData, permissionsError });

      if (permissionsError) {
        console.error('Error fetching permissions:', permissionsError);
      } else {
        setPermissions(permissionsData || []);
      }

      // Fetch pending permission requests
      const { data: requestsData, error: requestsError } = await backendApi
        .from('permission_requests')
        .select('*')
        .eq('participant_id', user.id)
        .eq('status', 'pending');

      console.log('Permission requests query result:', { requestsData, requestsError });

      if (requestsError) {
        console.error('Error fetching permission requests:', requestsError);
      } else {
        // Process requests with caretaker details
        const processedRequests: PermissionRequest[] = [];
        
        if (requestsData && requestsData.length > 0) {
          for (const request of requestsData) {
            const { data: caretakerData, error: caretakerError } = await backendApi
              .from('users')
              .select('full_name, email')
              .eq('id', request.caretaker_id)
              .single();

            if (caretakerError) {
              console.error('Error fetching caretaker data for request:', caretakerError);
              continue;
            }

            if (caretakerData) {
              processedRequests.push({
                id: request.id,
                caretaker_id: request.caretaker_id,
                category: request.category,
                status: request.status,
                message: request.message,
                created_at: request.created_at,
                caretaker: {
                  full_name: caretakerData.full_name,
                  email: caretakerData.email
                }
              });
            }
          }
        }
        
        setPendingRequests(processedRequests);
      }

    } catch (error) {
      console.error('Error fetching permission data:', error);
      toast.error('Failed to load permission data');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (caretakerId: string, category: PermissionCategory, currentlyGranted: boolean) => {
    try {
      const { data: { user } } = await backendApi.auth.getUser();
      if (!user) return;

      if (currentlyGranted) {
        // Revoke permission
        const { error } = await backendApi
          .from('participant_permissions')
          .update({
            is_granted: false,
            granted_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('participant_id', user.id)
          .eq('caretaker_id', caretakerId)
          .eq('category', category);

        if (error) throw error;
        toast.success(`Access revoked for ${category.replace('_', ' ')}`);
      } else {
        // Grant permission - either update existing or create new
        const { error } = await backendApi
          .from('participant_permissions')
          .upsert({
            participant_id: user.id,
            caretaker_id: caretakerId,
            category: category,
            is_granted: true,
            granted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        toast.success(`Access granted for ${category.replace('_', ' ')}`);
      }

      fetchData();
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error('Failed to update permission');
    }
  };

  const respondToRequest = async (requestId: string, status: 'approved' | 'denied') => {
    try {
      const { data: { user } } = await backendApi.auth.getUser();
      if (!user) return;

      // Update the request status
      const { error: requestError } = await backendApi
        .from('permission_requests')
        .update({
          status,
          responded_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

      if (status === 'approved') {
        // Find the request to get caretaker and category info
        const request = pendingRequests.find(r => r.id === requestId);
        if (request) {
          // Grant the permission
          await backendApi
            .from('participant_permissions')
            .upsert({
              participant_id: user.id,
              caretaker_id: request.caretaker_id,
              category: request.category,
              is_granted: true,
              granted_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }
      }

      toast.success(`Request ${status} successfully`);
      fetchData();
    } catch (error) {
      console.error('Error responding to request:', error);
      toast.error('Failed to respond to request');
    }
  };

  const getPermissionStatus = (caretakerId: string, category: PermissionCategory) => {
    const permission = permissions.find(p => 
      p.caretaker_id === caretakerId && p.category === category
    );
    return permission?.is_granted || false;
  };

  const getCaretakerPermissions = (caretakerId: string): Record<string, boolean> => {
    const caretakerPermissions: Record<string, boolean> = {};
    categories.forEach(category => {
      caretakerPermissions[category.key] = getPermissionStatus(caretakerId, category.key);
    });
    return caretakerPermissions;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading permissions...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      {relationships.length === 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">No Caretakers Yet</CardTitle>
            <CardDescription className="text-blue-700">
              You haven't invited any caretakers yet. Get started by creating invitation codes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/participant/invitations')}
              className="flex items-center gap-2"
            >
              Invite Caretakers
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Access Requests
            </CardTitle>
            <CardDescription>
              Review and respond to caretaker access requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.map((request) => {
                const category = categories.find(c => c.key === request.category);
                const Icon = category?.icon || Target;
                return (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Icon className={`h-5 w-5 ${category?.color || 'text-gray-600'}`} />
                      <div>
                        <div className="font-medium">
                          {request.caretaker.full_name || 'Unknown User'} wants access to {category?.label || request.category}
                        </div>
                        <div className="text-sm text-gray-500">{request.caretaker.email}</div>
                        {request.message && (
                          <div className="text-sm text-gray-600 mt-1">{request.message}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => respondToRequest(request.id, 'approved')}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => respondToRequest(request.id, 'denied')}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Deny
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Caretaker Permissions</CardTitle>
          <CardDescription>
            Control what data each caretaker can access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {relationships.length > 0 ? (
            <div className="space-y-6">
              {relationships.map((relationship) => (
                <div key={relationship.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-medium">{relationship.caretaker.full_name || 'Unknown User'}</div>
                      <div className="text-sm text-gray-500">{relationship.caretaker.email}</div>
                      <Badge variant="outline" className="mt-1">
                        {relationship.caretaker_type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Bulk Actions */}
                  <BulkPermissionActions
                    caretakerId={relationship.caretaker_id}
                    caretakerName={relationship.caretaker.full_name || 'Unknown User'}
                    categories={categories}
                    currentPermissions={getCaretakerPermissions(relationship.caretaker_id)}
                    onPermissionsUpdated={fetchData}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {categories.map((category) => {
                      const Icon = category.icon;
                      const isGranted = getPermissionStatus(relationship.caretaker_id, category.key);
                      
                      return (
                        <div key={category.key} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center space-x-3">
                            <Icon className={`h-4 w-4 ${category.color}`} />
                            <span className="text-sm font-medium">{category.label}</span>
                          </div>
                          <Switch
                            checked={isGranted}
                            onCheckedChange={() => togglePermission(
                              relationship.caretaker_id, 
                              category.key, 
                              isGranted
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">No active caretaker relationships yet.</p>
              <p className="text-sm mb-4">Invite caretakers to start managing their permissions.</p>
              <Button 
                variant="outline" 
                onClick={() => navigate('/participant/invitations')}
                className="flex items-center gap-2"
              >
                Invite Caretakers
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionManager;
