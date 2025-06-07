
import { SidebarContent } from "@/components/ui/sidebar";
import CaretakerSidebarHeader from "./CaretakerSidebarHeader";
import CaretakerPatientSelector from "./CaretakerPatientSelector";
import CaretakerNavigationMenu from "./CaretakerNavigationMenu";
import CaretakerSidebarFooter from "./CaretakerSidebarFooter";

const ModernCaretakerSidebar = () => {
  return (
    <>
      <CaretakerSidebarHeader />
      
      <SidebarContent className="px-2 py-2 group-data-[collapsible=icon]:px-1">
        <CaretakerPatientSelector />
        <CaretakerNavigationMenu />
      </SidebarContent>

      <CaretakerSidebarFooter />
    </>
  );
};

export default ModernCaretakerSidebar;
