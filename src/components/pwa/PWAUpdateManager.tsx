
import { useEffect } from 'react';
import { useEnhancedPWAUpdate } from '@/hooks/useEnhancedPWAUpdate';
import { toast } from 'sonner';

const PWAUpdateManager = () => {
  const { 
    updateAvailable, 
    isUpdating, 
    applyUpdate
  } = useEnhancedPWAUpdate();

  useEffect(() => {
    // Show non-blocking notification when update is available
    if (updateAvailable) {
      toast.info('App update available!', {
        description: 'A new version is ready to install. Check the update icon in the sidebar.',
        duration: 5000,
        id: 'pwa-update',
      });
    }
  }, [updateAvailable, applyUpdate]);

  // No UI rendered - this component only handles background update logic
  return null;
};

export default PWAUpdateManager;
