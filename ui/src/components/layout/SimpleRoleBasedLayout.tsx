
import { useUserType } from "@/contexts/UserTypeContext";
import SidebarLayout from "./SidebarLayout";

interface SimpleRoleBasedLayoutProps {
  children: React.ReactNode;
}

const SimpleRoleBasedLayout = ({ children }: SimpleRoleBasedLayoutProps) => {
  const { userType, isLoading } = useUserType();

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

export default SimpleRoleBasedLayout;
