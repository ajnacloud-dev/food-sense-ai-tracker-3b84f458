
import { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useUserType } from "@/contexts/UserTypeContext";
import { MainSidebar } from "./MainSidebar";
import ModernCaretakerSidebar from "./ModernCaretakerSidebar";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

const SidebarLayout = ({ children }: SidebarLayoutProps) => {
  const { userType } = useUserType();
  const [open, setOpen] = useState(true);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-green-50/30 via-white to-green-50/20">
        <Sidebar variant="inset" className="border-r border-green-200/50">
          {userType === 'caretaker' ? (
            <ModernCaretakerSidebar />
          ) : (
            <MainSidebar />
          )}
        </Sidebar>
        <SidebarInset className="flex-1">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-green-200/50 bg-white/80 backdrop-blur-sm px-4">
            <SidebarTrigger className="text-green-700 hover:bg-green-50" />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default SidebarLayout;
