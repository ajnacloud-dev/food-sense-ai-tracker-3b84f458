
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LucideIcon } from "lucide-react";

interface DetailPageLayoutProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  onBack: () => void;
  backLabel?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
  loadingMessage?: string;
}

const DetailPageLayout = ({
  title,
  subtitle,
  icon: Icon,
  onBack,
  backLabel = "Back to List",
  children,
  isLoading = false,
  error = null,
  loadingMessage = "Loading details..."
}: DetailPageLayoutProps) => {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">{loadingMessage}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={onBack} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {backLabel}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <Card className="bg-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                  {subtitle && <p className="text-gray-600">{subtitle}</p>}
                </div>
              </div>
              <Button 
                onClick={onBack}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {children}
      </div>
    </div>
  );
};

export default DetailPageLayout;
