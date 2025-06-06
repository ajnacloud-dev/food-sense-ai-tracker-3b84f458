
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Brain, 
  FileText, 
  Utensils, 
  Dumbbell, 
  BarChart3, 
  LogOut, 
  Stethoscope,
  User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useUserType } from "@/contexts/UserTypeContext";
import { useCaretakerData } from "@/contexts/CaretakerDataContext";
import { Badge } from "@/components/ui/badge";
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

const ModernCaretakerSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userType } = useUserType();
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

  const navigationItems = [
    { name: "Dashboard", href: "/caretaker", icon: Stethoscope },
    { name: "Nutrition", href: "/caretaker/food", icon: Utensils },
    { name: "Receipts", href: "/caretaker/receipts", icon: FileText },
    { name: "Exercise", href: "/caretaker/workouts", icon: Dumbbell },
    { name: "Analytics", href: "/caretaker/insights", icon: BarChart3 },
  ];

  return (
    <>
      <SidebarHeader className="border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 p-3">
        <Link to="/caretaker" className="flex items-center gap-2 font-bold text-white">
          <Brain className="h-6 w-6" />
          <span className="group-data-[collapsible=icon]:hidden">NutriWealth</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {/* Patient Selector */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-blue-700 font-semibold text-xs mb-2">
            Active Patient
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {loading ? (
              <div className="p-3 bg-gray-50 rounded-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ) : error ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <span className="text-sm text-red-600 font-medium">Error loading patients</span>
              </div>
            ) : participants.length > 0 ? (
              <Select
                value={selectedParticipantId || ''}
                onValueChange={(value) => {
                  console.log('ModernCaretakerSidebar: Patient selected:', value);
                  setSelectedParticipantId(value);
                }}
              >
                <SelectTrigger className="h-10 bg-white border-gray-300 shadow-sm group-data-[collapsible=icon]:hidden">
                  <SelectValue placeholder="Select patient..." />
                </SelectTrigger>
                <SelectContent className="w-full bg-white border border-gray-200 shadow-lg rounded-lg">
                  {participants.map((participant) => (
                    <SelectItem key={participant.id} value={participant.id} className="hover:bg-gray-50">
                      <div className="flex items-center gap-3 min-w-0 flex-1 py-1">
                        <div className="w-6 h-6 bg-blue-100 text-blue-700 text-xs flex-shrink-0 rounded-full flex items-center justify-center font-medium">
                          {participant.full_name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 truncate text-sm">{participant.full_name}</div>
                          <div className="text-xs text-gray-500 truncate">{participant.email}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-sm text-gray-500">No patients available</span>
              </div>
            )}
            
            {/* Status info */}
            <div className="mt-2 flex items-center text-xs group-data-[collapsible=icon]:hidden">
              {participants.length > 0 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{participants.length} patient(s) available</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span>No active patients</span>
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Navigation */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-blue-700 font-semibold text-xs mb-2">
            Patient Care
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                const isDisabled = item.href !== '/caretaker' && !selectedParticipantId;
                
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild={!isDisabled}
                      isActive={isActive}
                      className={`h-9 hover:bg-blue-50 hover:text-blue-700 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700 ${
                        isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      onClick={(e) => {
                        if (isDisabled) {
                          e.preventDefault();
                          toast.error('Please select a patient first');
                          return;
                        }
                      }}
                    >
                      {isDisabled ? (
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium text-sm">{item.name}</span>
                        </div>
                      ) : (
                        <Link to={item.href} className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium text-sm">{item.name}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 p-3">
        {user && (
          <div className="mb-3 p-3 bg-blue-50 rounded-lg group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
              Healthcare Provider
            </Badge>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleSignOut}
              className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100 h-9"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium text-sm">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
};

export default ModernCaretakerSidebar;
