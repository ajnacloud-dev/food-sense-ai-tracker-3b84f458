
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  LayoutDashboard,
  Camera,
  Utensils,
  Receipt,
  Dumbbell,
  BarChart3,
  CreditCard,
  Menu,
  LogOut,
  Brain,
  Settings,
  Users,
  UserCheck,
  User,
  Crown,
  Shield,
  Mail
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

const SidebarLayout = ({ children }: SidebarLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [caretakerMode, setCaretakerMode] = useState<boolean>(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Fetch user role and subscription status from database
        const { data: userData } = await supabase
          .from('users')
          .select('role, is_subscribed')
          .eq('id', user.id)
          .single();
        
        if (userData?.role) {
          setUserRole(userData.role);
        }
        if (userData?.is_subscribed !== undefined) {
          setIsSubscribed(userData.is_subscribed);
        }

        // Load caretaker mode preference from localStorage
        const savedCaretakerMode = localStorage.getItem('caretaker_mode');
        if (savedCaretakerMode === 'true') {
          setCaretakerMode(true);
        }
      } else {
        navigate("/auth");
      }
    };
    getUser();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const handleCaretakerModeToggle = (checked: boolean) => {
    setCaretakerMode(checked);
    localStorage.setItem('caretaker_mode', checked.toString());
    
    // Navigate to appropriate dashboard based on mode
    if (checked) {
      navigate("/caretaker");
    } else {
      navigate("/dashboard");
    }
    
    toast.success(`Switched to ${checked ? 'Caretaker' : 'User'} mode`);
  };

  // Check if user is admin
  const isAdmin = userRole === 'admin';
  
  // Check if user has caretaker capabilities (for mode toggle)
  const hasCaretakerCapabilities = ['caretaker', 'dietitian', 'admin'].includes(userRole);

  // Define menu items based on current mode
  const getUserModeItems = () => {
    const items = [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
      { icon: Camera, label: "Capture", path: "/capture" },
      { icon: Utensils, label: "Food Analysis", path: "/food" },
      { icon: Receipt, label: "Receipts", path: "/receipts" },
      { icon: Dumbbell, label: "Workouts", path: "/workouts" },
      { icon: BarChart3, label: "Insights", path: "/insights" },
      { icon: Mail, label: "Invite Caretakers", path: "/invite-caretakers" },
      { icon: Shield, label: "Privacy & Permissions", path: "/privacy" },
      { icon: CreditCard, label: "Billing", path: "/billing" },
    ];
    
    // Admin users always see Admin menu regardless of mode
    if (isAdmin) {
      items.push({ icon: Settings, label: "Admin", path: "/admin" });
    }
    
    return items;
  };

  const getCaretakerModeItems = () => {
    const items = [
      { icon: Users, label: "My Patients", path: "/caretaker" },
      { icon: BarChart3, label: "Insights", path: "/insights" },
    ];
    
    // Admin users always see Admin menu regardless of mode
    if (isAdmin) {
      items.push({ icon: Settings, label: "Admin", path: "/admin" });
    }
    
    return items;
  };

  const menuItems = caretakerMode ? getCaretakerModeItems() : getUserModeItems();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center space-x-2">
          <Brain className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold">NutriWealth</span>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.path}
              variant={location.pathname === item.path ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                navigate(item.path);
                setOpen(false);
              }}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t">
        {/* Caretaker Mode Toggle - Only show for users with caretaker capabilities */}
        {hasCaretakerCapabilities && (
          <div className="p-3 bg-gray-50 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {caretakerMode ? (
                  <UserCheck className="h-4 w-4 text-blue-600" />
                ) : (
                  <User className="h-4 w-4 text-gray-600" />
                )}
                <span className="text-sm font-medium">
                  Caretaker Mode
                </span>
              </div>
              <Switch
                checked={caretakerMode}
                onCheckedChange={handleCaretakerModeToggle}
                aria-label="Toggle caretaker mode"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {caretakerMode ? 'Managing patients' : 'Switch to manage patients'}
            </p>
          </div>
        )}

        <div className="flex items-center space-x-3 mb-4">
          <Avatar>
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback>
              {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">
                {user?.user_metadata?.full_name || user?.email}
              </p>
              {isSubscribed && (
                <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 text-xs">
                  <Crown className="h-3 w-3 mr-1" />
                  Pro
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            {userRole !== 'user' && (
              <p className="text-xs text-blue-600 capitalize">{userRole}</p>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 bg-white border-r">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className={`lg:hidden fixed top-4 left-4 z-40 ${isMobile ? 'h-9 w-9' : ''}`}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className={`flex-1 ${isMobile ? 'p-4 pt-16' : 'p-6 lg:p-8'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;
