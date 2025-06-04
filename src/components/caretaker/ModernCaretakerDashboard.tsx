
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Users, Heart, TrendingUp, Bell, Shield, Activity, Calendar, Utensils, FileText, Dumbbell, Plus } from "lucide-react";
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
      color: "from-orange-400 to-orange-600",
      route: "/caretaker/food",
      permission: "food_entries"
    },
    {
      title: "Receipts", 
      description: "Track purchases",
      icon: FileText,
      color: "from-blue-400 to-blue-600",
      route: "/caretaker/receipts",
      permission: "receipts"
    },
    {
      title: "Workouts",
      description: "View fitness activities", 
      icon: Dumbbell,
      color: "from-purple-400 to-purple-600",
      route: "/caretaker/workouts",
      permission: "workouts"
    },
    {
      title: "Health Insights",
      description: "View analytics & trends",
      icon: TrendingUp,
      color: "from-green-400 to-green-600",
      route: "/caretaker/insights",
      permission: null
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading your caretaker dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={refreshData} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-2xl p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">
              Welcome back, Caretaker! 👋
            </h1>
            <p className="text-blue-100 text-lg">
              Monitor and support your participants' health journey with comprehensive insights
            </p>
          </div>
          <div className="flex items-center gap-4 mt-6 lg:mt-0">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <Activity className="h-4 w-4 mr-2" />
              {participants.length} Participants
            </Badge>
            <Button 
              onClick={refreshData} 
              variant="outline" 
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              Refresh Data
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-700 text-sm font-medium mb-1">Total Participants</p>
                <p className="text-3xl font-bold text-blue-900">{stats.totalParticipants}</p>
                <p className="text-xs text-blue-600 mt-1">Under your care</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-700 text-sm font-medium mb-1">Active Members</p>
                <p className="text-3xl font-bold text-emerald-900">{stats.activeParticipants}</p>
                <p className="text-xs text-emerald-600 mt-1">Actively engaged</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-700 text-sm font-medium mb-1">Pending Invites</p>
                <p className="text-3xl font-bold text-amber-900">{stats.pendingInvites}</p>
                <p className="text-xs text-amber-600 mt-1">Awaiting response</p>
              </div>
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                <Bell className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 text-sm font-medium mb-1">Avg Health Score</p>
                <p className="text-3xl font-bold text-purple-900">{stats.avgHealthScore}%</p>
                <p className="text-xs text-purple-600 mt-1">Overall wellness</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Participant Selector */}
      {participants.length > 0 && (
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              Select Participant to Monitor
            </CardTitle>
            <CardDescription className="text-base">
              Choose a participant to view their detailed health data and insights
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                      isSelected 
                        ? 'ring-2 ring-blue-500 bg-blue-50 shadow-lg' 
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                    onClick={() => setSelectedParticipantId(participant.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-lg">
                            {getInitials(participant.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-lg truncate">{participant.full_name}</h3>
                          <p className="text-sm text-gray-600 truncate mb-2">{participant.email}</p>
                          <div className="flex items-center gap-2 mb-3">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(participant.status)}`} />
                            <span className="text-sm font-medium text-gray-700 capitalize">{participant.status}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Health Score</span>
                            <span className="text-sm font-bold text-gray-900">{participant.health_score}%</span>
                          </div>
                          <Progress value={participant.health_score} className="h-2" />
                        </div>
                        
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
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              Monitor {participantData.full_name}
            </CardTitle>
            <CardDescription className="text-base">
              Quick access to {participantData.full_name}'s health data and monitoring tools
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {quickActions.map((action) => {
                const Icon = action.icon;
                const canAccess = !action.permission || hasPermission(action.permission as any);
                
                return (
                  <Card 
                    key={action.title}
                    className={`cursor-pointer transition-all duration-200 border-0 hover:shadow-lg hover:-translate-y-1 ${
                      canAccess ? 'hover:scale-105' : 'opacity-60 cursor-not-allowed'
                    }`}
                    onClick={() => canAccess && navigate(action.route)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg mb-2">{action.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                      {!canAccess && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
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
      <Card className="shadow-lg border-0">
        <CardContent className="p-0">
          <Tabs defaultValue="relationships" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 m-6 mb-0">
              <TabsTrigger value="relationships" className="text-sm font-medium">
                Manage Relationships
              </TabsTrigger>
              <TabsTrigger value="invitations" className="text-sm font-medium">
                Invitation Codes
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="relationships" className="mt-0">
                <CareRelationshipManager onRelationshipUpdated={refreshData} />
              </TabsContent>

              <TabsContent value="invitations" className="mt-0">
                <InvitationCodeManager />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Empty State */}
      {participants.length === 0 && (
        <Card className="shadow-lg border-0">
          <CardContent className="p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Participants Yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
              Get started by inviting participants to join your care network or connect using an invitation code.
            </p>
            <div className="flex gap-4 justify-center">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium">
                <Plus className="h-4 w-4 mr-2" />
                Send Invitation
              </Button>
              <Button variant="outline" className="font-medium">
                Join with Code
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ModernCaretakerDashboard;
