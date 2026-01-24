
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
    { name: "Dashboard", href: "/caretaker", icon: Stethoscope, color: "text-green-600" },
    { name: "Nutrition", href: "/caretaker/food", icon: Utensils, color: "text-emerald-600" },
    { name: "Receipts", href: "/caretaker/receipts", icon: FileText, color: "text-blue-600" },
    { name: "Exercise", href: "/caretaker/workouts", icon: Dumbbell, color: "text-purple-600" },
    { name: "Analytics", href: "/caretaker/insights", icon: BarChart3, color: "text-orange-600" },
  ];

  return (
    <SidebarGroup className="mt-6">
      <SidebarGroupLabel className="text-green-700 font-bold text-sm mb-3 group-data-[collapsible=icon]:sr-only">
        Patient Care
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="space-y-2">
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
                  className={`h-12 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-green-100 text-green-800 shadow-sm border border-green-200' 
                      : isDisabled 
                      ? 'opacity-50 cursor-not-allowed text-gray-400' 
                      : 'hover:bg-green-50 hover:text-green-700 text-gray-600'
                  } group-data-[collapsible=icon]:h-14 group-data-[collapsible=icon]:w-14`}
                  onClick={(e) => {
                    if (isDisabled) {
                      e.preventDefault();
                      toast.error('Please select a patient first');
                      return;
                    }
                  }}
                >
                  {isDisabled ? (
                    <div className="flex items-center gap-4 group-data-[collapsible=icon]:justify-center">
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-green-200' : 'bg-gray-100'}`}>
                        <Icon className="h-5 w-5 flex-shrink-0" />
                      </div>
                      <span className="font-semibold text-sm group-data-[collapsible=icon]:hidden">{item.name}</span>
                    </div>
                  ) : (
                    <Link to={item.href} className="flex items-center gap-4 group-data-[collapsible=icon]:justify-center w-full">
                      <div className={`p-2 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-green-200' 
                          : 'bg-white shadow-sm group-hover:bg-green-100'
                      }`}>
                        <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-green-700' : item.color}`} />
                      </div>
                      <span className="font-semibold text-sm group-data-[collapsible=icon]:hidden">{item.name}</span>
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
