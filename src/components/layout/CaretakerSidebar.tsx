
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Brain, 
  FileText, 
  Utensils, 
  Dumbbell, 
  BarChart3, 
  LogOut, 
  Heart,
  User,
  ArrowLeft
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";

interface Participant {
  id: string;
  full_name: string;
  email: string;
}

interface CaretakerSidebarProps {
  selectedParticipantId?: string;
  onParticipantChange?: (participantId: string) => void;
  onItemClick?: () => void;
}

const CaretakerSidebar = ({ selectedParticipantId, onParticipantChange, onItemClick }: CaretakerSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isParticipant, isDualRole } = useRole();
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('CaretakerSidebar: Fetching participants for caretaker:', user.id);

      const { data: relationships, error } = await supabase
        .from('care_relationships')
        .select(`
          user_id,
          status,
          users!care_relationships_user_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('caretaker_id', user.id)
        .eq('status', 'active');

      if (error) {
        console.error('CaretakerSidebar: Error fetching relationships:', error);
        throw error;
      }

      console.log('CaretakerSidebar: Raw relationships data:', relationships);

      const participantData: Participant[] = (relationships || []).map(rel => {
        const userData = rel.users as any;
        console.log('CaretakerSidebar: Processing participant:', {
          user_id: rel.user_id,
          userData: userData,
          full_name: userData?.full_name,
          email: userData?.email
        });
        
        return {
          id: rel.user_id,
          full_name: userData?.full_name || 'Name not available',
          email: userData?.email || 'Email not available'
        };
      });

      console.log('CaretakerSidebar: Final participants loaded:', participantData);
      setParticipants(participantData);
      
      // Auto-select first participant if none selected
      if (participantData.length > 0 && !selectedParticipantId && onParticipantChange) {
        console.log('CaretakerSidebar: Auto-selecting first participant:', participantData[0].id);
        onParticipantChange(participantData[0].id);
      }
    } catch (error) {
      console.error('CaretakerSidebar: Error fetching participants:', error);
      toast.error('Failed to load participants');
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  const handleSwitchToParticipant = () => {
    navigate("/dashboard");
    onItemClick?.();
    toast.success("Switched to your health data view");
  };

  const navigationItems = [
    { name: "Dashboard", href: "/caretaker", icon: Heart },
    { name: "Food Entries", href: "/caretaker/food", icon: Utensils },
    { name: "Receipts", href: "/caretaker/receipts", icon: FileText },
    { name: "Workouts", href: "/caretaker/workouts", icon: Dumbbell },
    { name: "Insights", href: "/caretaker/insights", icon: BarChart3 },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link to="/caretaker" className="flex items-center gap-2 font-semibold">
          <Brain className="h-6 w-6 text-blue-600" />
          <span>NutriWealth</span>
        </Link>
      </div>

      {/* Switch back to participant view for dual role users */}
      {isDualRole && (
        <div className="p-4 border-b bg-green-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700">Caretaker Mode</span>
            <Heart className="h-4 w-4 text-green-600" />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwitchToParticipant}
            className="w-full text-xs"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back to My Health Data
          </Button>
        </div>
      )}

      {/* Participant Selector */}
      <div className="p-4 border-b">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Monitoring Participant:
        </label>
        
        {participants.length > 0 ? (
          <Select
            value={selectedParticipantId || ''}
            onValueChange={onParticipantChange}
          >
            <SelectTrigger className="w-full min-w-0">
              <SelectValue placeholder="Select participant..." />
            </SelectTrigger>
            <SelectContent className="w-full">
              {participants.map((participant) => (
                <SelectItem key={participant.id} value={participant.id}>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{participant.full_name}</div>
                    <div className="text-xs text-gray-500 truncate">{participant.email}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="text-sm text-gray-500 p-2 border rounded">
            No active participants found
          </div>
        )}
        
        {/* Debug info - remove in production */}
        <div className="mt-2 text-xs text-gray-400">
          Found {participants.length} participant(s)
          {selectedParticipantId && (
            <div className="truncate">Selected: {selectedParticipantId}</div>
          )}
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isDisabled = item.href !== '/caretaker' && !selectedParticipantId;
            
            return (
              <Link
                key={item.name}
                to={isDisabled ? '#' : item.href}
                onClick={(e) => {
                  if (isDisabled) {
                    e.preventDefault();
                    toast.error('Please select a participant first');
                    return;
                  }
                  onItemClick?.();
                }}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                  isDisabled 
                    ? "text-gray-300 cursor-not-allowed" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                } ${
                  location.pathname === item.href ? "bg-gray-100 text-gray-900" : ""
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        {user && (
          <div className="mb-4 px-3">
            <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              <p className="text-xs text-green-600 font-medium">Caretaker</p>
              {isDualRole && (
                <p className="text-xs text-blue-600 font-medium">• Participant</p>
              )}
            </div>
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

export default CaretakerSidebar;
