
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, LucideIcon } from "lucide-react";
import { useCaretakerData } from "@/contexts/CaretakerDataContext";

interface CaretakerPageHeaderProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  onBack: () => void;
  backLabel?: string;
  showParticipantInfo?: boolean;
}

const CaretakerPageHeader = ({
  title,
  subtitle,
  icon: Icon,
  onBack,
  backLabel = "Back",
  showParticipantInfo = true
}: CaretakerPageHeaderProps) => {
  const { participantData } = useCaretakerData();

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Icon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-gray-600">{subtitle}</p>}
            {showParticipantInfo && participantData && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <User className="h-4 w-4" />
                <span>{participantData.full_name}</span>
              </div>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Button>
      </div>
    </div>
  );
};

export default CaretakerPageHeader;
