
import { useState, useEffect, useCallback, useRef } from 'react';
import { pwaVersionService } from '@/services/pwaVersionService';
import { toast } from 'sonner';

interface ForceUpdateState {
  shouldForceUpdate: boolean;
  isCheckingVersion: boolean;
  lastVersionCheck: Date | null;
  currentVersion: string | null;
}

export const useForceUpdate = () => {
  const [state, setState] = useState<ForceUpdateState>({
    shouldForceUpdate: false,
    isCheckingVersion: false,
    lastVersionCheck: null,
    currentVersion: pwaVersionService.getCurrentVersion(),
  });

  const checkInProgress = useRef(false);
  const lastNotificationTime = useRef(0);
  const NOTIFICATION_COOLDOWN = 60000; // 1 minute cooldown between notifications

  const clearAllCaches = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log('Force clearing all caches:', cacheNames);
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('All caches force cleared');
      }
    } catch (error) {
      console.error('Error force clearing caches:', error);
    }
  };

  const executeForceUpdate = useCallback(async () => {
    console.log('Executing force update...');
    
    try {
      // Clear all caches aggressively
      await clearAllCaches();

      // Force service worker update
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.unregister();
          console.log('Service worker unregistered for force update');
        }
      }

      // Show final update message
      toast.success('Updating to latest version...', {
        description: 'The app will refresh now.',
        duration: 2000,
      });

      // Force hard refresh after brief delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Error during force update:', error);
      toast.error('Update failed. Please refresh manually.');
    }
  }, []);

  const checkForForceUpdate = useCallback(async () => {
    if (checkInProgress.current || state.isCheckingVersion) {
      return;
    }

    checkInProgress.current = true;
    setState(prev => ({ ...prev, isCheckingVersion: true }));

    try {
      const shouldUpdate = await pwaVersionService.shouldForceUpdate();
      
      setState(prev => ({
        ...prev,
        shouldForceUpdate: shouldUpdate,
        lastVersionCheck: new Date(),
        currentVersion: pwaVersionService.getCurrentVersion(),
      }));

      const now = Date.now();
      
      if (shouldUpdate && (now - lastNotificationTime.current) > NOTIFICATION_COOLDOWN) {
        console.log('Force update required');
        lastNotificationTime.current = now;
        
        // Don't show toast here - let PWAUpdateManager handle it
        // Just update the state
      }

    } catch (error) {
      console.error('Error checking for force update:', error);
    } finally {
      setState(prev => ({ ...prev, isCheckingVersion: false }));
      checkInProgress.current = false;
    }
  }, [state.isCheckingVersion]);

  useEffect(() => {
    // Initial check after 5 seconds
    const initialTimeout = setTimeout(() => {
      checkForForceUpdate();
    }, 5000);

    // Check every 60 seconds (reduced from 30 seconds to prevent spam)
    const interval = setInterval(() => {
      if (navigator.onLine && !checkInProgress.current) {
        checkForForceUpdate();
      }
    }, 60000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      checkInProgress.current = false;
    };
  }, [checkForForceUpdate]);

  return {
    ...state,
    checkForForceUpdate,
    executeForceUpdate,
  };
};
