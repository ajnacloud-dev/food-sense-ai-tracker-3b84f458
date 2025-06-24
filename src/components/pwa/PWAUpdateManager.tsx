
import { useEffect, useRef } from 'react';
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

  const updateNotificationShown = useRef(false);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    // Prevent showing notification if we're already updating or if notification was already shown
    if (isUpdatingRef.current || updateNotificationShown.current) {
      return;
    }

    // All updates are now treated as force updates
    if (shouldForceUpdate || updateAvailable) {
      console.log('Force update or update available detected by PWAUpdateManager');
      
      // Mark that we've shown the notification
      updateNotificationShown.current = true;
      isUpdatingRef.current = true;

      // Show mandatory update dialog for all updates
      toast.error('🚨 App Update Required', {
        id: 'force-update',
        description: 'A new version is available and must be installed now.',
        duration: Infinity,
        action: {
          label: 'Update Now',
          onClick: async () => {
            try {
              if (shouldForceUpdate) {
                await executeForceUpdate();
              } else {
                await applyUpdate();
              }
              toast.dismiss('force-update');
            } catch (error) {
              console.error('Update failed:', error);
              // Reset flags on error so user can retry
              updateNotificationShown.current = false;
              isUpdatingRef.current = false;
            }
          },
        },
      });

      // Auto-execute after 8 seconds if user doesn't click
      setTimeout(async () => {
        try {
          if (shouldForceUpdate) {
            await executeForceUpdate();
          } else {
            await applyUpdate();
          }
          toast.dismiss('force-update');
        } catch (error) {
          console.error('Auto-update failed:', error);
          // Reset flags on error
          updateNotificationShown.current = false;
          isUpdatingRef.current = false;
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
      // Reset the notification flag when update is complete
      if (isUpdatingRef.current) {
        updateNotificationShown.current = false;
        isUpdatingRef.current = false;
      }
    }
  }, [isUpdating]);

  useEffect(() => {
    if (isCheckingVersion) {
      console.log('Checking for server version updates...');
    }
  }, [isCheckingVersion]);

  // Reset flags when component unmounts
  useEffect(() => {
    return () => {
      updateNotificationShown.current = false;
      isUpdatingRef.current = false;
    };
  }, []);

  // No UI rendered - this component only handles background update logic
  return null;
};

export default PWAUpdateManager;
