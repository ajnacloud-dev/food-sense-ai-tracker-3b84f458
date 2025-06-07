
import { Link, useLocation } from "react-router-dom";
import { 
  FileText, 
  Utensils, 
  Dumbbell, 
  BarChart3, 
  Stethoscope
} from "lucide-react";
import { toast } from "sonner";
import { useCaretakerData } from "@/contexts/CaretakerDataContext";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const CaretakerNavigationMenu = () => {
  const location = useLocation();
  const { selectedParticipantId } = useCaretakerData();

  const navigationItems = [
    { name: "Dashboard", href: "/caretaker", icon: Stethoscope },
    { name: "Nutrition", href: "/caretaker/food", icon: Utensils },
    { name: "Receipts", href: "/caretaker/receipts", icon: FileText },
    { name: "Exercise", href: "/caretaker/workouts", icon: Dumbbell },
    { name: "Analytics", href: "/caretaker/insights", icon: BarChart3 },
  ];

  return (
    <SidebarGroup className="mt-3">
      <SidebarGroupLabel className="text-blue-700 font-semibold text-xs mb-1 group-data-[collapsible=icon]:sr-only">
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
                  tooltip={item.name}
                  className={`h-9 hover:bg-blue-50 hover:text-blue-700 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700 group-data-[collapsible=icon]:h-12 ${
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
                    <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">{item.name}</span>
                    </div>
                  ) : (
                    <Link to={item.href} className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">{item.name}</span>
                    </Link>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default CaretakerNavigationMenu;
