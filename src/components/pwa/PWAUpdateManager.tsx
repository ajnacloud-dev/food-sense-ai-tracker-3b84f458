
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
  const currentNotificationId = useRef<string | null>(null);
  const lastNotificationVersion = useRef<string | null>(null);

  useEffect(() => {
    // Reset notification state on component mount
    updateNotificationShown.current = false;
    isUpdatingRef.current = false;
    currentNotificationId.current = null;
    lastNotificationVersion.current = null;
    console.log('PWAUpdateManager initialized');
  }, []);

  useEffect(() => {
    // Prevent showing notification if we're already updating or if notification was already shown
    if (isUpdatingRef.current || updateNotificationShown.current) {
      return;
    }

    // All updates are now treated as force updates
    if (shouldForceUpdate || updateAvailable) {
      console.log('Force update or update available detected by PWAUpdateManager');
      
      // Create a unique identifier for this update notification
      const notificationId = `update-${Date.now()}`;
      
      // Dismiss any existing notification first
      if (currentNotificationId.current) {
        toast.dismiss(currentNotificationId.current);
      }

      // Prevent duplicate notifications
      if (lastNotificationVersion.current && 
          lastNotificationVersion.current === notificationId) {
        console.log('Preventing duplicate notification for same update');
        return;
      }

      // Mark that we've shown the notification
      updateNotificationShown.current = true;
      isUpdatingRef.current = true;
      currentNotificationId.current = notificationId;
      lastNotificationVersion.current = notificationId;

      // Show mandatory update dialog for all updates
      toast.error('🚨 App Update Required', {
        id: notificationId,
        description: 'A new version is available and must be installed now.',
        duration: Infinity,
        action: {
          label: 'Update Now',
          onClick: async () => {
            try {
              console.log('User clicked Update Now');
              toast.dismiss(notificationId);
              currentNotificationId.current = null;
              
              if (shouldForceUpdate) {
                await executeForceUpdate();
              } else {
                await applyUpdate();
              }
            } catch (error) {
              console.error('Update failed:', error);
              // Reset flags on error so user can retry
              updateNotificationShown.current = false;
              isUpdatingRef.current = false;
              currentNotificationId.current = null;
              lastNotificationVersion.current = null;
            }
          },
        },
      });

      // Auto-execute after 12 seconds if user doesn't click (longer delay)
      setTimeout(async () => {
        if (currentNotificationId.current === notificationId) {
          try {
            console.log('Auto-executing update after timeout');
            toast.dismiss(notificationId);
            currentNotificationId.current = null;
            
            if (shouldForceUpdate) {
              await executeForceUpdate();
            } else {
              await applyUpdate();
            }
          } catch (error) {
            console.error('Auto-update failed:', error);
            // Reset flags on error
            updateNotificationShown.current = false;
            isUpdatingRef.current = false;
            currentNotificationId.current = null;
            lastNotificationVersion.current = null;
          }
        }
      }, 12000);
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
      // Only reset notification flags if we're not in the middle of showing a notification
      if (isUpdatingRef.current && !currentNotificationId.current) {
        updateNotificationShown.current = false;
        isUpdatingRef.current = false;
        lastNotificationVersion.current = null;
      }
    }
  }, [isUpdating]);

  useEffect(() => {
    if (isCheckingVersion) {
      console.log('Checking for server version updates...');
    }
  }, [isCheckingVersion]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentNotificationId.current) {
        toast.dismiss(currentNotificationId.current);
      }
      updateNotificationShown.current = false;
      isUpdatingRef.current = false;
      currentNotificationId.current = null;
      lastNotificationVersion.current = null;
    };
  }, []);

  // No UI rendered - this component only handles background update logic
  return null;
};

export default PWAUpdateManager;
