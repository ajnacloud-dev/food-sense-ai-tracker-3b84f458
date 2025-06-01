
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AutoRefreshIndicatorProps {
  isRefreshing: boolean;
  isVisible: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  lastRefresh: Date;
  onManualRefresh: () => void;
  autoRefreshEnabled: boolean;
}

export const AutoRefreshIndicator = ({
  isRefreshing,
  isVisible,
  connectionStatus,
  lastRefresh,
  onManualRefresh,
  autoRefreshEnabled
}: AutoRefreshIndicatorProps) => {
  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-3 w-3 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="h-3 w-3 text-red-500" />;
      case 'reconnecting':
        return <RefreshCw className="h-3 w-3 text-yellow-500 animate-spin" />;
    }
  };

  const getStatusVariant = () => {
    if (!autoRefreshEnabled) return 'secondary';
    switch (connectionStatus) {
      case 'connected':
        return 'default';
      case 'disconnected':
        return 'destructive';
      case 'reconnecting':
        return 'secondary';
    }
  };

  const getStatusText = () => {
    if (!autoRefreshEnabled) return 'Auto-refresh disabled';
    if (!isVisible) return 'Paused (tab inactive)';
    switch (connectionStatus) {
      case 'connected':
        return isRefreshing ? 'Refreshing...' : 'Auto-refresh active';
      case 'disconnected':
        return 'Connection lost';
      case 'reconnecting':
        return 'Reconnecting...';
    }
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={getStatusVariant()} className="flex items-center gap-1 px-2 py-1">
              {getConnectionIcon()}
              <span className="text-xs">{getStatusText()}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1 text-xs">
              <p>Real-time status: {connectionStatus}</p>
              <p>Tab visibility: {isVisible ? 'visible' : 'hidden'}</p>
              <p className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last refresh: {formatDistanceToNow(lastRefresh, { addSuffix: true })}
              </p>
              {autoRefreshEnabled && (
                <p>Auto-refresh every 30s when analyses are pending</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        <Button
          variant="outline"
          size="sm"
          onClick={onManualRefresh}
          disabled={isRefreshing}
          className="h-7 px-2"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </TooltipProvider>
  );
};
