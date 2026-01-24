
import { Button } from "@/components/ui/button";
import { ArrowLeft, Utensils, RefreshCw, Stethoscope } from "lucide-react";

interface CaretakerFoodHeaderProps {
  participantName: string;
  hasPermission: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onBack: () => void;
}

const CaretakerFoodHeader = ({ 
  participantName, 
  hasPermission, 
  refreshing, 
  onRefresh, 
  onBack 
}: CaretakerFoodHeaderProps) => {
  return (
    <div className="nw-page-header">
      <div>
        <h1 className="nw-page-title flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
            <Utensils className="h-7 w-7 text-white" />
          </div>
          Food Monitoring
        </h1>
        <div className="flex items-center gap-2 text-gray-600 mt-2">
          <Stethoscope className="h-4 w-4" />
          <span className="font-medium">{participantName}</span>
          <span className="text-gray-400">•</span>
          <span>Track nutrition and eating patterns</span>
        </div>
      </div>
      <div className="flex gap-3 mt-4 lg:mt-0">
        {hasPermission && (
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={refreshing}
            className="nw-button-outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}
        <Button
          variant="outline"
          onClick={onBack}
          className="nw-button-outline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default CaretakerFoodHeader;
