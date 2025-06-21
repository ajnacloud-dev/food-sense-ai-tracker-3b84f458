
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { useCaretakerData } from "@/contexts/CaretakerDataContext";
import CaretakerPageLayout from "@/components/caretaker/CaretakerPageLayout";
import CaretakerPageHeader from "@/components/caretaker/CaretakerPageHeader";
import CaretakerLoadingState from "@/components/caretaker/CaretakerLoadingState";

const CaretakerInsights = () => {
  const navigate = useNavigate();
  const { selectedParticipantId, participantData, loading } = useCaretakerData();

  if (loading) {
    return <CaretakerLoadingState message="Loading participant insights..." fullHeight />;
  }

  if (!selectedParticipantId || !participantData) {
    return (
      <CaretakerPageLayout>
        <div className="p-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle>No Participant Selected</CardTitle>
              <CardDescription>
                Please select a participant from the sidebar to view their insights.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </CaretakerPageLayout>
    );
  }

  return (
    <CaretakerPageLayout>
      <CaretakerPageHeader
        title="Insights"
        subtitle="Comprehensive health analytics"
        icon={BarChart3}
        onBack={() => navigate('/caretaker')}
        backLabel="Back to Dashboard"
      />

      <div className="p-6">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
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
    </CaretakerPageLayout>
  );
};

export default CaretakerInsights;
