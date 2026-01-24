
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";

interface CaretakerErrorStateProps {
  error: string;
  onBack?: () => void;
  backLabel?: string;
  fullHeight?: boolean;
}

const CaretakerErrorState = ({ 
  error, 
  onBack, 
  backLabel = "Go Back",
  fullHeight = false 
}: CaretakerErrorStateProps) => {
  const containerClass = fullHeight 
    ? "min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 flex items-center justify-center"
    : "flex items-center justify-center py-12";

  return (
    <div className={containerClass}>
      <Card className="max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          {onBack && (
            <Button onClick={onBack} variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CaretakerErrorState;
