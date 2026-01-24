
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface EnhancedPWAUpdateState {
  updateAvailable: boolean;
  isUpdating: boolean;
  isCheckingForUpdates: boolean;
  lastChecked: Date | null;
  isOnline: boolean;
  forceUpdateTriggered: boolean;
}

export const useEnhancedPWAUpdate = () => {
  const [state, setState] = useState<EnhancedPWAUpdateState>({
    updateAvailable: false,
    isUpdating: false,
    isCheckingForUpdates: false,
    lastChecked: null,
    isOnline: navigator.onLine,
    forceUpdateTriggered: false,
  });

  // Generate dynamic cache name based on timestamp
  const getCurrentCacheName = () => {
    return `nutriwealth-v${Date.now()}`;
  };

  const clearAllCaches = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log('Clearing caches:', cacheNames);
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('All caches cleared successfully');
      }
    } catch (error) {
      console.error('Error clearing caches:', error);
    }
  };

  const forceCheckForUpdates = useCallback(async () => {
    setState(prev => ({ ...prev, isCheckingForUpdates: true }));
    
    try {
      console.log('Force checking for updates...');
      
      // First, clear all caches
      await clearAllCaches();
      
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          console.log('Forcing service worker update check');
          await registration.update();
          
          setState(prev => ({ 
            ...prev, 
            lastChecked: new Date(),
            forceUpdateTriggered: true 
          }));
          
          if (registration.waiting) {
            setState(prev => ({ ...prev, updateAvailable: true }));
            toast.success('Update available!', {
              description: 'A new version is ready to install',
              duration: 5000,
            });
            return true;
          } else {
            // Force a hard refresh after cache clear
            setTimeout(() => {
              window.location.reload();
            }, 1000);
            
            toast.success('App refreshed!', {
              description: 'Latest version loaded',
              duration: 3000,
            });
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Error force checking for updates:', error);
      toast.error('Failed to check for updates');
      return false;
    } finally {
      setState(prev => ({ ...prev, isCheckingForUpdates: false }));
    }
  }, []);

  const checkForUpdates = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          setState(prev => ({ ...prev, lastChecked: new Date() }));
          
          if (registration.waiting) {
            setState(prev => ({ ...prev, updateAvailable: true }));
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking for updates:', error);
      return false;
    }
  };

  const applyUpdate = async () => {
    setState(prev => ({ ...prev, isUpdating: true }));
    
    try {
      console.log('Applying update...');
      
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          
          // Wait for the new service worker to take control
          await new Promise((resolve) => {
            const handleControllerChange = () => {
              navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
              resolve(true);
            };
            navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
            
            // Timeout after 5 seconds
            setTimeout(() => {
              navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
              resolve(true);
            }, 5000);
          });
          
          // Clear all caches to ensure fresh content
          await clearAllCaches();
          
          // Force refresh the page
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error applying update:', error);
      setState(prev => ({ ...prev, isUpdating: false }));
      toast.error('Failed to apply update. Please refresh manually.');
    }
  };

  const dismissUpdate = () => {
    setState(prev => ({ ...prev, updateAvailable: false }));
    toast.dismiss('pwa-update');
  };

  useEffect(() => {
    // Handle online/offline status
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check after 3 seconds
    const initialTimeout = setTimeout(() => {
      checkForUpdates();
    }, 3000);

    // Set up periodic checking every 3 minutes when online
    const interval = setInterval(() => {
      if (navigator.onLine) {
        checkForUpdates();
      }
    }, 3 * 60 * 1000); // 3 minutes

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        const { data } = event;
        
        if (data?.type === 'UPDATE_AVAILABLE') {
          setState(prev => ({ ...prev, updateAvailable: true }));
          toast.info('🎉 New version available!', {
            id: 'pwa-update',
            description: 'Tap to update and get the latest features',
            action: {
              label: 'Update Now',
              onClick: applyUpdate,
            },
            duration: Infinity,
          });
        } else if (data?.type === 'SW_UPDATED') {
          console.log('Service Worker updated successfully');
          toast.success('App updated successfully!', {
            description: 'You now have the latest version',
            duration: 3000,
          });
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);

      // Also listen for controller changes
      const handleControllerChange = () => {
        console.log('Service Worker controller changed');
        setState(prev => ({ ...prev, updateAvailable: false, isUpdating: false }));
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      return () => {
        clearTimeout(initialTimeout);
        clearInterval(interval);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        navigator.serviceWorker.removeEventListener('message', handleMessage);
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    ...state,
    checkForUpdates,
    forceCheckForUpdates,
    applyUpdate,
    dismissUpdate,
  };
};
