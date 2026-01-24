
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const JoinCaretakerCTA = () => {
  const navigate = useNavigate();

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <UserPlus className="h-5 w-5" />
          Become a Caretaker
        </CardTitle>
        <CardDescription className="text-blue-700">
          Help monitor someone's health data by joining with their invitation code
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-blue-700">
            <p className="mb-2">If someone wants you to help monitor their health:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>They'll send you an invitation code</li>
              <li>Enter the code to gain access to their data</li>
              <li>View their food, receipts, and workouts</li>
            </ul>
          </div>
          <Button 
            onClick={() => navigate("/join-caretaker")}
            className="bg-blue-600 hover:bg-blue-700 self-start sm:self-center"
          >
            Join with Code
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
