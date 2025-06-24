
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
    // All updates are now treated as critical/mandatory
    if (shouldForceUpdate || updateAvailable) {
      const updateAction = shouldForceUpdate ? executeForceUpdate : applyUpdate;
      updateAction();
      toast.success('Applying critical update...', {
        description: 'The app will refresh automatically.',
      });
    } else {
      forceCheckForUpdates();
      toast.info('Checking for updates...');
    }
  };

  const getIcon = () => {
    // All available updates are now treated as critical
    if (shouldForceUpdate || updateAvailable) {
      return <AlertTriangle className={`h-4 w-4 ${isUpdating ? 'animate-pulse' : 'animate-bounce'}`} />;
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
    if (shouldForceUpdate || updateAvailable) return 'Critical update required - click to install';
    return 'Check for updates';
  };

  const getBadgeColor = () => {
    // All updates now show as critical (red)
    if (shouldForceUpdate || updateAvailable) return 'bg-red-500';
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
