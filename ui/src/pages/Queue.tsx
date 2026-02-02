import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, XCircle, Loader2, RefreshCw, Bell } from "lucide-react";
import { usePendingAnalyses } from "@/hooks/usePendingAnalyses";
import { useAuth } from "@/contexts/AuthContext";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { formatDistanceToNow } from "date-fns";

const Queue = () => {
  const { user } = useAuth();
  const { pendingAnalyses: jobs, loading, fetchPendingAnalyses: fetchJobs } = usePendingAnalyses(user?.id);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notifications enabled');
      }
    }
  };

  useEffect(() => {
    // Refresh jobs every 5 seconds
    const interval = setInterval(() => {
      fetchJobs();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchJobs]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <SidebarLayout>
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analysis Queue</h1>
            <p className="text-gray-600">Track your food analysis jobs</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={requestNotificationPermission}
            >
              <Bell className="h-4 w-4 mr-2" />
              Enable Notifications
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchJobs}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs in Queue</h3>
              <p className="text-gray-600">Your analysis jobs will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <CardTitle className="text-lg">
                          {job.description || 'Food Analysis'}
                        </CardTitle>
                        <CardDescription>
                          Started {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(job.status)} border`}>
                      {job.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Progress Bar */}
                  {job.status === 'processing' && (
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Analyzing with GPT-5.2...</span>
                        <span>50%</span>
                      </div>
                      <Progress value={50} className="h-2" />
                    </div>
                  )}

                  {/* Completed Result */}
                  {job.status === 'completed' && job.analysis_result && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-green-900">
                            {job.analysis_result.description || job.description}
                          </p>
                          <p className="text-sm text-green-700 mt-1">
                            {job.analysis_result.calories || 0} calories • {job.analysis_result.meal_type || job.category}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => window.location.href = `/food/${job.analysis_result.food_entry_id || job.id}`}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Failed Error */}
                  {job.status === 'failed' && job.error_message && (
                    <div className="bg-red-50 rounded-lg p-4">
                      <p className="text-sm text-red-700">{job.error_message}</p>
                    </div>
                  )}

                  {/* Job Info */}
                  <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                    <span>Job ID: {job.id.slice(0, 8)}...</span>
                    {job.completed_at && (
                      <span>
                        Completed {formatDistanceToNow(new Date(job.completed_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};

export default Queue;