
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Brain, 
  Camera, 
  FileText, 
  Utensils, 
  Dumbbell, 
  BarChart3, 
  CreditCard, 
  Settings, 
  LogOut, 
  Menu,
  Home,
  Users,
  UserPlus,
  Heart
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Capture", href: "/capture", icon: Camera },
  { name: "Food", href: "/food", icon: Utensils },
  { name: "Receipts", href: "/receipts", icon: FileText },
  { name: "Workouts", href: "/workouts", icon: Dumbbell },
  { name: "Insights", href: "/insights", icon: BarChart3 },
  { name: "Billing", href: "/billing", icon: CreditCard },
];

const caretakerItems = [
  { name: "Caretaker Dashboard", href: "/caretaker", icon: Heart },
  { name: "Join with Code", href: "/join-caretaker", icon: UserPlus },
];

const participantItems = [
  { name: "Invite Caretakers", href: "/invite-caretakers", icon: Users },
];

interface SidebarLayoutProps {
  children: React.ReactNode;
}

const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
          <Brain className="h-6 w-6 text-blue-600" />
          <span>NutriWealth</span>
        </Link>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onItemClick}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100 ${
                  location.pathname === item.href ? "bg-gray-100 text-gray-900" : ""
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
          
          <Separator className="my-4" />
          
          <div className="px-3 py-2">
            <h3 className="mb-2 text-sm font-medium text-gray-500 uppercase tracking-wide">
              Caretaker
            </h3>
            {caretakerItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onItemClick}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100 ${
                    location.pathname === item.href ? "bg-gray-100 text-gray-900" : ""
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="px-3 py-2">
            <h3 className="mb-2 text-sm font-medium text-gray-500 uppercase tracking-wide">
              Participant
            </h3>
            {participantItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onItemClick}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100 ${
                    location.pathname === item.href ? "bg-gray-100 text-gray-900" : ""
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        {user && (
          <div className="mb-4 px-3">
            <p className="text-sm font-medium text-gray-900">{user.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

const SidebarLayout = ({ children }: SidebarLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-gray-50/40 md:block">
        <SidebarContent />
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
              <SidebarContent onItemClick={() => setSidebarOpen(false)} />
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

export default SidebarLayout;
