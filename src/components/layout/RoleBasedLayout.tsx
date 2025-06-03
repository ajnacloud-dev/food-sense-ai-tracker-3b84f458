import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
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
  const { hasCaretakerRelationships } = useRole();

  // Determine which sidebar to show based on current route and user role
  const getCurrentSidebar = () => {
    const path = window.location.pathname;
    
    // If we're on caretaker routes, show caretaker sidebar
    if (path.startsWith('/caretaker') && hasCaretakerRelationships) {
      return (
        <CaretakerSidebar 
          selectedParticipantId={selectedParticipantId}
          onParticipantChange={onParticipantChange}
        />
      );
    }
    
    // Otherwise show participant sidebar (default)
    return <ParticipantSidebar />;
  };

  const getMobileSidebar = () => {
    const path = window.location.pathname;
    
    // If we're on caretaker routes, show caretaker sidebar
    if (path.startsWith('/caretaker') && hasCaretakerRelationships) {
      return (
        <CaretakerSidebar 
          selectedParticipantId={selectedParticipantId}
          onParticipantChange={onParticipantChange}
          onItemClick={() => setSidebarOpen(false)}
        />
      );
    }
    
    // Otherwise show participant sidebar (default)
    return <ParticipantSidebar onItemClick={() => setSidebarOpen(false)} />;
  };

  return (
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
};

export default RoleBasedLayout;
