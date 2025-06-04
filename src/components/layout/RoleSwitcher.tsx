
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";
import { Heart, User, ArrowLeftRight } from "lucide-react";

interface RoleSwitcherProps {
  onSwitch?: () => void;
}

export const RoleSwitcher = ({ onSwitch }: RoleSwitcherProps) => {
  const navigate = useNavigate();
  const { currentRole, switchRole, isDualRole, isPureCaretaker } = useRole();

  const handleRoleSwitch = (newRole: 'participant' | 'caretaker') => {
    switchRole(newRole);
    
    if (newRole === 'caretaker') {
      navigate('/caretaker');
    } else {
      navigate('/dashboard');
    }
    
    onSwitch?.();
  };

  // Don't show switcher for pure caretakers
  if (isPureCaretaker) {
    return null;
  }

  // Only show for dual role users
  if (!isDualRole) {
    return null;
  }

  return (
    <Card className="mx-4 mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Current View:</span>
          <ArrowLeftRight className="h-4 w-4 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={currentRole === 'participant' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleRoleSwitch('participant')}
            className="flex items-center gap-2"
          >
            <User className="h-3 w-3" />
            My Health
          </Button>
          
          <Button
            variant={currentRole === 'caretaker' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleRoleSwitch('caretaker')}
            className="flex items-center gap-2"
          >
            <Heart className="h-3 w-3" />
            Caretaker
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
