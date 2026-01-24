
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Clock, RefreshCw, AlertCircle, CheckCircle2, Loader2, X, Eye } from 'lucide-react';
import { PendingAnalysis, retryFailedAnalysis } from '@/utils/pendingAnalysisService';
import { toast } from "sonner";
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface AnalysisStatusIndicatorProps {
  analyses: PendingAnalysis[];
  onRetry?: () => void;
}

export const AnalysisStatusIndicator = ({ analyses, onRetry }: AnalysisStatusIndicatorProps) => {
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  // Get only the latest analysis per status type
  const getLatestAnalyses = () => {
    if (!analyses.length) return [];
    
    // Sort by created_at descending to get most recent first
    const sortedAnalyses = [...analyses].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    // Get the most recent analysis of each status type
    const latestByStatus = new Map<string, PendingAnalysis>();
    
    sortedAnalyses.forEach(analysis => {
      const status = analysis.status;
      if (!latestByStatus.has(status)) {
        latestByStatus.set(status, analysis);
      }
    });
    
    // Return only truly relevant statuses (active or recently completed/failed)
    const relevantStatuses = Array.from(latestByStatus.values()).filter(analysis => {
      const isActive = (analysis.status === 'pending' && !analysis.completed_at) || analysis.status === 'processing';
      const isRecentlyCompleted = analysis.status === 'completed' && 
        new Date(analysis.completed_at || analysis.updated_at) > new Date(Date.now() - 2 * 60 * 60 * 1000); // Last 2 hours
      const isRecentlyFailed = analysis.status === 'failed' && 
        new Date(analysis.completed_at || analysis.updated_at) > new Date(Date.now() - 2 * 60 * 60 * 1000); // Last 2 hours
      
      return isActive || isRecentlyCompleted || isRecentlyFailed;
    });

    // If we have multiple, prioritize by importance: processing > failed > pending > completed
    if (relevantStatuses.length > 1) {
      const priorityOrder = { 'processing': 1, 'failed': 2, 'pending': 3, 'completed': 4 };
      relevantStatuses.sort((a, b) => 
        (priorityOrder[a.status as keyof typeof priorityOrder] || 5) - 
        (priorityOrder[b.status as keyof typeof priorityOrder] || 5)
      );
      return [relevantStatuses[0]]; // Return only the highest priority one
    }
    
    return relevantStatuses;
  };

  const relevantAnalyses = getLatestAnalyses();

  // Don't show indicator if no relevant analyses
  if (relevantAnalyses.length === 0) return null;

  const pendingCount = relevantAnalyses.filter(a => 
    (a.status === 'pending' && !a.completed_at) || a.status === 'processing'
  ).length;
  const completedCount = relevantAnalyses.filter(a => a.status === 'completed').length;
  const failedCount = relevantAnalyses.filter(a => a.status === 'failed').length;

  const handleRetry = async (id: string) => {
    try {
      setRetryingIds(prev => new Set(prev).add(id));
      await retryFailedAnalysis(id);
      toast.success("Analysis retried successfully");
      onRetry?.();
    } catch (error: any) {
      console.error('Retry failed:', error);
      toast.error(`Failed to retry analysis: ${error.message || 'Unknown error'}`);
    } finally {
      setRetryingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleViewResult = (analysis: PendingAnalysis) => {
    if (analysis.category === 'food') {
      navigate('/food');
    } else if (analysis.category === 'receipt') {
      navigate('/receipts');
    } else if (analysis.category === 'workout') {
      navigate('/workouts');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3 text-blue-500" />;
      case 'processing':
        return <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  const getIndicatorIcon = () => {
    if (pendingCount > 0) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (failedCount > 0) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (completedCount > 0) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    return <Clock className="h-4 w-4" />;
  };

  const getIndicatorVariant = () => {
    if (failedCount > 0) return 'destructive';
    if (pendingCount > 0) return 'default';
    if (completedCount > 0) return 'secondary';
    return 'secondary';
  };

  const getIndicatorText = () => {
    if (pendingCount > 0) return 'Processing';
    if (failedCount > 0) return 'Failed';
    if (completedCount > 0) return 'Completed';
    return 'Recent';
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <Badge variant={getIndicatorVariant()} className="flex items-center gap-1 px-2 py-1">
            {getIndicatorIcon()}
            <span className="text-xs">{getIndicatorText()}</span>
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Latest Analysis Status</h4>
            <Badge variant="outline" className="text-xs">
              {relevantAnalyses.length} item{relevantAnalyses.length > 1 ? 's' : ''}
            </Badge>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {relevantAnalyses.map((analysis) => (
              <div
                key={analysis.id}
                className="flex items-center justify-between p-2 border rounded text-xs hover:bg-gray-50"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getStatusIcon(analysis.status)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {analysis.description || `${analysis.category || 'Unknown'} Analysis`}
                    </p>
                    <p className="text-muted-foreground">
                      {analysis.status === 'completed' || analysis.status === 'failed' 
                        ? formatDistanceToNow(new Date(analysis.completed_at || analysis.updated_at), { addSuffix: true })
                        : formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })
                      }
                    </p>
                    {analysis.status === 'failed' && analysis.error_message && (
                      <p className="text-red-600 truncate">
                        {analysis.error_message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge 
                    variant={
                      analysis.status === 'failed' ? 'destructive' : 
                      analysis.status === 'completed' ? 'default' :
                      'secondary'
                    }
                    className="text-xs"
                  >
                    {analysis.status === 'processing' ? 'Processing...' : analysis.status}
                  </Badge>
                  {analysis.status === 'completed' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewResult(analysis)}
                      className="h-6 w-6 p-0"
                      title="View results"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                  {analysis.status === 'failed' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRetry(analysis.id)}
                      disabled={retryingIds.has(analysis.id)}
                      className="h-6 w-6 p-0"
                      title="Retry analysis"
                    >
                      {retryingIds.has(analysis.id) ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
