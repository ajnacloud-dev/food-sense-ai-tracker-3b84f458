
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Users, Heart, TrendingUp, Bell, Shield, Activity, Calendar, Utensils, FileText, Dumbbell } from "lucide-react";
import { useCaretakerData } from "@/contexts/CaretakerDataContext";
import { usePermissionStatus } from "@/hooks/usePermissionStatus";
import { useNavigate } from "react-router-dom";
import CareRelationshipManager from "./CareRelationshipManager";
import InvitationCodeManager from "./InvitationCodeManager";

const ModernCaretakerDashboard = () => {
  const navigate = useNavigate();
  const { 
    participants, 
    selectedParticipantId, 
    setSelectedParticipantId, 
    participantData,
    loading, 
    error,
    refreshData 
  } = useCaretakerData();

  const { hasPermission } = usePermissionStatus(selectedParticipantId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500';
      case 'pending': return 'bg-amber-500';
      case 'inactive': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Calculate stats
  const stats = {
    totalParticipants: participants.length,
    activeParticipants: participants.filter(p => p.status === 'active').length,
    pendingInvites: participants.filter(p => p.status === 'pending').length,
    avgHealthScore: Math.round(participants.reduce((acc, p) => acc + p.health_score, 0) / participants.length) || 0
  };

  const quickActions = [
    {
      title: "Food Entries",
      description: "Monitor nutrition intake",
      icon: Utensils,
      color: "bg-orange-500",
      route: "/caretaker/food",
      permission: "food_entries"
    },
    {
      title: "Receipts", 
      description: "Track purchases",
      icon: FileText,
      color: "bg-blue-500",
      route: "/caretaker/receipts",
      permission: "receipts"
    },
    {
      title: "Workouts",
      description: "View fitness activities", 
      icon: Dumbbell,
      color: "bg-purple-500",
      route: "/caretaker/workouts",
      permission: "workouts"
    },
    {
      title: "Insights",
      description: "Health analytics",
      icon: TrendingUp,
      color: "bg-green-500",
      route: "/caretaker/insights",
      permission: null
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={refreshData}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Caretaker Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Monitor and support your participants' health journey</p>
          </div>
          <div className="flex items-center gap-4 mt-4 lg:mt-0">
            <Badge variant="outline" className="bg-white">
              <Activity className="h-4 w-4 mr-1" />
              {participants.length} Participants
            </Badge>
            <Button onClick={refreshData} variant="outline" className="bg-white">
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Participants</p>
                  <p className="text-3xl font-bold">{stats.totalParticipants}</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Active</p>
                  <p className="text-3xl font-bold">{stats.activeParticipants}</p>
                </div>
                <Heart className="h-8 w-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Pending</p>
                  <p className="text-3xl font-bold">{stats.pendingInvites}</p>
                </div>
                <Bell className="h-8 w-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Avg Health Score</p>
                  <p className="text-3xl font-bold">{stats.avgHealthScore}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Participant Selector */}
        {participants.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Select Participant to Monitor
              </CardTitle>
              <CardDescription>Choose a participant to view their detailed health data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {participants.map((participant) => {
                  const isSelected = selectedParticipantId === participant.id;
                  const ParticipantPermissionStatus = () => {
                    const { hasPermission: hasAnyPermission } = usePermissionStatus(participant.id);
                    const hasAccess = hasAnyPermission('food_entries') || hasAnyPermission('receipts') || hasAnyPermission('workouts');
                    
                    return (
                      <div className="flex items-center gap-2">
                        <Shield className={`h-4 w-4 ${hasAccess ? 'text-emerald-500' : 'text-amber-500'}`} />
                        <Badge variant={hasAccess ? 'default' : 'secondary'} className="text-xs">
                          {hasAccess ? 'Access Granted' : 'Pending Access'}
                        </Badge>
                      </div>
                    );
                  };

                  return (
                    <Card 
                      key={participant.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedParticipantId(participant.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                              {getInitials(participant.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{participant.full_name}</h3>
                            <p className="text-sm text-gray-500 truncate">{participant.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(participant.status)}`} />
                              <span className="text-xs text-gray-600 capitalize">{participant.status}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-700">Health Score</span>
                            <span className="text-xs font-bold text-gray-900">{participant.health_score}%</span>
                          </div>
                          <Progress value={participant.health_score} className="h-2" />
                        </div>
                        <div className="mt-3">
                          <ParticipantPermissionStatus />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        {selectedParticipantId && participantData && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Monitor {participantData.full_name}
              </CardTitle>
              <CardDescription>Quick access to participant's health data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  const canAccess = !action.permission || hasPermission(action.permission as any);
                  
                  return (
                    <Card 
                      key={action.title}
                      className={`cursor-pointer transition-all hover:shadow-md border-0 ${
                        canAccess ? 'hover:scale-105' : 'opacity-50 cursor-not-allowed'
                      }`}
                      onClick={() => canAccess && navigate(action.route)}
                    >
                      <CardContent className="p-6 text-center">
                        <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center mx-auto mb-3`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-900">{action.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                        {!canAccess && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            Access Required
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Management Tabs */}
        <Tabs defaultValue="relationships" className="space-y-4">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="relationships">Manage Relationships</TabsTrigger>
            <TabsTrigger value="invitations">Invitation Codes</TabsTrigger>
          </TabsList>

          <TabsContent value="relationships">
            <CareRelationshipManager onRelationshipUpdated={refreshData} />
          </TabsContent>

          <TabsContent value="invitations">
            <InvitationCodeManager />
          </TabsContent>
        </Tabs>

        {/* Empty State */}
        {participants.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Participants Yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Get started by inviting participants or joining as a caretaker using an invitation code.
              </p>
              <div className="flex gap-3 justify-center">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500">
                  Send Invitation
                </Button>
                <Button variant="outline">
                  Join with Code
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ModernCaretakerDashboard;
