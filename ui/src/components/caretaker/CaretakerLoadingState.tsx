
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface CaretakerLoadingStateProps {
  message?: string;
  fullHeight?: boolean;
}

const CaretakerLoadingState = ({ 
  message = "Loading...", 
  fullHeight = false 
}: CaretakerLoadingStateProps) => {
  const containerClass = fullHeight 
    ? "min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center"
    : "flex items-center justify-center py-12";

  return (
    <div className={containerClass}>
      <Card className="max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CaretakerLoadingState;
