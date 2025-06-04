
import { useRole } from "@/contexts/RoleContext";
import { useCaretakerData } from "@/contexts/CaretakerDataContext";
import SidebarLayout from "./SidebarLayout";
import ParticipantSidebar from "./ParticipantSidebar";
import ModernCaretakerSidebar from "./ModernCaretakerSidebar";

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

  // Use modern caretaker sidebar for caretaker role
  if (currentRole === 'caretaker') {
    return (
      <SidebarLayout sidebar={<ModernCaretakerSidebar />}>
        {children}
      </SidebarLayout>
    );
  }

  // Use participant sidebar for participant role
  return (
    <SidebarLayout sidebar={<ParticipantSidebar />}>
      {children}
    </SidebarLayout>
  );
};

export default RoleBasedLayout;
