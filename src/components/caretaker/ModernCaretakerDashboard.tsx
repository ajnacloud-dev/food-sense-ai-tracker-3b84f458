
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCaretakerData } from "@/contexts/CaretakerDataContext";
import { usePermissionStatus } from "@/hooks/usePermissionStatus";
import PermissionStatusIndicator from "./PermissionStatusIndicator";
import { 
  Heart, 
  Utensils, 
  FileText, 
  Dumbbell, 
  BarChart3, 
  Clock,
  Users,
  Shield,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle
} from "lucide-react";

const ModernCaretakerDashboard = () => {
  const navigate = useNavigate();
  const { 
    participants, 
    selectedParticipantId, 
    setSelectedParticipantId, 
    participantData,
    loading, 
    error 
  } = useCaretakerData();
  
  const { hasPermission, missingPermissions } = usePermissionStatus(selectedParticipantId);

  const quickActions = [
    {
      title: "Food Entries",
      description: "Monitor daily nutrition and meals",
      icon: Utensils,
      href: "/caretaker/food",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      permission: "food_entries"
    },
    {
      title: "Receipts",
      description: "Track spending and purchases",
      icon: FileText,
      href: "/caretaker/receipts",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      permission: "receipts"
    },
    {
      title: "Workouts",
      description: "Review exercise and activity",
      icon: Dumbbell,
      href: "/caretaker/workouts",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      permission: "workouts"
    },
    {
      title: "Insights",
      description: "View analytics and trends",
      icon: BarChart3,
      href: "/caretaker/insights",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      permission: null
    }
  ];

  const handleActionClick = (href: string, permission: string | null) => {
    if (!selectedParticipantId) {
      return;
    }
    if (permission && !hasPermission(permission as any)) {
      return;
    }
    navigate(href);
  };

  const handleSelectParticipant = (participantId: string) => {
    setSelectedParticipantId(participantId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
              <p className="text-gray-600 font-medium">Loading your caretaker dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="max-w-2xl mx-auto mt-12 border-red-200">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-800">Error Loading Dashboard</CardTitle>
              <CardDescription className="text-red-600">
                {error}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Heart className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Caretaker Dashboard</h1>
              <p className="text-gray-600 mt-1">Monitor and support your participants' health journey</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Participant Selection */}
            {!selectedParticipantId && participants.length > 0 && (
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <CardTitle>Select a Participant</CardTitle>
                  </div>
                  <CardDescription>
                    Choose a participant to monitor their health data and activities.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {participants.map((participant) => (
                      <div
                        key={participant.id}
                        onClick={() => handleSelectParticipant(participant.id)}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{participant.full_name}</h3>
                            <p className="text-sm text-gray-600">{participant.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {participant.caretaker_type.replace('_', ' ')}
                              </Badge>
                              <Badge 
                                variant={participant.status === 'active' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {participant.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            {participant.health_score && (
                              <div className="text-2xl font-bold text-green-600">
                                {participant.health_score}%
                              </div>
                            )}
                            <p className="text-xs text-gray-500">Health Score</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selected Participant Overview */}
            {selectedParticipantId && participantData && (
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-blue-600">
                          {participantData.full_name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-xl">{participantData.full_name}</CardTitle>
                        <CardDescription>{participantData.email}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className={`h-4 w-4 ${
                        hasPermission('food_entries') || hasPermission('receipts') || hasPermission('workouts') 
                          ? 'text-green-500' : 'text-amber-500'
                      }`} />
                      <Badge variant={
                        hasPermission('food_entries') || hasPermission('receipts') || hasPermission('workouts')
                          ? 'default' : 'secondary'
                      }>
                        {hasPermission('food_entries') || hasPermission('receipts') || hasPermission('workouts') 
                          ? 'Access Granted' : 'Limited Access'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {participantData.health_score || 'N/A'}%
                      </div>
                      <p className="text-sm text-gray-600">Health Score</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        <Activity className="h-6 w-6 mx-auto" />
                      </div>
                      <p className="text-sm text-gray-600">Active Monitoring</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        <Clock className="h-6 w-6 mx-auto" />
                      </div>
                      <p className="text-sm text-gray-600">Real-time Updates</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            {selectedParticipantId && (
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Access participant data and monitoring tools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      const canAccess = !action.permission || hasPermission(action.permission as any);
                      
                      return (
                        <Button
                          key={action.title}
                          variant="outline"
                          onClick={() => handleActionClick(action.href, action.permission)}
                          disabled={!canAccess}
                          className={`h-auto p-6 text-left justify-start border-2 ${
                            canAccess 
                              ? `${action.borderColor} hover:${action.bgColor}` 
                              : 'border-gray-200 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-start gap-4 w-full">
                            <div className={`p-3 rounded-lg ${canAccess ? action.bgColor : 'bg-gray-100'}`}>
                              <Icon className={`h-6 w-6 ${canAccess ? action.color : 'text-gray-400'}`} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                              <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                              {!canAccess && action.permission && (
                                <Badge variant="outline" className="text-xs border-amber-200 text-amber-600">
                                  Permission Required
                                </Badge>
                              )}
                              {canAccess && (
                                <Badge variant="outline" className="text-xs border-green-200 text-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Available
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Permission Status */}
            {selectedParticipantId && participantData && (
              <PermissionStatusIndicator
                hasPermissions={hasPermission('food_entries') || hasPermission('receipts') || hasPermission('workouts')}
                participantName={participantData.full_name}
                missingCategories={missingPermissions}
              />
            )}

            {/* No Participants Message */}
            {participants.length === 0 && (
              <Card className="bg-white shadow-sm">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle>No Participants</CardTitle>
                  <CardDescription>
                    You don't have any participants to monitor yet. Participants need to invite you as their caretaker.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    To get started, ask a participant to send you an invitation code.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity (placeholder) */}
            {selectedParticipantId && (
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">System monitoring active</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600">Permissions up to date</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-gray-600">Ready for monitoring</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernCaretakerDashboard;
