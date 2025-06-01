
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { PendingAnalysis, retryFailedAnalysis } from "@/utils/pendingAnalysisService";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface PendingAnalysesCardProps {
  analyses: PendingAnalysis[];
  onRetry?: () => void;
}

export const PendingAnalysesCard = ({ analyses, onRetry }: PendingAnalysesCardProps) => {
  if (analyses.length === 0) return null;

  const handleRetry = async (id: string) => {
    try {
      await retryFailedAnalysis(id);
      toast.success("Analysis retried successfully");
      onRetry?.();
    } catch (error) {
      toast.error("Failed to retry analysis");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pending Analyses
        </CardTitle>
        <CardDescription>
          Track your ongoing AI analyses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {analyses.map((analysis) => (
          <div
            key={analysis.id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center gap-3 flex-1">
              {getStatusIcon(analysis.status)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {analysis.description || 'Untitled Analysis'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusVariant(analysis.status)} className="text-xs">
                {analysis.status}
              </Badge>
              {analysis.status === 'failed' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRetry(analysis.id)}
                  className="h-7 px-2"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
