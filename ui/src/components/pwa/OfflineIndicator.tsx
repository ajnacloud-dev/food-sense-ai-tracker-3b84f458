
import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { toast } from 'sonner';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored', {
        description: 'You are back online',
        duration: 3000,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Connection lost', {
        description: 'Working in offline mode',
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-16 left-4 right-4 z-40 mx-auto max-w-sm">
      <div className="bg-orange-100 border border-orange-200 rounded-lg p-3 flex items-center gap-2 shadow-sm">
        <WifiOff className="h-4 w-4 text-orange-600" />
        <span className="text-sm text-orange-800 font-medium">
          Offline mode
        </span>
      </div>
    </div>
  );
};

export default OfflineIndicator;
