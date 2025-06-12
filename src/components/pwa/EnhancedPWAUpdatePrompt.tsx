
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, X, Download, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

const EnhancedPWAUpdatePrompt = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateServiceWorker, setUpdateServiceWorker] = useState<(() => Promise<void>) | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdateCheck, setLastUpdateCheck] = useState<Date | null>(null);

  useEffect(() => {
    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for updates on focus
    const handleFocus = () => {
      if (isOnline && updateServiceWorker) {
        checkForUpdates();
      }
    };

    window.addEventListener('focus', handleFocus);

    // Dynamically import the PWA register hook
    const loadPWARegister = async () => {
      try {
        const { useRegisterSW } = await import('virtual:pwa-register/react');
        
        const {
          needRefresh: [needRefreshState, setNeedRefreshState],
          offlineReady: [offlineReadyState, setOfflineReadyState],
          updateServiceWorker: updateSW,
        } = useRegisterSW({
          onRegistered(r) {
            console.log('SW Registered: ' + r);
            setLastUpdateCheck(new Date());
          },
          onRegisterError(error) {
            console.log('SW registration error', error);
            toast.error('Failed to register service worker');
          },
          onNeedRefresh() {
            console.log('SW needs refresh');
            setNeedRefresh(true);
            toast.info('New app version available!', {
              action: {
                label: 'Update',
                onClick: handleUpdate
              }
            });
          },
          onOfflineReady() {
            console.log('SW offline ready');
            setOfflineReady(true);
            toast.success('App ready to work offline!');
          }
        });

        setNeedRefresh(needRefreshState);
        setOfflineReady(offlineReadyState);
        setUpdateServiceWorker(() => updateSW);
      } catch (error) {
        console.log('PWA register not available:', error);
      }
    };

    loadPWARegister();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isOnline, updateServiceWorker]);

  const checkForUpdates = async () => {
    if (updateServiceWorker) {
      setLastUpdateCheck(new Date());
      toast.info('Checking for updates...');
    }
  };

  const handleUpdate = async () => {
    if (updateServiceWorker && !isUpdating) {
      setIsUpdating(true);
      try {
        await updateServiceWorker(true);
        toast.success('App updated successfully!');
      } catch (error) {
        console.error('Update failed:', error);
        toast.error('Update failed. Please try again.');
      } finally {
        setIsUpdating(false);
        setNeedRefresh(false);
      }
    }
  };

  const handleDismiss = () => {
    setNeedRefresh(false);
    toast.info('Update dismissed. Check Settings to update later.');
  };

  // Show offline ready notification
  if (offlineReady && !needRefresh) {
    return (
      <Card className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-sm bg-green-50 shadow-lg border-green-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <WifiOff className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-sm text-green-800">Ready for Offline Use</CardTitle>
              <CardDescription className="text-xs text-green-600">
                App can now work without internet
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  // Show update prompt
  if (needRefresh) {
    return (
      <Card className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-sm bg-blue-50 shadow-lg border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <RefreshCw className={`h-4 w-4 text-blue-600 ${isUpdating ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <CardTitle className="text-sm text-blue-800 flex items-center gap-2">
                  Update Available
                  <Badge variant="secondary" className="text-xs">New</Badge>
                </CardTitle>
                <CardDescription className="text-xs text-blue-600">
                  A new version with improvements is ready
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
              disabled={isUpdating}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <Button
            onClick={handleUpdate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
            disabled={isUpdating || !isOnline}
          >
            {isUpdating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Update Now
              </>
            )}
          </Button>
          {!isOnline && (
            <p className="text-xs text-yellow-600 flex items-center gap-1">
              <WifiOff className="h-3 w-3" />
              Update requires internet connection
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default EnhancedPWAUpdatePrompt;
