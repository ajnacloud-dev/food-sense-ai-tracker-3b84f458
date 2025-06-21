
import { RefreshCw } from 'lucide-react';
import { useEnhancedPWAUpdate } from '@/hooks/useEnhancedPWAUpdate';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const PWAUpdateIcon = () => {
  const { 
    updateAvailable, 
    isUpdating, 
    isCheckingForUpdates,
    applyUpdate, 
    forceCheckForUpdates 
  } = useEnhancedPWAUpdate();

  const handleClick = () => {
    if (updateAvailable) {
      applyUpdate();
    } else {
      forceCheckForUpdates();
      toast.info('Checking for updates...');
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isUpdating || isCheckingForUpdates}
      className="relative h-8 w-8 p-0 text-white hover:bg-white/20 transition-colors"
      title={updateAvailable ? 'Update available - click to install' : 'Check for updates'}
    >
      <RefreshCw 
        className={`h-4 w-4 ${
          isUpdating || isCheckingForUpdates ? 'animate-spin' : ''
        }`} 
      />
      {updateAvailable && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white animate-pulse" />
      )}
    </Button>
  );
};

export default PWAUpdateIcon;
