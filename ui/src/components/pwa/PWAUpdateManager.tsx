
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
  const lastNotificationTimestamp = useRef<number>(0);
  const componentMounted = useRef(false);
  const NOTIFICATION_DEBOUNCE = 5000; // 5 seconds debounce

  useEffect(() => {
    // Reset notification state on component mount
    if (!componentMounted.current) {
      updateNotificationShown.current = false;
      isUpdatingRef.current = false;
      currentNotificationId.current = null;
      lastNotificationTimestamp.current = 0;
      componentMounted.current = true;
      console.log('🎯 PWAUpdateManager initialized');
    }
  }, []);

  useEffect(() => {
    // DISABLED: Auto-update notifications to prevent annoying popups
    return; // Exit early to disable all update notifications

    const now = Date.now();

    // Prevent showing notification if we're already updating or recently showed one
    if (isUpdatingRef.current ||
        updateNotificationShown.current ||
        (now - lastNotificationTimestamp.current) < NOTIFICATION_DEBOUNCE) {
      return;
    }

    // All updates are now treated as force updates
    if (shouldForceUpdate || updateAvailable) {
      console.log('🚨 Update detected by PWAUpdateManager:', {
        shouldForceUpdate,
        updateAvailable,
        timestamp: now
      });
      
      // Prevent duplicate notifications
      if (currentNotificationId.current) {
        toast.dismiss(currentNotificationId.current);
      }

      // Create unique notification ID
      const notificationId = `update-${now}`;
      
      // Mark that we've shown the notification
      updateNotificationShown.current = true;
      isUpdatingRef.current = true;
      currentNotificationId.current = notificationId;
      lastNotificationTimestamp.current = now;

      // Show mandatory update dialog
      toast.error('🚨 App Update Required', {
        id: notificationId,
        description: 'A new version is available and must be installed now.',
        duration: Infinity,
        action: {
          label: 'Update Now',
          onClick: async () => {
            try {
              console.log('👆 User clicked Update Now');
              toast.dismiss(notificationId);
              currentNotificationId.current = null;
              
              if (shouldForceUpdate) {
                await executeForceUpdate();
              } else {
                await applyUpdate();
              }
            } catch (error) {
              console.error('❌ Update failed:', error);
              // Reset flags on error so user can retry
              updateNotificationShown.current = false;
              isUpdatingRef.current = false;
              currentNotificationId.current = null;
              lastNotificationTimestamp.current = 0;
            }
          },
        },
      });

      // Auto-execute after 15 seconds if user doesn't click
      setTimeout(async () => {
        if (currentNotificationId.current === notificationId) {
          try {
            console.log('⏰ Auto-executing update after timeout');
            toast.dismiss(notificationId);
            currentNotificationId.current = null;
            
            if (shouldForceUpdate) {
              await executeForceUpdate();
            } else {
              await applyUpdate();
            }
          } catch (error) {
            console.error('❌ Auto-update failed:', error);
            // Reset flags on error
            updateNotificationShown.current = false;
            isUpdatingRef.current = false;
            currentNotificationId.current = null;
            lastNotificationTimestamp.current = 0;
          }
        }
      }, 15000);
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
        lastNotificationTimestamp.current = 0;
      }
    }
  }, [isUpdating]);

  useEffect(() => {
    if (isCheckingVersion) {
      console.log('🔍 Checking for server version updates...');
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
      lastNotificationTimestamp.current = 0;
      componentMounted.current = false;
    };
  }, []);

  // No UI rendered - this component only handles background update logic
  return null;
};

export default PWAUpdateManager;
