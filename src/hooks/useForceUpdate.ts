
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
  const NOTIFICATION_COOLDOWN = 300000; // 5 minutes cooldown between notifications

  const clearAllCaches = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log('🧹 Force clearing all caches:', cacheNames);
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('✅ All caches force cleared');
      }
    } catch (error) {
      console.error('Error force clearing caches:', error);
    }
  };

  const executeForceUpdate = useCallback(async () => {
    console.log('🚀 Executing force update...');
    
    try {
      // Get the target version before starting update
      const serverInfo = await pwaVersionService.checkServerVersion();
      if (serverInfo) {
        console.log('🎯 Starting update process to version:', serverInfo.version);
        
        // CRITICAL: Start the update process which stores the target version
        pwaVersionService.startUpdate(serverInfo.version);
        
        console.log('📝 Current version before update:', pwaVersionService.getCurrentVersion());
        console.log('🎯 Target version for update:', serverInfo.version);
      }

      // Clear all caches aggressively
      await clearAllCaches();

      // Force service worker update
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.unregister();
          console.log('🔄 Service worker unregistered for force update');
        }
      }

      // Show final update message
      toast.success('Updating to latest version...', {
        description: 'The app will refresh now.',
        duration: 2000,
      });

      // Force hard refresh after brief delay
      setTimeout(() => {
        console.log('🔄 Initiating page refresh for update');
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('❌ Error during force update:', error);
      toast.error('Update failed. Please refresh manually.');
      // Reset update state on error
      pwaVersionService.resetUpdateState();
    }
  }, []);

  const checkForForceUpdate = useCallback(async () => {
    if (checkInProgress.current || state.isCheckingVersion || pwaVersionService.isUpdateInProgress()) {
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
        console.log('🚨 Force update required, showing notification');
        lastNotificationTime.current = now;
      }

    } catch (error) {
      console.error('❌ Error checking for force update:', error);
    } finally {
      setState(prev => ({ ...prev, isCheckingVersion: false }));
      checkInProgress.current = false;
    }
  }, [state.isCheckingVersion]);

  useEffect(() => {
    // Reset update state on component mount (after page refresh)
    pwaVersionService.resetUpdateState();

    // Debug: Log current status
    console.log('📊 PWA Update Status:', pwaVersionService.getUpdateStatus());

    // Initial check after 10 seconds (longer delay to allow for proper initialization)
    const initialTimeout = setTimeout(() => {
      checkForForceUpdate();
    }, 10000);

    // Check every 120 seconds (longer interval to reduce server load)
    const interval = setInterval(() => {
      if (navigator.onLine && !checkInProgress.current && !pwaVersionService.isUpdateInProgress()) {
        checkForForceUpdate();
      }
    }, 120000);

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
