
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface PWAUpdateState {
  updateAvailable: boolean;
  isUpdating: boolean;
  lastChecked: Date | null;
}

export const usePWAUpdate = () => {
  const [state, setState] = useState<PWAUpdateState>({
    updateAvailable: false,
    isUpdating: false,
    lastChecked: null,
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
          });
          
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
  };

  // Check for updates every 30 minutes
  useEffect(() => {
    // Initial check
    checkForUpdates();

    // Set up periodic checking
    const interval = setInterval(() => {
      checkForUpdates();
    }, 30 * 60 * 1000); // 30 minutes

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'UPDATE_AVAILABLE') {
          setState(prev => ({ ...prev, updateAvailable: true }));
          toast.info('A new version is available!', {
            action: {
              label: 'Update',
              onClick: applyUpdate,
            },
            duration: 10000,
          });
        }
      });
    }

    return () => {
      clearInterval(interval);
    };
  }, []);

  return {
    ...state,
    checkForUpdates,
    applyUpdate,
    dismissUpdate,
  };
};
