
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  FileText, 
  Utensils, 
  Dumbbell, 
  BarChart3, 
  LogOut, 
  Heart,
  ArrowLeft,
  Users,
  Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { useCaretakerData } from "@/contexts/CaretakerDataContext";
import { usePermissionStatus } from "@/hooks/usePermissionStatus";

interface ModernCaretakerSidebarProps {
  onItemClick?: () => void;
}

const ModernCaretakerSidebar = ({ onItemClick }: ModernCaretakerSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDualRole } = useRole();
  const { 
    participants, 
    selectedParticipantId, 
    setSelectedParticipantId, 
    participantData,
    loading, 
    error 
  } = useCaretakerData();

  const { hasPermission } = usePermissionStatus(selectedParticipantId);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  const handleSwitchToParticipant = () => {
    navigate("/dashboard");
    onItemClick?.();
    toast.success("Switched to your health data view");
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const navigationItems = [
    { 
      name: "Dashboard", 
      href: "/caretaker", 
      icon: Heart,
      color: "text-red-500",
      permission: null
    },
    { 
      name: "Food Entries", 
      href: "/caretaker/food", 
      icon: Utensils,
      color: "text-orange-500",
      permission: "food_entries"
    },
    { 
      name: "Receipts", 
      href: "/caretaker/receipts", 
      icon: FileText,
      color: "text-blue-500",
      permission: "receipts"
    },
    { 
      name: "Workouts", 
      href: "/caretaker/workouts", 
      icon: Dumbbell,
      color: "text-purple-500",
      permission: "workouts"
    },
    { 
      name: "Insights", 
      href: "/caretaker/insights", 
      icon: BarChart3,
      color: "text-green-500",
      permission: null
    },
  ];

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <div className="flex h-16 items-center border-b border-slate-700 px-6">
        <Link to="/caretaker" className="flex items-center gap-3 font-bold text-xl">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            NutriWealth
          </span>
        </Link>
      </div>

      {/* Role Switcher */}
      {isDualRole && (
        <div className="p-4 border-b border-slate-700 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-emerald-300">Caretaker Mode</span>
            </div>
            <Heart className="h-4 w-4 text-emerald-400" />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwitchToParticipant}
            className="w-full text-xs bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30"
          >
            <ArrowLeft className="h-3 w-3 mr-2" />
            Back to My Health Data
          </Button>
        </div>
      )}

      {/* Selected Participant */}
      {selectedParticipantId && participantData && (
        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold text-sm">
                {getInitials(participantData.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{participantData.full_name}</p>
              <p className="text-xs text-slate-400 truncate">{participantData.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Shield className={`h-3 w-3 ${
                  hasPermission('food_entries') || hasPermission('receipts') || hasPermission('workouts') 
                    ? 'text-emerald-400' : 'text-amber-400'
                }`} />
                <Badge variant="outline" className={`text-xs ${
                  hasPermission('food_entries') || hasPermission('receipts') || hasPermission('workouts')
                    ? 'border-emerald-500/30 text-emerald-300' : 'border-amber-500/30 text-amber-300'
                }`}>
                  {hasPermission('food_entries') || hasPermission('receipts') || hasPermission('workouts') 
                    ? 'Access Granted' : 'Pending'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Participant Selector */}
      {!loading && !error && participants.length > 0 && !selectedParticipantId && (
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Select Participant</span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {participants.slice(0, 3).map((participant) => (
              <Button
                key={participant.id}
                variant="ghost"
                size="sm"
                onClick={() => setSelectedParticipantId(participant.id)}
                className="w-full justify-start h-auto p-2 text-left hover:bg-slate-700/50"
              >
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                    {getInitials(participant.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{participant.full_name}</p>
                  <p className="text-xs text-slate-400 truncate">{participant.email}</p>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            const canAccess = !item.permission || !selectedParticipantId || hasPermission(item.permission as any);
            const requiresParticipant = item.href !== '/caretaker' && !selectedParticipantId;
            
            return (
              <Link
                key={item.name}
                to={requiresParticipant ? '#' : item.href}
                onClick={(e) => {
                  if (requiresParticipant) {
                    e.preventDefault();
                    toast.error('Please select a participant first');
                    return;
                  }
                  if (!canAccess) {
                    e.preventDefault();
                    toast.error('Access permission required');
                    return;
                  }
                  onItemClick?.();
                }}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 transition-all group ${
                  isActive 
                    ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border-l-2 border-blue-400" 
                    : requiresParticipant || !canAccess
                    ? "text-slate-500 cursor-not-allowed" 
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? item.color : ''} group-hover:scale-110 transition-transform`} />
                <span className="font-medium">{item.name}</span>
                {requiresParticipant && (
                  <Badge variant="outline" className="ml-auto text-xs border-slate-600 text-slate-500">
                    Select participant
                  </Badge>
                )}
                {!canAccess && selectedParticipantId && item.permission && (
                  <Badge variant="outline" className="ml-auto text-xs border-amber-600 text-amber-400">
                    No access
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      {/* User Profile */}
      <div className="border-t border-slate-700 p-4">
        {user && (
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white text-sm">
                  {user.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.email}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Badge className="text-xs bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                    Caretaker
                  </Badge>
                  {isDualRole && (
                    <Badge className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/30">
                      Participant
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-700/50"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default ModernCaretakerSidebar;
