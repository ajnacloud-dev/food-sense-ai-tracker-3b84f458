
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface PWAUpdateState {
  updateAvailable: boolean;
  isUpdating: boolean;
  lastChecked: Date | null;
  isOnline: boolean;
}

export const usePWAUpdate = () => {
  const [state, setState] = useState<PWAUpdateState>({
    updateAvailable: false,
    isUpdating: false,
    lastChecked: null,
    isOnline: navigator.onLine,
  });

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
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
              cacheNames.map(cacheName => caches.delete(cacheName))
            );
          }
          
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

    // Set up periodic checking every 5 minutes when online
    const interval = setInterval(() => {
      if (navigator.onLine) {
        checkForUpdates();
      }
    }, 5 * 60 * 1000); // 5 minutes

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
    applyUpdate,
    dismissUpdate,
  };
};
