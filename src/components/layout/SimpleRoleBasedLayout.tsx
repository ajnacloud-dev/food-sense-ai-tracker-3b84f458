
import { useUserType } from "@/contexts/UserTypeContext";
import SidebarLayout from "./SidebarLayout";
import ParticipantSidebar from "./ParticipantSidebar";
import ModernCaretakerSidebar from "./ModernCaretakerSidebar";

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

  // Use caretaker sidebar for caretakers
  if (userType === 'caretaker') {
    return (
      <SidebarLayout sidebar={<ModernCaretakerSidebar />}>
        {children}
      </SidebarLayout>
    );
  }

  // Use participant sidebar for participants (default)
  return (
    <SidebarLayout sidebar={<ParticipantSidebar />}>
      {children}
    </SidebarLayout>
  );
};

export default SimpleRoleBasedLayout;
