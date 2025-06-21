
import React from "react";
import SimpleRoleBasedLayout from "@/components/layout/SimpleRoleBasedLayout";
import { CaretakerDataProvider } from "@/contexts/CaretakerDataContext";

interface CaretakerPageLayoutProps {
  children: React.ReactNode;
  withCaretakerData?: boolean;
}

const CaretakerPageLayout = ({ 
  children, 
  withCaretakerData = true 
}: CaretakerPageLayoutProps) => {
  if (withCaretakerData) {
    return (
      <CaretakerDataProvider>
        <SimpleRoleBasedLayout>
          <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
            {children}
          </div>
        </SimpleRoleBasedLayout>
      </CaretakerDataProvider>
    );
  }

  return (
    <SimpleRoleBasedLayout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
        {children}
      </div>
    </SimpleRoleBasedLayout>
  );
};

export default CaretakerPageLayout;
