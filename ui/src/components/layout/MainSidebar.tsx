
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  Home,
  Users,
  Shield
} from "lucide-react";
import { backendApi } from "@/lib/api/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useUserType } from "@/contexts/UserTypeContext";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import PWAUpdateIcon from "@/components/pwa/PWAUpdateIcon";
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

export const MainSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userType } = useUserType();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      try {
        const { data: userData } = await backendApi
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        setIsAdmin(userData?.role === 'admin');
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminStatus();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await backendApi.auth.signOut();
      navigate("/");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Capture", href: "/capture", icon: Camera },
    { name: "Food Analysis", href: "/food", icon: Utensils },
    { name: "Receipts", href: "/receipts", icon: FileText },
    { name: "Workouts", href: "/workouts", icon: Dumbbell },
    { name: "Insights", href: "/insights", icon: BarChart3 },
    { name: "Billing", href: "/billing", icon: CreditCard },
  ];

  const settingsItems = [
    { name: "Invite Caretakers", href: "/invite-caretakers", icon: Users },
    { name: "Settings", href: "/participant", icon: Settings },
  ];

  const adminItems = [
    { name: "Admin Dashboard", href: "/admin", icon: Shield },
  ];

  return (
    <>
      <SidebarHeader className="border-b border-green-200/50 bg-gradient-to-r from-green-600 to-green-700 p-3 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-white group-data-[collapsible=icon]:justify-center">
            <Brain className="h-6 w-6 flex-shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">NutriWealth</span>
          </Link>
          <PWAUpdateIcon />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2 py-2 group-data-[collapsible=icon]:px-1">
        <SidebarGroup>
          <SidebarGroupLabel className="text-green-700 font-semibold text-xs mb-1 group-data-[collapsible=icon]:sr-only">
            Health Tracking
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={item.name}
                      className="h-9 hover:bg-green-50 hover:text-green-700 data-[active=true]:bg-green-100 data-[active=true]:text-green-700 group-data-[collapsible=icon]:h-10"
                    >
                      <Link to={item.href} className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-3">
          <SidebarGroupLabel className="text-green-700 font-semibold text-xs mb-1 group-data-[collapsible=icon]:sr-only">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={item.name}
                      className="h-9 hover:bg-green-50 hover:text-green-700 data-[active=true]:bg-green-100 data-[active=true]:text-green-700 group-data-[collapsible=icon]:h-10"
                    >
                      <Link to={item.href} className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup className="mt-3">
            <SidebarGroupLabel className="text-red-700 font-semibold text-xs mb-1 group-data-[collapsible=icon]:sr-only">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive}
                        tooltip={item.name}
                        className="h-9 hover:bg-red-50 hover:text-red-700 data-[active=true]:bg-red-100 data-[active=true]:text-red-700 group-data-[collapsible=icon]:h-10"
                      >
                        <Link to={item.href} className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-green-200/50 p-2 mt-auto">
        {user && (
          <div className="mb-2 p-2 bg-green-50 rounded-lg group-data-[collapsible=icon]:p-1">
            <div className="flex items-center gap-3 mb-2 group-data-[collapsible=icon]:mb-0 group-data-[collapsible=icon]:justify-center">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
              </div>
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                {userType === 'participant' ? 'Patient' : 'User'}
                {isAdmin && <span className="ml-1 text-red-600">• Admin</span>}
              </Badge>
            </div>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleSignOut}
              tooltip="Sign Out"
              className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100 h-9 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:justify-center"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
};
