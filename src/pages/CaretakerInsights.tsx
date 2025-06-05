
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SimpleRoleBasedLayout from "@/components/layout/SimpleRoleBasedLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, User } from "lucide-react";
import { useCaretakerData } from "@/contexts/CaretakerDataContext";

const CaretakerInsights = () => {
  const navigate = useNavigate();
  const { selectedParticipantId, participantData, loading } = useCaretakerData();

  if (loading) {
    return (
      <SimpleRoleBasedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading participant insights...</p>
          </div>
        </div>
      </SimpleRoleBasedLayout>
    );
  }

  if (!selectedParticipantId || !participantData) {
    return (
      <SimpleRoleBasedLayout>
        <Card>
          <CardHeader>
            <CardTitle>No Participant Selected</CardTitle>
            <CardDescription>
              Please select a participant from the sidebar to view their insights.
            </CardDescription>
          </CardHeader>
        </Card>
      </SimpleRoleBasedLayout>
    );
  }

  return (
    <SimpleRoleBasedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-green-600" />
              Insights
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

        <Card>
          <CardHeader>
            <CardTitle>Health Analytics</CardTitle>
            <CardDescription>
              Comprehensive insights for {participantData.full_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Advanced Analytics Coming Soon
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                We're working on comprehensive health insights including nutrition trends, 
                activity patterns, and personalized recommendations for {participantData.full_name}.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SimpleRoleBasedLayout>
  );
};

export default CaretakerInsights;
