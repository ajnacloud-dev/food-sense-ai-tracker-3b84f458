
import { RefreshCw, Download, AlertTriangle } from 'lucide-react';
import { useEnhancedPWAUpdate } from '@/hooks/useEnhancedPWAUpdate';
import { useForceUpdate } from '@/hooks/useForceUpdate';
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

  const {
    shouldForceUpdate,
    isCheckingVersion,
    executeForceUpdate
  } = useForceUpdate();

  const handleClick = () => {
    if (shouldForceUpdate) {
      executeForceUpdate();
      toast.success('Applying critical update...', {
        description: 'The app will refresh automatically.',
      });
    } else if (updateAvailable) {
      applyUpdate();
      toast.success('Installing update...', {
        description: 'The app will refresh automatically when complete.',
      });
    } else {
      forceCheckForUpdates();
      toast.info('Checking for updates...');
    }
  };

  const getIcon = () => {
    if (shouldForceUpdate) {
      return <AlertTriangle className={`h-4 w-4 ${isUpdating ? 'animate-pulse' : 'animate-bounce'}`} />;
    }
    if (updateAvailable) {
      return <Download className={`h-4 w-4 ${isUpdating ? 'animate-pulse' : ''}`} />;
    }
    return (
      <RefreshCw 
        className={`h-4 w-4 ${
          isUpdating || isCheckingForUpdates || isCheckingVersion ? 'animate-spin' : ''
        }`} 
      />
    );
  };

  const getTitle = () => {
    if (shouldForceUpdate) return 'Critical update required - click to install';
    if (updateAvailable) return 'Update available - click to install';
    return 'Check for updates';
  };

  const getBadgeColor = () => {
    if (shouldForceUpdate) return 'bg-red-500';
    if (updateAvailable) return 'bg-yellow-400';
    return '';
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isUpdating || isCheckingForUpdates}
      className="relative h-8 w-8 p-0 text-white hover:bg-white/20 transition-colors shrink-0"
      title={getTitle()}
    >
      {getIcon()}
      {(updateAvailable || shouldForceUpdate) && !isUpdating && (
        <div className={`absolute -top-1 -right-1 w-3 h-3 ${getBadgeColor()} rounded-full border border-white animate-pulse shadow-lg`} />
      )}
    </Button>
  );
};

export default PWAUpdateIcon;
