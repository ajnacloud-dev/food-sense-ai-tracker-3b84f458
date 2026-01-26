
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";
import { User, ArrowLeftRight, Stethoscope } from "lucide-react";
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
    <div className="mx-4 mb-4">
      <Card className="nw-card border-blue-200 bg-gradient-to-r from-blue-50 to-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white rounded-lg shadow-sm">
                <ArrowLeftRight className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-gray-800">Switch View</span>
            </div>
            <Badge className="nw-badge-info text-2xs font-medium px-2 py-1">
              Dual Role Access
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={currentRole === 'participant' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRoleSwitch('participant')}
              className={`flex items-center gap-2 text-xs h-9 transition-all duration-200 ${
                currentRole === 'participant' 
                  ? 'nw-button-secondary shadow-sm' 
                  : 'nw-button-outline hover:bg-green-50 hover:text-green-700 hover:border-green-200'
              }`}
            >
              <User className="h-3 w-3" />
              <span>My Health</span>
            </Button>
            
            <Button
              variant={currentRole === 'caretaker' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRoleSwitch('caretaker')}
              className={`flex items-center gap-2 text-xs h-9 transition-all duration-200 ${
                currentRole === 'caretaker' 
                  ? 'nw-button-primary shadow-sm' 
                  : 'nw-button-outline hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
              }`}
            >
              <Stethoscope className="h-3 w-3" />
              <span>Patients</span>
            </Button>
          </div>
          
          <div className="mt-3 text-center">
            <span className="text-2xs text-gray-600 bg-white px-2 py-1 rounded-full">
              {currentRole === 'participant' ? 'Viewing your personal health data' : 'Managing patient care'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
