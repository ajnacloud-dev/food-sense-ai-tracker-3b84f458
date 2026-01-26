
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Shield, ShieldCheck } from "lucide-react";
import { backendApi } from "@/lib/api/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type PermissionCategory = Database['public']['Enums']['permission_category'];

interface BulkPermissionActionsProps {
  caretakerId: string;
  caretakerName: string;
  categories: Array<{
    key: PermissionCategory;
    label: string;
  }>;
  currentPermissions: Record<string, boolean>;
  onPermissionsUpdated: () => void;
}

const BulkPermissionActions = ({ 
  caretakerId, 
  caretakerName, 
  categories, 
  currentPermissions,
  onPermissionsUpdated 
}: BulkPermissionActionsProps) => {
  const grantedCount = categories.filter(cat => currentPermissions[cat.key]).length;
  const totalCount = categories.length;

  const handleGrantAll = async () => {
    try {
      const { data: { user } } = await backendApi.auth.getUser();
      if (!user) return;

      const permissionInserts = categories.map(category => ({
        participant_id: user.id,
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

      toast.success(`Granted all permissions to ${caretakerName}`);
      onPermissionsUpdated();
    } catch (error) {
      console.error('Error granting all permissions:', error);
      toast.error('Failed to grant all permissions');
    }
  };

  const handleRevokeAll = async () => {
    try {
      const { data: { user } } = await backendApi.auth.getUser();
      if (!user) return;

      const { error } = await backendApi
        .from('participant_permissions')
        .update({
          is_granted: false,
          granted_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('participant_id', user.id)
        .eq('caretaker_id', caretakerId);

      if (error) throw error;

      toast.success(`Revoked all permissions from ${caretakerName}`);
      onPermissionsUpdated();
    } catch (error) {
      console.error('Error revoking all permissions:', error);
      toast.error('Failed to revoke all permissions');
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium">Permissions</span>
        </div>
        <Badge variant={grantedCount === totalCount ? "default" : grantedCount > 0 ? "secondary" : "outline"}>
          {grantedCount} of {totalCount} granted
        </Badge>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleGrantAll}
          disabled={grantedCount === totalCount}
          className="flex items-center gap-1"
        >
          <ShieldCheck className="h-3 w-3" />
          Grant All
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRevokeAll}
          disabled={grantedCount === 0}
          className="flex items-center gap-1"
        >
          <X className="h-3 w-3" />
          Revoke All
        </Button>
      </div>
    </div>
  );
};

export default BulkPermissionActions;
