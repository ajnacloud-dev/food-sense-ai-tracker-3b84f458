
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import PermissionStatusIndicator from "./PermissionStatusIndicator";

interface CaretakerFoodPermissionGuardProps {
  participantName: string;
}

const CaretakerFoodPermissionGuard = ({ participantName }: CaretakerFoodPermissionGuardProps) => {
  return (
    <Card className="nw-card-modern">
      <CardHeader className="text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-10 w-10 text-amber-600" />
        </div>
        <CardTitle className="text-2xl text-gray-900">Access Permission Required</CardTitle>
        <CardDescription className="text-lg">
          {participantName} needs to grant you permission to view their food entries.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PermissionStatusIndicator
          hasPermissions={false}
          participantName={participantName}
          missingCategories={['food_entries']}
        />
      </CardContent>
    </Card>
  );
};

export default CaretakerFoodPermissionGuard;
