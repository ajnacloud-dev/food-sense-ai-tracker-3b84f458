
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  Camera, 
  FileText, 
  Utensils, 
  Dumbbell, 
  BarChart3, 
  CreditCard, 
  LogOut, 
  Home,
  Users,
  Shield,
  Settings
} from "lucide-react";
import { backendApi } from "@/lib/api/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { RoleSwitcher } from "./RoleSwitcher";
import { Badge } from "@/components/ui/badge";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Capture", href: "/capture", icon: Camera },
  { name: "Food", href: "/food", icon: Utensils },
  { name: "Receipts", href: "/receipts", icon: FileText },
  { name: "Workouts", href: "/workouts", icon: Dumbbell },
  { name: "Insights", href: "/insights", icon: BarChart3 },
];

const careItems = [
  { name: "Invite Caretakers", href: "/participant/invitations", icon: Users },
  { name: "Manage Permissions", href: "/participant/permissions", icon: Settings },
];

interface ParticipantSidebarProps {
  onItemClick?: () => void;
}

const ParticipantSidebar = ({ onItemClick }: ParticipantSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    hasCaretakerRelationships, 
    isLoading: roleLoading, 
    hasSubscription,
    isPureCaretaker,
    isDualRole
  } = useRole();
  const [userRole, setUserRole] = useState<string>('user');

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const { data: userData } = await backendApi
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (userData?.role) {
            setUserRole(userData.role);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      }
    };
    
    fetchUserRole();
  }, [user]);

  // If user is pure caretaker, redirect them immediately
  useEffect(() => {
    if (isPureCaretaker && !roleLoading) {
      console.log('ParticipantSidebar: Pure caretaker detected, redirecting to /caretaker');
      navigate('/caretaker', { replace: true });
    }
  }, [isPureCaretaker, roleLoading, navigate]);

  const handleSignOut = async () => {
    try {
      await backendApi.auth.signOut();
      navigate("/");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  // Don't render anything for pure caretakers (they should be redirected)
  if (isPureCaretaker) {
    return null;
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-white to-green-50/20 border-r border-green-200/50">
      {/* Enhanced Header */}
      <div className="flex h-14 items-center border-b border-green-200/50 px-6 lg:h-[60px] bg-gradient-to-r from-green-600 to-green-700 shadow-lg">
        <Link to="/dashboard" className="flex items-center gap-3 font-bold text-white hover:scale-105 transition-transform duration-200">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg tracking-tight">NutriWealth</span>
        </Link>
      </div>

      {/* Role Switcher for dual role users only */}
      {isDualRole && <RoleSwitcher onSwitch={onItemClick} />}
      
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-2">
          {/* Main Navigation */}
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onItemClick}
                  className={`nw-sidebar-nav-item group ${
                    isActive ? 'nw-sidebar-nav-item-active nw-green-glow' : 'nw-sidebar-nav-item-inactive'
                  } nw-transition-smooth`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-green-600' : 'text-gray-500 group-hover:text-green-600'} transition-colors duration-200`} />
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  )}
                </Link>
              );
            })}
            
            {hasSubscription && (
              <Link
                to="/billing"
                onClick={onItemClick}
                className={`nw-sidebar-nav-item group ${
                  location.pathname === "/billing" ? 'nw-sidebar-nav-item-active' : 'nw-sidebar-nav-item-inactive'
                } nw-transition-smooth`}
              >
                <CreditCard className={`h-5 w-5 ${location.pathname === "/billing" ? 'text-green-600' : 'text-gray-500 group-hover:text-green-600'} transition-colors duration-200`} />
                <span className="font-medium">Billing</span>
                {location.pathname === "/billing" && (
                  <div className="ml-auto w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                )}
              </Link>
            )}
          </div>
          
          <div className="nw-divider" />
          
          {/* Care Management Section */}
          <div className="px-3 py-2">
            <h3 className="mb-3 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              Care Management
            </h3>
            <div className="space-y-1">
              {careItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={onItemClick}
                    className={`nw-sidebar-nav-item group ${
                      isActive ? 'nw-sidebar-nav-item-active' : 'nw-sidebar-nav-item-inactive'
                    } nw-transition-smooth`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-green-600' : 'text-gray-500 group-hover:text-green-600'} transition-colors duration-200`} />
                    <span className="font-medium text-sm">{item.name}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse"></div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Admin Section */}
          {userRole === 'admin' && (
            <>
              <div className="nw-divider" />
              <div className="px-3 py-2">
                <h3 className="mb-3 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  Administration
                </h3>
                <Link
                  to="/admin"
                  onClick={onItemClick}
                  className={`nw-sidebar-nav-item group ${
                    location.pathname === "/admin" ? 'nw-sidebar-nav-item-active' : 'nw-sidebar-nav-item-inactive'
                  } nw-transition-smooth`}
                >
                  <Shield className={`h-4 w-4 ${location.pathname === "/admin" ? 'text-green-600' : 'text-gray-500 group-hover:text-green-600'} transition-colors duration-200`} />
                  <span className="font-medium text-sm">Admin Dashboard</span>
                  {location.pathname === "/admin" && (
                    <div className="ml-auto w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse"></div>
                  )}
                </Link>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Enhanced User info & Sign out */}
      <div className="border-t border-green-200/50 p-4 bg-gradient-to-r from-green-50/50 to-green-100/30">
        {user && (
          <div className="mb-4 p-4 bg-white rounded-xl nw-shadow-soft border border-green-200/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="nw-avatar-modern w-10 h-10 text-sm font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.email}</p>
                <p className="text-xs text-green-600 font-medium">Participant</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge className="nw-role-badge-participant text-2xs px-2 py-1">
                Participant
              </Badge>
              {userRole === 'admin' && (
                <Badge className="nw-role-badge-admin text-2xs px-2 py-1">
                  Administrator
                </Badge>
              )}
              {isDualRole && (
                <Badge className="nw-role-badge-caretaker text-2xs px-2 py-1">
                  Caretaker
                </Badge>
              )}
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-700 hover:text-green-700 hover:bg-green-50 nw-transition-smooth font-medium"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          <span className="font-medium">Sign Out</span>
        </Button>
      </div>
    </div>
  );
};

export default ParticipantSidebar;
