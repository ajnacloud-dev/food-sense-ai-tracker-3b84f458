
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useConnectionMonitor = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [supabaseConnected, setSupabaseConnected] = useState(true);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Monitor browser online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const testConnection = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('users').select('id').limit(1);
      const connected = !error;
      setSupabaseConnected(connected);
      if (connected) {
        setReconnectAttempts(0);
      }
      return connected;
    } catch (error) {
      console.error('Connection test failed:', error);
      setSupabaseConnected(false);
      return false;
    }
  }, []);

  const reconnect = useCallback(async () => {
    if (reconnectAttempts >= 3) {
      console.log('Max reconnection attempts reached');
      return false;
    }

    setReconnectAttempts(prev => prev + 1);
    console.log(`Reconnection attempt ${reconnectAttempts + 1}`);
    
    const connected = await testConnection();
    if (!connected) {
      // Exponential backoff
      const delay = Math.pow(2, reconnectAttempts) * 1000;
      setTimeout(reconnect, delay);
    }
    
    return connected;
  }, [reconnectAttempts, testConnection]);

  // Test connection periodically
  useEffect(() => {
    const interval = setInterval(testConnection, 30000); // Test every 30 seconds
    return () => clearInterval(interval);
  }, [testConnection]);

  return {
    isOnline,
    supabaseConnected,
    reconnectAttempts,
    testConnection,
    reconnect
  };
};
