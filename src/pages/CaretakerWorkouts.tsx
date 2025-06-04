
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RoleBasedLayout from "@/components/layout/RoleBasedLayout";
import WorkoutTable from "@/components/workouts/WorkoutTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Dumbbell, User } from "lucide-react";
import { useCaretakerData } from "@/contexts/CaretakerDataContext";

const CaretakerWorkouts = () => {
  const navigate = useNavigate();
  const { selectedParticipantId, participantData, loading } = useCaretakerData();

  if (loading) {
    return (
      <RoleBasedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading participant workouts...</p>
          </div>
        </div>
      </RoleBasedLayout>
    );
  }

  if (!selectedParticipantId || !participantData) {
    return (
      <RoleBasedLayout>
        <Card>
          <CardHeader>
            <CardTitle>No Participant Selected</CardTitle>
            <CardDescription>
              Please select a participant from the sidebar to view their workouts.
            </CardDescription>
          </CardHeader>
        </Card>
      </RoleBasedLayout>
    );
  }

  return (
    <RoleBasedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Dumbbell className="h-8 w-8 text-purple-600" />
              Workouts
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

        <WorkoutTable participantId={selectedParticipantId} />
      </div>
    </RoleBasedLayout>
  );
};

export default CaretakerWorkouts;
