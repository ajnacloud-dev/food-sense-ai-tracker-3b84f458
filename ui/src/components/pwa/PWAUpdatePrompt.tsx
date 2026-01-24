
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, X } from 'lucide-react';

const PWAUpdatePrompt = () => {
  const [showReload, setShowReload] = useState(false);
  const [updateServiceWorker, setUpdateServiceWorker] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    // Dynamically import the PWA register hook to avoid build errors
    const loadPWARegister = async () => {
      try {
        const { useRegisterSW } = await import('virtual:pwa-register/react');
        
        const {
          needRefresh: [needRefresh],
          updateServiceWorker: updateSW,
        } = useRegisterSW({
          onRegistered(r) {
            console.log('SW Registered: ' + r);
          },
          onRegisterError(error) {
            console.log('SW registration error', error);
          },
        });

        setShowReload(needRefresh);
        setUpdateServiceWorker(() => updateSW);
      } catch (error) {
        console.log('PWA register not available:', error);
      }
    };

    loadPWARegister();
  }, []);

  const handleUpdate = () => {
    if (updateServiceWorker) {
      updateServiceWorker();
    }
  };

  const handleDismiss = () => {
    setShowReload(false);
  };

  if (!showReload) {
    return null;
  }

  return (
    <Card className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-sm bg-white shadow-lg border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <RefreshCw className="h-4 w-4 text-blue-600" />
            </div>
            <CardTitle className="text-sm">Update Available</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-xs">
          A new version of the app is available
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button
          onClick={handleUpdate}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Update Now
        </Button>
      </CardContent>
    </Card>
  );
};

export default PWAUpdatePrompt;
