
import { useEffect } from 'react';
import { useEnhancedPWAUpdate } from '@/hooks/useEnhancedPWAUpdate';
import { Button } from '@/components/ui/button';
import { RefreshCw, Zap } from 'lucide-react';
import { toast } from 'sonner';

const PWAUpdateManager = () => {
  const { 
    updateAvailable, 
    isUpdating, 
    isCheckingForUpdates,
    applyUpdate, 
    dismissUpdate, 
    forceCheckForUpdates 
  } = useEnhancedPWAUpdate();

  useEffect(() => {
    // Show persistent but non-blocking notification when update is available
    if (updateAvailable) {
      toast.info('App update available!', {
        description: 'A new version is ready to install. Tap to update now.',
        action: {
          label: 'Update Now',
          onClick: applyUpdate,
        },
        duration: 10000, // Auto-dismiss after 10 seconds
        id: 'pwa-update',
      });
    }
  }, [updateAvailable, applyUpdate]);

  // Only show the force update button when no update is available
  if (!updateAvailable) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={forceCheckForUpdates}
          disabled={isCheckingForUpdates}
          className="bg-white/90 backdrop-blur-sm shadow-lg"
        >
          {isCheckingForUpdates ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Zap className="h-4 w-4 mr-2" />
          )}
          {isCheckingForUpdates ? 'Checking...' : 'Check Updates'}
        </Button>
      </div>
    );
  }

  // When update is available, show a small non-intrusive indicator at the bottom
  return (
    <div className="fixed bottom-4 left-4 z-40">
      <Button
        onClick={applyUpdate}
        disabled={isUpdating}
        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
        size="sm"
      >
        {isUpdating ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Updating...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Update App
          </>
        )}
      </Button>
    </div>
  );
};

export default PWAUpdateManager;
