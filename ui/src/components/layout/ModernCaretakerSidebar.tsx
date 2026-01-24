
import { SidebarContent } from "@/components/ui/sidebar";
import CaretakerSidebarHeader from "./CaretakerSidebarHeader";
import CaretakerPatientSelector from "./CaretakerPatientSelector";
import CaretakerNavigationMenu from "./CaretakerNavigationMenu";
import CaretakerSidebarFooter from "./CaretakerSidebarFooter";

const ModernCaretakerSidebar = () => {
  return (
    <div className="h-full bg-gradient-to-b from-green-50 to-emerald-50">
      <CaretakerSidebarHeader />
      
      <SidebarContent className="px-3 py-4 group-data-[collapsible=icon]:px-2">
        <CaretakerPatientSelector />
        <CaretakerNavigationMenu />
      </SidebarContent>

      <CaretakerSidebarFooter />
    </div>
  );
};

export default ModernCaretakerSidebar;
