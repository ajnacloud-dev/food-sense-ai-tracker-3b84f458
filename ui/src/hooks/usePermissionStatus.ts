
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface PermissionStatus {
  hasPermission: (category: string) => boolean;
  missingPermissions: string[];
  loading: boolean;
  error: string | null;
}

export const usePermissionStatus = (participantId: string | null): PermissionStatus => {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!participantId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Mock Auth for now (Amplify migration later)
        const user = { id: "test-user-id" };

        console.log('usePermissionStatus: Checking permissions for participant:', participantId);

        const { data: allPermissions, error: permissionsError } = await api.from('participant_permissions').select();

        let permissionsData: any[] = [];
        if (allPermissions) {
          permissionsData = allPermissions.filter((p: any) =>
            p.participant_id === participantId &&
            p.caretaker_id === user.id &&
            p.is_granted === true
          );
        }

        if (permissionsError) {
          console.error('usePermissionStatus: Error fetching permissions:', permissionsError);
          setError('Failed to load permissions');
          return;
        }

        console.log('usePermissionStatus: Found permissions:', permissionsData);

        const permissionMap: Record<string, boolean> = {};
        permissionsData?.forEach(permission => {
          permissionMap[permission.category] = permission.is_granted;
        });

        setPermissions(permissionMap);
      } catch (error) {
        console.error('usePermissionStatus: Error:', error);
        setError('Failed to check permissions');
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [participantId]);

  const hasPermission = (category: string): boolean => {
    return permissions[category] === true;
  };

  const allCategories = ['food_entries', 'receipts', 'workouts'];
  const missingPermissions = allCategories.filter(category => !hasPermission(category));

  return {
    hasPermission,
    missingPermissions,
    loading,
    error
  };
};
