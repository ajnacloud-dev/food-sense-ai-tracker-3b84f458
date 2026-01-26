
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { backendApi } from "@/lib/api/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const CaretakerSidebarFooter = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await backendApi.auth.signOut();
      navigate("/");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  return (
    <SidebarFooter className="border-t border-gray-200 p-2 mt-auto">
      {user && (
        <div className="mb-2 p-2 bg-blue-50 rounded-lg group-data-[collapsible=icon]:p-1">
          <div className="flex items-center gap-3 mb-2 group-data-[collapsible=icon]:mb-0 group-data-[collapsible=icon]:justify-center">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
            </div>
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
              Healthcare Provider
            </Badge>
          </div>
        </div>
      )}
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton 
            onClick={handleSignOut}
            tooltip="Sign Out"
            className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100 h-9 group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:justify-center"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">Sign Out</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
};

export default CaretakerSidebarFooter;
