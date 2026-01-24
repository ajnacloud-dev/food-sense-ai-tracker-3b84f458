
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PermissionStatusIndicatorProps {
  hasPermissions: boolean;
  participantName: string;
  missingCategories?: string[];
  onContactParticipant?: () => void;
}

const PermissionStatusIndicator = ({ 
  hasPermissions, 
  participantName, 
  missingCategories = [],
  onContactParticipant 
}: PermissionStatusIndicatorProps) => {
  if (hasPermissions) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <CheckCircle className="h-4 w-4" />
        <span>Access granted</span>
      </div>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <AlertCircle className="h-5 w-5" />
          Permissions Required
        </CardTitle>
        <CardDescription className="text-amber-700">
          {participantName} needs to grant you permission to view their data.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {missingCategories.length > 0 && (
          <div className="mb-3">
            <p className="text-sm text-amber-700 mb-2">Missing permissions for:</p>
            <div className="flex flex-wrap gap-1">
              {missingCategories.map((category) => (
                <Badge key={category} variant="outline" className="text-amber-800 border-amber-300">
                  {category.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <p className="text-sm text-amber-700 mb-3">
          The participant can grant permissions by visiting their "Manage Permissions" page.
        </p>
        {onContactParticipant && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onContactParticipant}
            className="text-amber-800 border-amber-300 hover:bg-amber-100"
          >
            <Clock className="h-4 w-4 mr-2" />
            Request Access
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default PermissionStatusIndicator;
