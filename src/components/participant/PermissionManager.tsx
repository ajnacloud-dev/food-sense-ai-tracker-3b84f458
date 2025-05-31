import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Utensils, Receipt, Dumbbell, Target, Heart, Check, X, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch caretaker relationships
      const { data: relationshipsData, error: relationshipsError } = await supabase
        .from('care_relationships')
        .select(`
          id,
          caretaker_id,
          caretaker_type,
          status,
          caretaker:users!care_relationships_caretaker_id_fkey (full_name, email)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (relationshipsError) {
        console.error('Error fetching relationships:', relationshipsError);
        toast.error('Failed to load caretaker relationships');
        return;
      }

      // Process relationships data with proper type handling
      const processedRelationships: CaretakerRelationship[] = [];
      
      if (relationshipsData) {
        for (const rel of relationshipsData) {
          // Type guard to ensure caretaker data exists and is properly structured
          if (rel.caretaker && typeof rel.caretaker === 'object' && !Array.isArray(rel.caretaker)) {
            const caretaker = rel.caretaker as any;
            if (caretaker.full_name !== undefined && caretaker.email) {
              processedRelationships.push({
                id: rel.id,
                caretaker_id: rel.caretaker_id,
                caretaker_type: rel.caretaker_type,
                status: rel.status,
                caretaker: {
                  full_name: caretaker.full_name,
                  email: caretaker.email
                }
              });
            }
          }
        }
      }

      setRelationships(processedRelationships);

      // Fetch current permissions
      const { data: permissionsData } = await supabase
        .from('participant_permissions')
        .select('*')
        .eq('participant_id', user.id);

      setPermissions(permissionsData || []);

      // Fetch pending permission requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('permission_requests')
        .select(`
          *,
          caretaker:users!permission_requests_caretaker_id_fkey (full_name, email)
        `)
        .eq('participant_id', user.id)
        .eq('status', 'pending');

      if (requestsError) {
        console.error('Error fetching permission requests:', requestsError);
        toast.error('Failed to load permission requests');
        return;
      }

      // Process requests data with proper type handling
      const processedRequests: PermissionRequest[] = [];
      
      if (requestsData) {
        for (const request of requestsData) {
          // Type guard to ensure caretaker data exists and is properly structured
          if (request.caretaker && typeof request.caretaker === 'object' && !Array.isArray(request.caretaker)) {
            const caretaker = request.caretaker as any;
            if (caretaker.full_name !== undefined && caretaker.email) {
              processedRequests.push({
                id: request.id,
                caretaker_id: request.caretaker_id,
                category: request.category,
                status: request.status,
                message: request.message,
                created_at: request.created_at,
                caretaker: {
                  full_name: caretaker.full_name,
                  email: caretaker.email
                }
              });
            }
          }
        }
      }
      
      setPendingRequests(processedRequests);

    } catch (error) {
      console.error('Error fetching permission data:', error);
      toast.error('Failed to load permission data');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (caretakerId: string, category: PermissionCategory, currentlyGranted: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (currentlyGranted) {
        // Revoke permission
        const { error } = await supabase
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
        const { error } = await supabase
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update the request status
      const { error: requestError } = await supabase
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
          await supabase
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

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading permissions...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Privacy & Permissions</h1>
        <p className="text-gray-600">Manage what your caretakers can access</p>
      </div>

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
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <p>No active caretaker relationships yet.</p>
              <p className="text-sm">When caretakers invite you, you'll be able to manage their permissions here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionManager;
