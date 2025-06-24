
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
    // Handle force updates with highest priority
    if (shouldForceUpdate) {
      console.log('Force update detected by PWAUpdateManager');
      return; // Force update hook handles the UI
    }

    // Show non-blocking notification when update is available
    if (updateAvailable) {
      toast.info('🎉 App update available!', {
        description: 'A new version is ready to install. Look for the update icon in the sidebar header.',
        duration: 8000,
        id: 'pwa-update',
        action: {
          label: 'Update Now',
          onClick: () => {
            applyUpdate();
            toast.dismiss('pwa-update');
          },
        },
      });
    }
  }, [updateAvailable, shouldForceUpdate, applyUpdate]);

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
