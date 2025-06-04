
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { CaretakerDataProvider } from "@/contexts/CaretakerDataContext";
import ParticipantSidebar from "./ParticipantSidebar";
import CaretakerSidebar from "./CaretakerSidebar";

interface RoleBasedLayoutProps {
  children: React.ReactNode;
  selectedParticipantId?: string;
  onParticipantChange?: (participantId: string) => void;
}

const RoleBasedLayout = ({ children, selectedParticipantId, onParticipantChange }: RoleBasedLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { currentRole, isPureCaretaker, isPureParticipant, isDualRole } = useRole();

  // Determine which sidebar to show based on user type and current role
  const getCurrentSidebar = () => {
    const path = window.location.pathname;
    
    console.log('RoleBasedLayout: Determining sidebar', {
      isPureCaretaker,
      isPureParticipant,
      isDualRole,
      currentRole,
      path
    });
    
    // Pure caretaker: ALWAYS show caretaker sidebar
    if (isPureCaretaker) {
      console.log('RoleBasedLayout: Showing caretaker sidebar for pure caretaker');
      return <CaretakerSidebar />;
    }
    
    // Pure participant: ALWAYS show participant sidebar
    if (isPureParticipant) {
      console.log('RoleBasedLayout: Showing participant sidebar for pure participant');
      return <ParticipantSidebar />;
    }
    
    // Dual role users: show based on current role or path
    if (isDualRole) {
      const isCaretakerPath = path.startsWith('/caretaker');
      
      if (isCaretakerPath || currentRole === 'caretaker') {
        console.log('RoleBasedLayout: Showing caretaker sidebar for dual role user in caretaker mode');
        return <CaretakerSidebar />;
      } else {
        console.log('RoleBasedLayout: Showing participant sidebar for dual role user in participant mode');
        return <ParticipantSidebar />;
      }
    }
    
    // Default fallback to participant sidebar
    console.log('RoleBasedLayout: Showing participant sidebar as fallback');
    return <ParticipantSidebar />;
  };

  const getMobileSidebar = () => {
    const path = window.location.pathname;
    
    // Pure caretaker: ALWAYS show caretaker sidebar
    if (isPureCaretaker) {
      return <CaretakerSidebar onItemClick={() => setSidebarOpen(false)} />;
    }
    
    // Pure participant: ALWAYS show participant sidebar
    if (isPureParticipant) {
      return <ParticipantSidebar onItemClick={() => setSidebarOpen(false)} />;
    }
    
    // Dual role users: show based on current role or path
    if (isDualRole) {
      const isCaretakerPath = path.startsWith('/caretaker');
      
      if (isCaretakerPath || currentRole === 'caretaker') {
        return <CaretakerSidebar onItemClick={() => setSidebarOpen(false)} />;
      } else {
        return <ParticipantSidebar onItemClick={() => setSidebarOpen(false)} />;
      }
    }
    
    // Default fallback to participant sidebar
    return <ParticipantSidebar onItemClick={() => setSidebarOpen(false)} />;
  };

  // Wrap caretaker layout with CaretakerDataProvider
  const shouldUseCaretakerProvider = isPureCaretaker || 
    (isDualRole && (window.location.pathname.startsWith('/caretaker') || currentRole === 'caretaker'));

  const layoutContent = (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-gray-50/40 md:block">
        {getCurrentSidebar()}
      </div>
      
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-gray-50/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
              {getMobileSidebar()}
            </SheetContent>
          </Sheet>
        </header>
        
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );

  if (shouldUseCaretakerProvider) {
    return (
      <CaretakerDataProvider>
        {layoutContent}
      </CaretakerDataProvider>
    );
  }

  return layoutContent;
};

export default RoleBasedLayout;
