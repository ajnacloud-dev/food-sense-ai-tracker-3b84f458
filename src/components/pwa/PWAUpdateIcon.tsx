
import { RefreshCw, Download } from 'lucide-react';
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
      toast.success('Installing update...', {
        description: 'The app will refresh automatically when complete.',
      });
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
      className="relative h-8 w-8 p-0 text-white hover:bg-white/20 transition-colors shrink-0"
      title={updateAvailable ? 'Update available - click to install' : 'Check for updates'}
    >
      {updateAvailable ? (
        <Download className={`h-4 w-4 ${isUpdating ? 'animate-pulse' : ''}`} />
      ) : (
        <RefreshCw 
          className={`h-4 w-4 ${
            isUpdating || isCheckingForUpdates ? 'animate-spin' : ''
          }`} 
        />
      )}
      {updateAvailable && !isUpdating && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white animate-pulse shadow-lg" />
      )}
    </Button>
  );
};

export default PWAUpdateIcon;
