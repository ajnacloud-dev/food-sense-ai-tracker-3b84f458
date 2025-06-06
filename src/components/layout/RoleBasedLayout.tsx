
import { useRole } from "@/contexts/RoleContext";
import { useCaretakerData } from "@/contexts/CaretakerDataContext";
import SidebarLayout from "./SidebarLayout";

interface RoleBasedLayoutProps {
  children: React.ReactNode;
}

const RoleBasedLayout = ({ children }: RoleBasedLayoutProps) => {
  const { currentRole, isLoading } = useRole();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // SidebarLayout now handles the sidebar selection internally based on userType
  return (
    <SidebarLayout>
      {children}
    </SidebarLayout>
  );
};

export default RoleBasedLayout;
