
import { Link } from "react-router-dom";
import { Brain } from "lucide-react";
import { SidebarHeader } from "@/components/ui/sidebar";

const CaretakerSidebarHeader = () => {
  return (
    <SidebarHeader className="border-b border-green-200 bg-gradient-to-r from-green-600 to-emerald-700 p-4 group-data-[collapsible=icon]:p-3">
      <Link to="/caretaker" className="flex items-center gap-3 font-bold text-white group-data-[collapsible=icon]:justify-center transition-all duration-200 hover:scale-105">
        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <Brain className="h-5 w-5 flex-shrink-0" />
        </div>
        <span className="group-data-[collapsible=icon]:hidden text-lg">NutriWealth</span>
      </Link>
    </SidebarHeader>
  );
};

export default CaretakerSidebarHeader;
