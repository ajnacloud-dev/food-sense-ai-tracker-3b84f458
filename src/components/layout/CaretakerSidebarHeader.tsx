
import { Link } from "react-router-dom";
import { Brain } from "lucide-react";
import { SidebarHeader } from "@/components/ui/sidebar";

const CaretakerSidebarHeader = () => {
  return (
    <SidebarHeader className="border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 p-3 group-data-[collapsible=icon]:p-2">
      <Link to="/caretaker" className="flex items-center gap-2 font-bold text-white group-data-[collapsible=icon]:justify-center">
        <Brain className="h-6 w-6 flex-shrink-0" />
        <span className="group-data-[collapsible=icon]:hidden">NutriWealth</span>
      </Link>
    </SidebarHeader>
  );
};

export default CaretakerSidebarHeader;
