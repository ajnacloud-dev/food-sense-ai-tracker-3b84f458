
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Wifi, WifiOff, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PWAUpdateCheckerProps {
  className?: string;
}

const PWAUpdateChecker = ({ className }: PWAUpdateCheckerProps) => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateServiceWorker, setUpdateServiceWorker] = useState<(() => Promise<void>) | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdateCheck, setLastUpdateCheck] = useState<Date | null>(null);
  const [appVersion, setAppVersion] = useState<string>('');

  useEffect(() => {
    // Get app version from package.json or build time
    setAppVersion(import.meta.env.VITE_APP_VERSION || '1.0.0');

    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialize PWA register
    const loadPWARegister = async () => {
      try {
        const { useRegisterSW } = await import('virtual:pwa-register/react');
        
        const {
          needRefresh: [needRefreshState],
          offlineReady: [offlineReadyState],
          updateServiceWorker: updateSW,
        } = useRegisterSW({
          onRegistered(r) {
            console.log('SW Registered: ' + r);
            setLastUpdateCheck(new Date());
          },
          onRegisterError(error) {
            console.log('SW registration error', error);
          },
          onNeedRefresh() {
            setNeedRefresh(true);
          },
          onOfflineReady() {
            setOfflineReady(true);
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
    };
  }, []);

  const checkForUpdates = async () => {
    if (!isOnline) {
      toast.error('Internet connection required to check for updates');
      return;
    }

    setIsChecking(true);
    try {
      // Force a service worker update check
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          setLastUpdateCheck(new Date());
          
          // Check if update is available
          setTimeout(() => {
            if (!needRefresh) {
              toast.success('You have the latest version!');
            }
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Update check failed:', error);
      toast.error('Failed to check for updates');
    } finally {
      setIsChecking(false);
    }
  };

  const handleUpdate = async () => {
    if (updateServiceWorker && !isUpdating) {
      setIsUpdating(true);
      try {
        await updateServiceWorker(true);
        toast.success('App updated successfully!');
        setNeedRefresh(false);
      } catch (error) {
        console.error('Update failed:', error);
        toast.error('Update failed. Please try again.');
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          App Updates
        </CardTitle>
        <CardDescription>
          Manage app updates and check for new versions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Version Info */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium">Current Version</p>
            <p className="text-xs text-gray-600">v{appVersion}</p>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            {offlineReady && (
              <Badge variant="outline" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Offline Ready
              </Badge>
            )}
          </div>
        </div>

        {/* Update Status */}
        {needRefresh && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Update Available</p>
                <p className="text-xs text-blue-600">A new version is ready to install</p>
              </div>
              <Badge className="bg-blue-600">New</Badge>
            </div>
          </div>
        )}

        {/* Last Check Info */}
        {lastUpdateCheck && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            Last checked: {lastUpdateCheck.toLocaleString()}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            onClick={checkForUpdates}
            disabled={isChecking || !isOnline}
            variant="outline"
            className="w-full"
          >
            {isChecking ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Check for Updates
              </>
            )}
          </Button>

          {needRefresh && (
            <Button
              onClick={handleUpdate}
              disabled={isUpdating || !isOnline}
              className="w-full"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Install Update'
              )}
            </Button>
          )}
        </div>

        {!isOnline && (
          <p className="text-xs text-yellow-600 flex items-center gap-1">
            <WifiOff className="h-3 w-3" />
            Internet connection required for updates
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PWAUpdateChecker;
