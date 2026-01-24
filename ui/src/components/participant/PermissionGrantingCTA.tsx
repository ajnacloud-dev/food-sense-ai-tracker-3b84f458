
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, ArrowRight, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PermissionGrantingCTAProps {
  caretakerCount: number;
  pendingRequestsCount: number;
}

const PermissionGrantingCTA = ({ caretakerCount, pendingRequestsCount }: PermissionGrantingCTAProps) => {
  const navigate = useNavigate();

  if (caretakerCount === 0) {
    return null; // Don't show if no caretakers
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Shield className="h-5 w-5" />
          Caretaker Permissions
          {pendingRequestsCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingRequestsCount} pending
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-blue-700">
          {caretakerCount > 0 && (
            <>You have {caretakerCount} caretaker{caretakerCount > 1 ? 's' : ''} who may need access to your health data.</>
          )}
          {pendingRequestsCount > 0 && (
            <> {pendingRequestsCount} permission request{pendingRequestsCount > 1 ? 's' : ''} waiting for your approval.</>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => navigate('/participant/permissions')}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Manage Permissions
            <ArrowRight className="h-4 w-4" />
          </Button>
          {pendingRequestsCount > 0 && (
            <span className="text-sm text-blue-700">
              Approve pending requests
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PermissionGrantingCTA;
