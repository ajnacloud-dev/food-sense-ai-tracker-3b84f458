
import { useState, useEffect, useCallback } from 'react';
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
    if (state.isCheckingVersion) return;

    setState(prev => ({ ...prev, isCheckingVersion: true }));

    try {
      const shouldUpdate = await pwaVersionService.shouldForceUpdate();
      
      setState(prev => ({
        ...prev,
        shouldForceUpdate: shouldUpdate,
        lastVersionCheck: new Date(),
        currentVersion: pwaVersionService.getCurrentVersion(),
      }));

      if (shouldUpdate) {
        console.log('Force update required');
        
        // Show mandatory update dialog
        toast.error('🚨 Critical Update Required', {
          id: 'force-update',
          description: 'A new version is available and must be installed now.',
          duration: Infinity,
          action: {
            label: 'Update Now',
            onClick: executeForceUpdate,
          },
        });

        // Auto-execute after 10 seconds if user doesn't click
        setTimeout(() => {
          executeForceUpdate();
        }, 10000);
      }

    } catch (error) {
      console.error('Error checking for force update:', error);
    } finally {
      setState(prev => ({ ...prev, isCheckingVersion: false }));
    }
  }, [state.isCheckingVersion, executeForceUpdate]);

  useEffect(() => {
    // Initial check after 5 seconds
    const initialTimeout = setTimeout(() => {
      checkForForceUpdate();
    }, 5000);

    // Check every 30 seconds
    const interval = setInterval(() => {
      if (navigator.onLine) {
        checkForForceUpdate();
      }
    }, 30000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [checkForForceUpdate]);

  return {
    ...state,
    checkForForceUpdate,
    executeForceUpdate,
  };
};
