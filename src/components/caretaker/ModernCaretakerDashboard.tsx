
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
  AlertCircle,
  Stethoscope,
  User
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
      title: "Nutrition Analysis",
      description: "Review daily food intake and nutritional patterns",
      icon: Utensils,
      href: "/caretaker/food",
      color: "text-green-700",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      hoverColor: "hover:bg-green-100",
      permission: "food_entries"
    },
    {
      title: "Receipt Analysis", 
      description: "Monitor spending patterns and food purchases",
      icon: FileText,
      href: "/caretaker/receipts",
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      hoverColor: "hover:bg-blue-100",
      permission: "receipts"
    },
    {
      title: "Exercise Monitoring",
      description: "Track physical activity and fitness progress",
      icon: Dumbbell,
      href: "/caretaker/workouts",
      color: "text-purple-700",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      hoverColor: "hover:bg-purple-100",
      permission: "workouts"
    },
    {
      title: "Health Insights",
      description: "Comprehensive analytics and trend analysis",
      icon: BarChart3,
      href: "/caretaker/insights",
      color: "text-indigo-700",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      hoverColor: "hover:bg-indigo-100",
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
              <p className="text-gray-600 font-medium">Loading patient dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          <Card className="max-w-2xl mx-auto mt-12 border-red-200 bg-red-50">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-800">Dashboard Error</CardTitle>
              <CardDescription className="text-red-700">
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
      <div className="space-y-6 p-6">
        {/* Medical-grade Header */}
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Healthcare Dashboard</h1>
                <p className="text-gray-600 mt-1">Patient monitoring and care management system</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid gap-6 lg:grid-cols-4">
          {/* Main Content - 3 columns */}
          <div className="lg:col-span-3 space-y-6">
            {/* Patient Selection */}
            {!selectedParticipantId && participants.length > 0 && (
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-xl">Select Patient</CardTitle>
                  </div>
                  <CardDescription>
                    Choose a patient to access their health monitoring dashboard.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {participants.map((participant) => (
                      <div
                        key={participant.id}
                        onClick={() => handleSelectParticipant(participant.id)}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="font-semibold text-blue-700 text-sm">
                                {participant.full_name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{participant.full_name}</h3>
                              <p className="text-sm text-gray-600">{participant.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
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
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Patient ID</div>
                            <div className="text-xs font-mono text-gray-400">
                              {participant.id.slice(-8)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selected Patient Overview */}
            {selectedParticipantId && participantData && (
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-gray-900">{participantData.full_name}</CardTitle>
                        <CardDescription className="text-gray-600">{participantData.email}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className={`h-4 w-4 ${
                        hasPermission('food_entries') || hasPermission('receipts') || hasPermission('workouts') 
                          ? 'text-green-600' : 'text-amber-500'
                      }`} />
                      <Badge 
                        variant={
                          hasPermission('food_entries') || hasPermission('receipts') || hasPermission('workouts')
                            ? 'default' : 'secondary'
                        }
                        className={
                          hasPermission('food_entries') || hasPermission('receipts') || hasPermission('workouts')
                            ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                        }
                      >
                        {hasPermission('food_entries') || hasPermission('receipts') || hasPermission('workouts') 
                          ? 'Full Access' : 'Limited Access'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        Active
                      </div>
                      <p className="text-sm text-gray-600">Monitoring Status</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-center mb-1">
                        <Activity className="h-6 w-6 text-blue-600" />
                      </div>
                      <p className="text-sm text-gray-600">Real-time Tracking</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-center mb-1">
                        <Clock className="h-6 w-6 text-green-600" />
                      </div>
                      <p className="text-sm text-gray-600">Live Updates</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Medical-grade Quick Actions */}
            {selectedParticipantId && (
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Patient Data Access
                  </CardTitle>
                  <CardDescription>
                    Access comprehensive health monitoring tools and analytics
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
                          className={`h-auto p-6 text-left justify-start border ${
                            canAccess 
                              ? `${action.borderColor} ${action.hoverColor} hover:shadow-sm` 
                              : 'border-gray-200 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-start gap-4 w-full">
                            <div className={`p-3 rounded-lg ${canAccess ? action.bgColor : 'bg-gray-100'} border ${canAccess ? action.borderColor : 'border-gray-200'}`}>
                              <Icon className={`h-6 w-6 ${canAccess ? action.color : 'text-gray-400'}`} />
                            </div>
                            <div className="flex-1 text-left">
                              <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                              <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                              {!canAccess && action.permission && (
                                <Badge variant="outline" className="text-xs border-amber-200 text-amber-700 bg-amber-50">
                                  Permission Required
                                </Badge>
                              )}
                              {canAccess && (
                                <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Authorized
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

          {/* Sidebar - 1 column */}
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
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">No Patients Assigned</CardTitle>
                  <CardDescription className="text-gray-600">
                    You don't have any patients to monitor yet. Patients need to provide you with their invitation code.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <p className="text-sm text-gray-600 mb-4">
                    To get started, ask a patient to share their invitation code with you.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* System Status */}
            {selectedParticipantId && (
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700">Monitoring Active</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">Data Sync Current</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700">Platform Online</span>
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
