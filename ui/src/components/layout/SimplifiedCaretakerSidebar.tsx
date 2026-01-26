
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
  Stethoscope
} from "lucide-react";
import { backendApi } from "@/lib/api/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useCaretakerData } from "@/contexts/CaretakerDataContext";
import { Badge } from "@/components/ui/badge";
import PWAUpdateIcon from "@/components/pwa/PWAUpdateIcon";

interface SimplifiedCaretakerSidebarProps {
  onItemClick?: () => void;
}

const SimplifiedCaretakerSidebar = ({ onItemClick }: SimplifiedCaretakerSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    participants, 
    selectedParticipantId, 
    setSelectedParticipantId, 
    loading, 
    error 
  } = useCaretakerData();

  const handleSignOut = async () => {
    try {
      await backendApi.auth.signOut();
      navigate("/");
    } catch (error) {
      toast.error("Error signing out");
    }
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
      <div className="flex h-14 items-center justify-between border-b border-gray-200 px-6 lg:h-[60px] bg-gradient-to-r from-blue-600 to-blue-700">
        <Link to="/caretaker" className="flex items-center gap-2 font-bold text-white">
          <Brain className="h-6 w-6" />
          <span>NutriWealth</span>
        </Link>
        <PWAUpdateIcon />
      </div>

      {/* Patient Selector */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <label className="text-sm font-semibold text-gray-800 mb-3 block flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          Active Patient
        </label>
        
        {loading ? (
          <div className="nw-card p-3 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ) : error ? (
          <div className="nw-card border-red-200 bg-red-50 p-3">
            <span className="text-sm text-red-600 font-medium">Error loading patients</span>
          </div>
        ) : participants.length > 0 ? (
          <Select
            value={selectedParticipantId || ''}
            onValueChange={(value) => {
              console.log('SimplifiedCaretakerSidebar: Patient selected:', value);
              setSelectedParticipantId(value);
            }}
          >
            <SelectTrigger className="nw-input h-12 bg-white border-gray-300 shadow-sm">
              <SelectValue placeholder="Select patient..." />
            </SelectTrigger>
            <SelectContent className="w-full bg-white border border-gray-200 shadow-lg rounded-lg">
              {participants.map((participant) => (
                <SelectItem key={participant.id} value={participant.id} className="hover:bg-gray-50">
                  <div className="flex items-center gap-3 min-w-0 flex-1 py-2">
                    <div className="nw-avatar w-8 h-8 bg-blue-100 text-blue-700 text-xs flex-shrink-0">
                      {participant.full_name.split(' ').map(n => n[0]).join('')}
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
          <div className="nw-card p-3 border-gray-200">
            <span className="text-sm text-gray-500">No patients available</span>
          </div>
        )}
        
        {/* Status info */}
        <div className="mt-3 flex items-center justify-between text-xs">
          {participants.length > 0 ? (
            <div className="nw-status-indicator nw-status-active">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{participants.length} patient(s) available</span>
            </div>
          ) : (
            <div className="nw-status-indicator nw-status-inactive">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span>No active patients</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
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
                className={`nw-sidebar-nav-item ${
                  isDisabled 
                    ? 'nw-sidebar-nav-item-disabled' 
                    : isActive
                    ? 'nw-sidebar-nav-item-active'
                    : 'nw-sidebar-nav-item-inactive'
                } nw-transition-smooth`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      {/* User info & Sign out */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        {user && (
          <div className="mb-4 p-3 bg-white rounded-lg nw-shadow-soft">
            <div className="flex items-center gap-3 mb-2">
              <div className="nw-avatar w-8 h-8 bg-blue-100 text-blue-700 text-sm">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge className="nw-role-badge-caretaker text-2xs">
                Healthcare Provider
              </Badge>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-700 hover:text-gray-900 hover:bg-gray-100 nw-transition-smooth"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          <span className="font-medium">Sign Out</span>
        </Button>
      </div>
    </div>
  );
};

export default SimplifiedCaretakerSidebar;
