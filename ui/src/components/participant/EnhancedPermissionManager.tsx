
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Users, Settings, Check, X, AlertCircle } from "lucide-react";
import { backendApi } from "@/lib/api/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSION_CATEGORIES, PermissionCategory } from "@/types/permissions";

interface CaretakerPermission {
  id: string;
  caretaker_id: string;
  caretaker_email: string;
  caretaker_name: string;
  caretaker_type: string;
  permissions: {
    category: PermissionCategory;
    is_granted: boolean;
    granted_at?: string;
  }[];
}

const EnhancedPermissionManager = () => {
  const { user } = useAuth();
  const [caretakers, setCaretakers] = useState<CaretakerPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCaretakersAndPermissions();
    }
  }, [user]);

  const fetchCaretakersAndPermissions = async () => {
    try {
      setLoading(true);

      // Get active caretaker relationships
      const { data: relationships, error: relationshipsError } = await backendApi
        .from('care_relationships')
        .select(`
          id,
          caretaker_id,
          caretaker_type,
          status
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active');

      if (relationshipsError) throw relationshipsError;

      if (!relationships || relationships.length === 0) {
        setCaretakers([]);
        return;
      }

      // Get caretaker user details
      const caretakerIds = relationships.map(r => r.caretaker_id);
      const { data: caretakerUsers, error: usersError } = await backendApi
        .from('users')
        .select('id, email, full_name')
        .in('id', caretakerIds);

      if (usersError) throw usersError;

      // Get permissions for each caretaker
      const { data: permissions, error: permissionsError } = await backendApi
        .from('participant_permissions')
        .select('*')
        .eq('participant_id', user?.id)
        .in('caretaker_id', caretakerIds);

      if (permissionsError) throw permissionsError;

      // Combine data
      const caretakersWithPermissions: CaretakerPermission[] = relationships.map(rel => {
        const caretakerUser = caretakerUsers?.find(u => u.id === rel.caretaker_id);
        const caretakerPermissions = permissions?.filter(p => p.caretaker_id === rel.caretaker_id) || [];
        
        // Create permission objects for all categories
        const allPermissions = PERMISSION_CATEGORIES.map(category => {
          const existingPerm = caretakerPermissions.find(p => p.category === category.key);
          return {
            category: category.key,
            is_granted: existingPerm?.is_granted || false,
            granted_at: existingPerm?.granted_at
          };
        });

        return {
          id: rel.id,
          caretaker_id: rel.caretaker_id,
          caretaker_email: caretakerUser?.email || 'Unknown',
          caretaker_name: caretakerUser?.full_name || 'Unknown',
          caretaker_type: rel.caretaker_type,
          permissions: allPermissions
        };
      });

      setCaretakers(caretakersWithPermissions);
    } catch (error) {
      console.error('Error fetching caretakers and permissions:', error);
      toast.error('Failed to load permission settings');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (caretakerId: string, category: PermissionCategory, currentlyGranted: boolean) => {
    try {
      setUpdating(`${caretakerId}-${category}`);

      if (currentlyGranted) {
        // Revoke permission
        const { error } = await backendApi
          .from('participant_permissions')
          .update({
            is_granted: false,
            updated_at: new Date().toISOString()
          })
          .eq('participant_id', user?.id)
          .eq('caretaker_id', caretakerId)
          .eq('category', category);

        if (error) throw error;
        toast.success('Permission revoked');
      } else {
        // Grant permission
        const { error } = await backendApi
          .from('participant_permissions')
          .upsert({
            participant_id: user?.id,
            caretaker_id: caretakerId,
            category: category,
            is_granted: true,
            granted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        toast.success('Permission granted');
      }

      // Refresh data
      await fetchCaretakersAndPermissions();
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error('Failed to update permission');
    } finally {
      setUpdating(null);
    }
  };

  const grantAllPermissions = async (caretakerId: string) => {
    try {
      setUpdating(`${caretakerId}-all`);

      const permissionInserts = PERMISSION_CATEGORIES.map(category => ({
        participant_id: user?.id,
        caretaker_id: caretakerId,
        category: category.key,
        is_granted: true,
        granted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await backendApi
        .from('participant_permissions')
        .upsert(permissionInserts);

      if (error) throw error;

      toast.success('All permissions granted');
      await fetchCaretakersAndPermissions();
    } catch (error) {
      console.error('Error granting all permissions:', error);
      toast.error('Failed to grant all permissions');
    } finally {
      setUpdating(null);
    }
  };

  const revokeAllPermissions = async (caretakerId: string) => {
    try {
      setUpdating(`${caretakerId}-all`);

      const { error } = await backendApi
        .from('participant_permissions')
        .update({
          is_granted: false,
          updated_at: new Date().toISOString()
        })
        .eq('participant_id', user?.id)
        .eq('caretaker_id', caretakerId);

      if (error) throw error;

      toast.success('All permissions revoked');
      await fetchCaretakersAndPermissions();
    } catch (error) {
      console.error('Error revoking all permissions:', error);
      toast.error('Failed to revoke all permissions');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your caretakers...</p>
        </CardContent>
      </Card>
    );
  }

  if (caretakers.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Caretakers Yet</h3>
          <p className="text-gray-600 mb-4">
            You haven't invited any caretakers to access your health data.
          </p>
          <Button>
            Invite Your First Caretaker
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {caretakers.map((caretaker) => {
        const grantedCount = caretaker.permissions.filter(p => p.is_granted).length;
        const allGranted = grantedCount === PERMISSION_CATEGORIES.length;
        
        return (
          <Card key={caretaker.id} className="border border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{caretaker.caretaker_name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    {caretaker.caretaker_email}
                    <Badge variant="outline" className="text-xs">
                      {caretaker.caretaker_type.replace('_', ' ')}
                    </Badge>
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge 
                    variant={grantedCount > 0 ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {grantedCount}/{PERMISSION_CATEGORIES.length} permissions
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => grantAllPermissions(caretaker.caretaker_id)}
                      disabled={allGranted || updating === `${caretaker.caretaker_id}-all`}
                      className="text-xs"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Grant All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeAllPermissions(caretaker.caretaker_id)}
                      disabled={grantedCount === 0 || updating === `${caretaker.caretaker_id}-all`}
                      className="text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Revoke All
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-4">
                {PERMISSION_CATEGORIES.map((category) => {
                  const permission = caretaker.permissions.find(p => p.category === category.key);
                  const isGranted = permission?.is_granted || false;
                  const isUpdating = updating === `${caretaker.caretaker_id}-${category.key}`;
                  
                  return (
                    <div key={category.key} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          isGranted ? category.bgColor : 'bg-gray-200'
                        }`} />
                        <div>
                          <Label className="font-medium">{category.label}</Label>
                          <p className="text-sm text-gray-600">{category.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isGranted && permission?.granted_at && (
                          <span className="text-xs text-gray-500">
                            Since {new Date(permission.granted_at).toLocaleDateString()}
                          </span>
                        )}
                        <Switch
                          checked={isGranted}
                          onCheckedChange={() => togglePermission(caretaker.caretaker_id, category.key, isGranted)}
                          disabled={isUpdating}
                          className={isGranted ? 'data-[state=checked]:bg-green-600' : ''}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default EnhancedPermissionManager;
