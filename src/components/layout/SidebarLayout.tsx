
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
import { usePendingAnalyses } from "@/hooks/usePendingAnalyses";
import { MainSidebar } from "./MainSidebar";
import ModernCaretakerSidebar from "./ModernCaretakerSidebar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AnalysisStatusIndicator } from "@/components/dashboard/AnalysisStatusIndicator";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

const SidebarLayout = ({ children }: SidebarLayoutProps) => {
  const { user } = useAuth();
  const { userType } = useUserType();
  const [open, setOpen] = useState(true);

  // Get pending analyses for the current user
  const { 
    pendingAnalyses, 
    refetch: refetchAnalyses,
    loading: analysesLoading 
  } = usePendingAnalyses(user?.id);

  console.log('SidebarLayout - Pending analyses:', pendingAnalyses?.length || 0);

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
          <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-green-200/50 bg-white/80 backdrop-blur-sm px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-green-700 hover:bg-green-50" />
            </div>
            <div className="flex items-center gap-2">
              {/* Analysis Status Indicator - Only show if there are analyses */}
              {!analysesLoading && pendingAnalyses && pendingAnalyses.length > 0 && (
                <AnalysisStatusIndicator 
                  analyses={pendingAnalyses} 
                  onRetry={refetchAnalyses}
                />
              )}
              
              {/* Notification Bell */}
              <NotificationBell />
            </div>
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
