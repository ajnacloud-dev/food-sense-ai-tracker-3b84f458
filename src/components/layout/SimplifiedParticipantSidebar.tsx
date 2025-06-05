
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
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

interface SimplifiedParticipantSidebarProps {
  onItemClick?: () => void;
}

const SimplifiedParticipantSidebar = ({ onItemClick }: SimplifiedParticipantSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string>('user');
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('role, is_subscribed')
            .eq('id', user.id)
            .single();
          
          if (userData?.role) {
            setUserRole(userData.role);
          }
          setHasSubscription(userData?.is_subscribed || false);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };
    
    fetchUserData();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  return (
    <div className="flex h-full flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex h-14 items-center border-b border-gray-200 px-6 lg:h-[60px] bg-gradient-to-r from-green-600 to-green-700">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-white">
          <Brain className="h-6 w-6" />
          <span>NutriWealth</span>
        </Link>
      </div>
      
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onItemClick}
                className={`nw-sidebar-nav-item ${
                  isActive ? 'nw-sidebar-nav-item-active' : 'nw-sidebar-nav-item-inactive'
                } nw-transition-smooth`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
          
          {hasSubscription && (
            <Link
              to="/billing"
              onClick={onItemClick}
              className={`nw-sidebar-nav-item ${
                location.pathname === "/billing" ? 'nw-sidebar-nav-item-active' : 'nw-sidebar-nav-item-inactive'
              } nw-transition-smooth`}
            >
              <CreditCard className="h-4 w-4" />
              <span className="font-medium">Billing</span>
            </Link>
          )}
          
          <div className="nw-divider" />
          
          <div className="px-3 py-2">
            <h3 className="mb-3 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
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
                    className={`nw-sidebar-nav-item ${
                      isActive ? 'nw-sidebar-nav-item-active' : 'nw-sidebar-nav-item-inactive'
                    } nw-transition-smooth`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {userRole === 'admin' && (
            <>
              <div className="nw-divider" />
              <div className="px-3 py-2">
                <h3 className="mb-3 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                  Administration
                </h3>
                <Link
                  to="/admin"
                  onClick={onItemClick}
                  className={`nw-sidebar-nav-item ${
                    location.pathname === "/admin" ? 'nw-sidebar-nav-item-active' : 'nw-sidebar-nav-item-inactive'
                  } nw-transition-smooth`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">Admin Dashboard</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* User info & Sign out */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        {user && (
          <div className="mb-4 p-3 bg-white rounded-lg nw-shadow-soft">
            <div className="flex items-center gap-3 mb-2">
              <div className="nw-avatar w-8 h-8 bg-green-100 text-green-700 text-sm">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge className="nw-role-badge-participant text-2xs">
                Participant
              </Badge>
              {userRole === 'admin' && (
                <Badge className="nw-role-badge-admin text-2xs">
                  Administrator
                </Badge>
              )}
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

export default SimplifiedParticipantSidebar;
