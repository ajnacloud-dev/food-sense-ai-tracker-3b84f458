
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Brain, 
  FileText, 
  Utensils, 
  Dumbbell, 
  BarChart3, 
  LogOut, 
  Stethoscope,
  ArrowLeft,
  User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { useCaretakerData } from "@/contexts/CaretakerDataContext";
import { RoleSwitcher } from "./RoleSwitcher";
import { Badge } from "@/components/ui/badge";

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
    loading, 
    error 
  } = useCaretakerData();

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

  const navigationItems = [
    { name: "Dashboard", href: "/caretaker", icon: Stethoscope },
    { name: "Nutrition", href: "/caretaker/food", icon: Utensils },
    { name: "Receipts", href: "/caretaker/receipts", icon: FileText },
    { name: "Exercise", href: "/caretaker/workouts", icon: Dumbbell },
    { name: "Analytics", href: "/caretaker/insights", icon: BarChart3 },
  ];

  return (
    <div className="flex h-full flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex h-14 items-center border-b border-gray-200 px-4 lg:h-[60px] lg:px-6">
        <Link to="/caretaker" className="flex items-center gap-2 font-semibold">
          <Brain className="h-6 w-6 text-blue-600" />
          <span className="text-gray-900">NutriWealth</span>
        </Link>
      </div>

      {/* Role Switcher for dual-role users */}
      <RoleSwitcher onSwitch={onItemClick} />

      {/* Current mode indicator for dual role users */}
      {isDualRole && (
        <div className="px-4 py-3 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">Healthcare Provider Mode</span>
            <Stethoscope className="h-4 w-4 text-blue-600" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSwitchToParticipant}
            className="w-full mt-2 text-xs h-8 text-blue-700 hover:text-blue-800 hover:bg-blue-100"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back to My Health Data
          </Button>
        </div>
      )}

      {/* Patient Selector */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Active Patient:
        </label>
        
        {loading ? (
          <div className="text-sm text-gray-500 p-3 border border-gray-200 rounded-md bg-white animate-pulse">
            Loading patients...
          </div>
        ) : error ? (
          <div className="text-sm text-red-600 p-3 border border-red-200 rounded-md bg-red-50">
            Error loading patients
          </div>
        ) : participants.length > 0 ? (
          <Select
            value={selectedParticipantId || ''}
            onValueChange={(value) => {
              console.log('ModernCaretakerSidebar: Patient selected:', value);
              setSelectedParticipantId(value);
            }}
          >
            <SelectTrigger className="w-full bg-white border-gray-200">
              <SelectValue placeholder="Select patient..." />
            </SelectTrigger>
            <SelectContent className="w-full">
              {participants.map((participant) => (
                <SelectItem key={participant.id} value={participant.id}>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-blue-700">
                        {participant.full_name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 truncate">{participant.full_name}</div>
                      <div className="text-xs text-gray-500 truncate">{participant.email}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="text-sm text-gray-500 p-3 border border-gray-200 rounded-md bg-white">
            No patients found
          </div>
        )}
        
        {/* Status info */}
        <div className="mt-2 text-xs text-gray-500">
          {participants.length > 0 ? (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{participants.length} patient(s) available</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span>No active patients</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-2">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isDisabled = item.href !== '/caretaker' && !selectedParticipantId;
            
            return (
              <Link
                key={item.name}
                to={isDisabled ? '#' : item.href}
                onClick={(e) => {
                  if (isDisabled) {
                    e.preventDefault();
                    toast.error('Please select a patient first');
                    return;
                  }
                  onItemClick?.();
                }}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-sm ${
                  isDisabled 
                    ? "text-gray-300 cursor-not-allowed" 
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                } ${
                  location.pathname === item.href ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600" : ""
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      {/* User info & Sign out */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        {user && (
          <div className="mb-4 px-3">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-gray-500" />
              <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                Healthcare Provider
              </Badge>
              {isDualRole && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
                  Participant
                </Badge>
              )}
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
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
