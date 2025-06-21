
import { useEffect } from 'react';
import { useEnhancedPWAUpdate } from '@/hooks/useEnhancedPWAUpdate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Download, X, Zap } from 'lucide-react';
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
    // Show persistent notification when update is available
    if (updateAvailable) {
      toast.info('App update available!', {
        description: 'A new version is ready to install',
        action: {
          label: 'Update Now',
          onClick: applyUpdate,
        },
        duration: Infinity,
        id: 'pwa-update',
      });
    }
  }, [updateAvailable, applyUpdate]);

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
          {isCheckingForUpdates ? 'Checking...' : 'Force Update'}
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-sm bg-white shadow-lg border-blue-200 animate-in slide-in-from-top-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Download className="h-4 w-4 text-blue-600" />
            </div>
            <CardTitle className="text-sm">Update Available</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={dismissUpdate}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-xs">
          A new version of NutriWealth is ready to install
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button
            onClick={applyUpdate}
            disabled={isUpdating}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            {isUpdating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isUpdating ? 'Updating...' : 'Update Now'}
          </Button>
          <Button
            onClick={dismissUpdate}
            variant="outline"
            size="sm"
          >
            Later
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PWAUpdateManager;
