
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2 } from "lucide-react";
import { backendApi } from "@/lib/api/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const JoinWithCode = () => {
  const [invitationCode, setInvitationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoinWithCode = async () => {
    if (!invitationCode.trim()) {
      toast.error("Please enter an invitation code");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await backendApi.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to join with a code");
        return;
      }

      const { error } = await backendApi.functions.invoke('redeem-invitation', {
        body: {
          invitationCode: invitationCode.trim().toUpperCase(),
          userId: user.id
        }
      });

      if (error) {
        console.error('Invitation redemption error:', error);
        toast.error("Invalid or expired invitation code");
        return;
      }

      toast.success("Successfully joined as caretaker!");
      setInvitationCode("");
      // Refresh the page to update the UI
      window.location.reload();
    } catch (error) {
      console.error('Error joining with code:', error);
      toast.error("Failed to join with invitation code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <UserPlus className="h-5 w-5" />
          Join as Caretaker
        </CardTitle>
        <CardDescription className="text-blue-700">
          Enter an invitation code to monitor someone's health data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="invitation-code" className="text-blue-800">
            Invitation Code
          </Label>
          <Input
            id="invitation-code"
            type="text"
            placeholder="Enter 8-character code"
            value={invitationCode}
            onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
            maxLength={8}
            className="bg-white border-blue-200 focus:border-blue-400"
          />
        </div>
        <Button 
          onClick={handleJoinWithCode}
          disabled={loading || !invitationCode.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Joining...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Join with Code
            </>
          )}
        </Button>
        <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded-lg">
          <p className="font-medium mb-1">How it works:</p>
          <ul className="text-xs space-y-1">
            <li>• Someone sends you their 8-character invitation code</li>
            <li>• Enter the code above to gain access to their health data</li>
            <li>• You'll be able to view their food, receipts, and workouts</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
