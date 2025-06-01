
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, RefreshCw, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { PendingAnalysis, retryFailedAnalysis } from "@/utils/pendingAnalysisService";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface PendingAnalysesCardProps {
  analyses: PendingAnalysis[];
  onRetry?: () => void;
}

export const PendingAnalysesCard = ({ analyses, onRetry }: PendingAnalysesCardProps) => {
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());

  if (analyses.length === 0) return null;

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-blue-600 bg-blue-50';
      case 'processing':
        return 'text-orange-600 bg-orange-50';
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const pendingCount = analyses.filter(a => a.status === 'pending' || a.status === 'processing').length;
  const failedCount = analyses.filter(a => a.status === 'failed').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Analysis Status
          {pendingCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {pendingCount} in progress
            </Badge>
          )}
          {failedCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {failedCount} failed
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Track your AI analyses - recent activity and status updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {analyses.map((analysis) => (
          <div
            key={analysis.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              {getStatusIcon(analysis.status)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {analysis.description || 'Untitled Analysis'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })}
                  </p>
                  {analysis.category && (
                    <Badge variant="outline" className="text-xs">
                      {analysis.category}
                    </Badge>
                  )}
                </div>
                {analysis.status === 'failed' && analysis.error_message && (
                  <p className="text-xs text-red-600 mt-1 truncate">
                    {analysis.error_message}
                  </p>
                )}
                {analysis.retry_count > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Retry attempt: {analysis.retry_count}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={getStatusVariant(analysis.status)} 
                className={`text-xs ${getStatusColor(analysis.status)}`}
              >
                {analysis.status === 'processing' ? 'Processing...' : analysis.status}
              </Badge>
              {analysis.status === 'failed' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRetry(analysis.id)}
                  disabled={retryingIds.has(analysis.id)}
                  className="h-7 px-2"
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
      </CardContent>
    </Card>
  );
};
