
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Brain, 
  Camera, 
  FileText, 
  Utensils, 
  Dumbbell, 
  BarChart3, 
  CreditCard, 
  Settings, 
  LogOut, 
  Menu,
  Home,
  Users,
  Heart,
  Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Capture", href: "/capture", icon: Camera },
  { name: "Food", href: "/food", icon: Utensils },
  { name: "Receipts", href: "/receipts", icon: FileText },
  { name: "Workouts", href: "/workouts", icon: Dumbbell },
  { name: "Insights", href: "/insights", icon: BarChart3 },
  { name: "Billing", href: "/billing", icon: CreditCard },
];

const careItems = [
  { name: "Caretaker Dashboard", href: "/caretaker", icon: Heart },
  { name: "Invite Caretakers", href: "/invite-caretakers", icon: Users },
];

interface SidebarLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string>('user');

  // Fetch user role on component mount
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
      
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
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
                    isActive ? "nw-sidebar-nav-item-active nw-green-glow" : "nw-sidebar-nav-item-inactive"
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
          </div>
          
          <div className="nw-divider" />
          
          {/* Care Management Section */}
          <div className="px-2 py-2">
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
                      isActive ? "nw-sidebar-nav-item-active" : "nw-sidebar-nav-item-inactive"
                    } nw-transition-smooth`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-green-600' : 'text-gray-500 group-hover:text-green-600'} transition-colors duration-200`} />
                    <span className="font-medium text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Admin Section */}
          {userRole === 'admin' && (
            <>
              <div className="nw-divider" />
              <div className="px-2 py-2">
                <h3 className="mb-3 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  Administration
                </h3>
                <Link
                  to="/admin"
                  onClick={onItemClick}
                  className={`nw-sidebar-nav-item group ${
                    location.pathname === "/admin" ? "nw-sidebar-nav-item-active" : "nw-sidebar-nav-item-inactive"
                  } nw-transition-smooth`}
                >
                  <Shield className={`h-4 w-4 ${location.pathname === "/admin" ? 'text-green-600' : 'text-gray-500 group-hover:text-green-600'} transition-colors duration-200`} />
                  <span className="font-medium text-sm">Admin Dashboard</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Enhanced User Section */}
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
            {userRole === 'admin' && (
              <div className="flex flex-wrap gap-1">
                <span className="nw-role-badge-admin text-2xs px-2 py-1 rounded-full">
                  Administrator
                </span>
              </div>
            )}
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-700 hover:text-green-700 hover:bg-green-50 nw-transition-smooth font-medium"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

const SidebarLayout = ({ children, sidebar }: SidebarLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] bg-gradient-to-br from-green-50/30 via-white to-green-50/20">
      <div className="hidden border-r border-green-200/50 md:block">
        {sidebar ? sidebar : <SidebarContent />}
      </div>
      
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b border-green-200/50 bg-white/80 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6 md:hidden shadow-sm">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 border-green-200 hover:bg-green-50">
                <Menu className="h-5 w-5 text-green-600" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 border-green-200/50">
              {sidebar ? sidebar : <SidebarContent onItemClick={() => setSidebarOpen(false)} />}
            </SheetContent>
          </Sheet>
        </header>
        
        <main className="flex-1 overflow-auto p-4 lg:p-6 bg-gradient-to-br from-green-50/20 via-white to-green-50/10">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;
