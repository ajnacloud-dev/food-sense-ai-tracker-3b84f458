
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";
import { Heart, User, ArrowLeftRight, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    <Card className="mx-4 mb-4 bg-white border border-gray-200 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Switch View:</span>
          </div>
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            Dual Role
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={currentRole === 'participant' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleRoleSwitch('participant')}
            className={`flex items-center gap-2 ${
              currentRole === 'participant' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
            }`}
          >
            <User className="h-3 w-3" />
            <span className="text-xs">My Health</span>
          </Button>
          
          <Button
            variant={currentRole === 'caretaker' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleRoleSwitch('caretaker')}
            className={`flex items-center gap-2 ${
              currentRole === 'caretaker' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
            }`}
          >
            <Stethoscope className="h-3 w-3" />
            <span className="text-xs">Patients</span>
          </Button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          {currentRole === 'participant' ? 'Viewing your personal health data' : 'Managing patient care'}
        </div>
      </CardContent>
    </Card>
  );
};
