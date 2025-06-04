
import { useState } from "react";
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
  Settings,
  Heart
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { RoleSwitcher } from "./RoleSwitcher";

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

  useState(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const { data: userData } = await supabase
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
  });

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  // If user is pure caretaker, redirect them
  if (isPureCaretaker) {
    navigate('/caretaker');
    return null;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
          <Brain className="h-6 w-6 text-blue-600" />
          <span>NutriWealth</span>
        </Link>
      </div>

      {/* Role Switcher for dual role users */}
      <RoleSwitcher onSwitch={onItemClick} />
      
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            // Hide billing unless user has subscription or is admin
            if (item.name === "Billing" && !hasSubscription && userRole !== 'admin') {
              return null;
            }
            
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onItemClick}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100 ${
                  location.pathname === item.href ? "bg-gray-100 text-gray-900" : ""
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
          
          {hasSubscription && (
            <Link
              to="/billing"
              onClick={onItemClick}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100 ${
                location.pathname === "/billing" ? "bg-gray-100 text-gray-900" : ""
              }`}
            >
              <CreditCard className="h-4 w-4" />
              Billing
            </Link>
          )}
          
          <Separator className="my-4" />
          
          <div className="px-3 py-2">
            <h3 className="mb-2 text-sm font-medium text-gray-500 uppercase tracking-wide">
              Care Management
            </h3>
            {careItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onItemClick}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100 ${
                    location.pathname === item.href ? "bg-gray-100 text-gray-900" : ""
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
            
            {!roleLoading && hasCaretakerRelationships && !isDualRole && (
              <Link
                to="/caretaker"
                onClick={onItemClick}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100 ${
                  location.pathname === "/caretaker" ? "bg-gray-100 text-gray-900" : ""
                }`}
              >
                <Heart className="h-4 w-4" />
                Caretaker Dashboard
              </Link>
            )}
          </div>

          {userRole === 'admin' && (
            <>
              <Separator className="my-4" />
              <div className="px-3 py-2">
                <h3 className="mb-2 text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Administration
                </h3>
                <Link
                  to="/admin"
                  onClick={onItemClick}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100 ${
                    location.pathname === "/admin" ? "bg-gray-100 text-gray-900" : ""
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  Admin Dashboard
                </Link>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        {user && (
          <div className="mb-4 px-3">
            <p className="text-sm font-medium text-gray-900">{user.email}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              <p className="text-xs text-blue-600 font-medium">Participant</p>
              {userRole === 'admin' && (
                <p className="text-xs text-red-600 font-medium">• Administrator</p>
              )}
              {hasCaretakerRelationships && (
                <p className="text-xs text-green-600 font-medium">• Caretaker</p>
              )}
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default ParticipantSidebar;
