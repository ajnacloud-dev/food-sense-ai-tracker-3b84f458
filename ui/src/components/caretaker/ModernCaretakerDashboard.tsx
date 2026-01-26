
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
  User,
  Plus
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
      bgColor: "bg-gradient-to-br from-green-500 to-emerald-600",
      borderColor: "border-green-200",
      hoverColor: "hover:from-green-600 hover:to-emerald-700",
      permission: "food_entries"
    },
    {
      title: "Receipt Analysis", 
      description: "Monitor spending patterns and food purchases",
      icon: FileText,
      href: "/caretaker/receipts",
      color: "text-blue-700",
      bgColor: "bg-gradient-to-br from-blue-500 to-indigo-600",
      borderColor: "border-blue-200",
      hoverColor: "hover:from-blue-600 hover:to-indigo-700",
      permission: "receipts"
    },
    {
      title: "Exercise Monitoring",
      description: "Track physical activity and fitness progress",
      icon: Dumbbell,
      href: "/caretaker/workouts",
      color: "text-purple-700",
      bgColor: "bg-gradient-to-br from-purple-500 to-pink-600",
      borderColor: "border-purple-200",
      hoverColor: "hover:from-purple-600 hover:to-pink-700",
      permission: "workouts"
    },
    {
      title: "Health Insights",
      description: "Comprehensive analytics and trend analysis",
      icon: BarChart3,
      href: "/caretaker/insights",
      color: "text-orange-700",
      bgColor: "bg-gradient-to-br from-orange-500 to-red-600",
      borderColor: "border-orange-200",
      hoverColor: "hover:from-orange-600 hover:to-red-700",
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto"></div>
              <p className="text-gray-600 font-medium">Loading healthcare dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="space-y-8 p-6">
        {/* Modern Healthcare Header */}
        <div className="max-w-7xl mx-auto">
          <Card className="bg-gradient-to-r from-green-600 to-emerald-700 text-white border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Stethoscope className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">Healthcare Dashboard</h1>
                  <p className="text-green-100 text-lg">Advanced patient monitoring and care management platform</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-4">
          {/* Main Content - 3 columns */}
          <div className="lg:col-span-3 space-y-8">
            {/* Patient Selection */}
            {!selectedParticipantId && participants.length > 0 && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-gray-900">Select Patient</CardTitle>
                      <CardDescription className="text-lg">
                        Choose a patient to access their comprehensive health monitoring dashboard.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    {participants.map((participant) => (
                      <Card
                        key={participant.id}
                        onClick={() => handleSelectParticipant(participant.id)}
                        className="p-6 hover:shadow-lg cursor-pointer transition-all duration-300 hover:scale-[1.02] border-2 hover:border-green-300 bg-white"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                              <span className="font-bold text-white text-lg">
                                {participant.full_name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{participant.full_name}</h3>
                              <p className="text-gray-600 mb-2">{participant.email}</p>
                              <div className="flex items-center gap-3">
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  {participant.caretaker_type.replace('_', ' ')}
                                </Badge>
                                <Badge 
                                  variant={participant.status === 'active' ? 'default' : 'secondary'}
                                  className={participant.status === 'active' ? 'bg-emerald-100 text-emerald-800' : ''}
                                >
                                  {participant.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-600">Patient ID</div>
                            <div className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">
                              {participant.id.slice(-8)}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selected Patient Overview */}
            {selectedParticipantId && participantData && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="pb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                        <User className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-gray-900">{participantData.full_name}</CardTitle>
                        <CardDescription className="text-lg text-gray-600">{participantData.email}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className={`h-6 w-6 ${
                        hasPermission('food_entries') || hasPermission('receipts') || hasPermission('workouts') 
                          ? 'text-green-600' : 'text-amber-500'
                      }`} />
                      <Badge 
                        className={
                          hasPermission('food_entries') || hasPermission('receipts') || hasPermission('workouts')
                            ? 'bg-green-100 text-green-800 border-green-200 text-base px-4 py-2' : 'bg-amber-100 text-amber-800 border-amber-200 text-base px-4 py-2'
                        }
                      >
                        {hasPermission('food_entries') || hasPermission('receipts') || hasPermission('workouts') 
                          ? 'Full Access' : 'Limited Access'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
                      <CardContent className="p-6 text-center">
                        <div className="text-2xl font-bold mb-2">Active</div>
                        <p className="text-green-100">Monitoring Status</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
                      <CardContent className="p-6 text-center">
                        <Activity className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-blue-100">Real-time Tracking</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0">
                      <CardContent className="p-6 text-center">
                        <Clock className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-purple-100">Live Updates</p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Modern Quick Actions */}
            {selectedParticipantId && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                    Patient Care Tools
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Access comprehensive health monitoring and analysis tools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      const canAccess = !action.permission || hasPermission(action.permission as any);
                      
                      return (
                        <Card
                          key={action.title}
                          onClick={() => canAccess && handleActionClick(action.href, action.permission)}
                          className={`group cursor-pointer transition-all duration-300 border-0 ${
                            canAccess 
                              ? 'hover:scale-[1.02] hover:shadow-xl' 
                              : 'opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <CardContent className={`p-0 ${canAccess ? action.bgColor : 'bg-gray-400'} text-white relative overflow-hidden`}>
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300"></div>
                            <div className="relative p-8">
                              <div className="flex items-start gap-4">
                                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                                  <Icon className="h-8 w-8" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold mb-2">{action.title}</h3>
                                  <p className="text-white/90 mb-4 leading-relaxed">{action.description}</p>
                                  {canAccess ? (
                                    <Badge className="bg-white/20 text-white border-white/30">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Authorized
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-red-500/20 text-white border-red-300/30">
                                      Permission Required
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Enhanced Sidebar */}
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
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="text-center pb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Users className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="text-xl">No Patients Assigned</CardTitle>
                  <CardDescription className="text-gray-600">
                    You don't have any patients to monitor yet. Patients need to provide you with their invitation code.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <p className="text-sm text-gray-600 mb-6">
                    To get started, ask a patient to share their invitation code with you.
                  </p>
                  <Button className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Enhanced System Status */}
            {selectedParticipantId && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-800 font-medium">Monitoring Active</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-blue-800 font-medium">Data Sync Current</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-emerald-800 font-medium">Platform Online</span>
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
