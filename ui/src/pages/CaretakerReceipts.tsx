
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { toast } from "sonner";
import SimpleRoleBasedLayout from "@/components/layout/SimpleRoleBasedLayout";
import ReceiptTable from "@/components/receipts/ReceiptTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, User } from "lucide-react";
import { CaretakerDataProvider, useCaretakerData } from "@/contexts/CaretakerDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserType } from "@/contexts/UserTypeContext";

const CaretakerReceiptsContent = () => {
  const navigate = useNavigate();
  const { selectedParticipantId, participantData, loading } = useCaretakerData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading participant receipts...</p>
        </div>
      </div>
    );
  }

  if (!selectedParticipantId || !participantData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Participant Selected</CardTitle>
          <CardDescription>
            Please select a participant from the sidebar to view their receipts.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-600" />
            Receipts
          </h1>
          <div className="flex items-center gap-2 text-gray-600 mt-1">
            <User className="h-4 w-4" />
            <span>{participantData.full_name}</span>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/caretaker')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <ReceiptTable participantId={selectedParticipantId} />
    </div>
  );
};

const CaretakerReceipts = () => {
  const { user, loading: authLoading } = useAuth();
  const { userType, isLoading: userTypeLoading } = useUserType();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (!userTypeLoading && userType !== 'caretaker') {
      console.log('CaretakerReceipts: User is not a caretaker, redirecting to /dashboard');
      navigate("/dashboard", { replace: true });
      return;
    }
  }, [user, authLoading, userTypeLoading, userType, navigate]);

  if (authLoading || userTypeLoading) {
    return (
      <SimpleRoleBasedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading participant receipts...</p>
          </div>
        </div>
      </SimpleRoleBasedLayout>
    );
  }

  if (!user || userType !== 'caretaker') {
    return null; // Will redirect via useEffect
  }

  return (
    <CaretakerDataProvider>
      <SimpleRoleBasedLayout>
        <CaretakerReceiptsContent />
      </SimpleRoleBasedLayout>
    </CaretakerDataProvider>
  );
};

export default CaretakerReceipts;
