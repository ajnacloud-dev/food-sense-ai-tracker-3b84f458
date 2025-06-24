
import { useEffect } from 'react';
import { useEnhancedPWAUpdate } from '@/hooks/useEnhancedPWAUpdate';
import { useForceUpdate } from '@/hooks/useForceUpdate';
import { toast } from 'sonner';

const PWAUpdateManager = () => {
  const { 
    updateAvailable, 
    isUpdating, 
    applyUpdate
  } = useEnhancedPWAUpdate();

  const {
    shouldForceUpdate,
    isCheckingVersion,
    executeForceUpdate
  } = useForceUpdate();

  useEffect(() => {
    // All updates are now treated as force updates
    if (shouldForceUpdate || updateAvailable) {
      console.log('Force update or update available detected by PWAUpdateManager');
      
      // Show mandatory update dialog for all updates
      toast.error('🚨 App Update Required', {
        id: 'force-update',
        description: 'A new version is available and must be installed now.',
        duration: Infinity,
        action: {
          label: 'Update Now',
          onClick: () => {
            if (shouldForceUpdate) {
              executeForceUpdate();
            } else {
              applyUpdate();
            }
            toast.dismiss('force-update');
          },
        },
      });

      // Auto-execute after 8 seconds if user doesn't click
      setTimeout(() => {
        if (shouldForceUpdate) {
          executeForceUpdate();
        } else {
          applyUpdate();
        }
      }, 8000);
    }
  }, [updateAvailable, shouldForceUpdate, applyUpdate, executeForceUpdate]);

  useEffect(() => {
    if (isUpdating) {
      toast.loading('Installing update...', {
        id: 'pwa-updating',
        description: 'Please wait while we install the latest version.',
      });
    } else {
      toast.dismiss('pwa-updating');
    }
  }, [isUpdating]);

  useEffect(() => {
    if (isCheckingVersion) {
      console.log('Checking for server version updates...');
    }
  }, [isCheckingVersion]);

  // No UI rendered - this component only handles background update logic
  return null;
};

export default PWAUpdateManager;
