
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, ArrowRight, Info, CheckCircle } from "lucide-react";
import { backendApi } from "@/lib/api/client";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SidebarLayout from "@/components/layout/SidebarLayout";

const JoinCaretaker = () => {
  const [invitationCode, setInvitationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValidation, setCodeValidation] = useState<{valid: boolean, message: string} | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Check for invitation code in URL parameters
  useEffect(() => {
    const inviteCode = searchParams.get('code');
    if (inviteCode) {
      setInvitationCode(inviteCode);
      validateInvitationCode(inviteCode);
    }
  }, [searchParams]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const validateInvitationCode = async (code: string) => {
    if (!code.trim()) {
      setCodeValidation(null);
      return;
    }

    setValidatingCode(true);
    try {
      const { data, error } = await backendApi
        .from('invitation_codes')
        .select('*')
        .eq('code', code)
        .single();

      if (error || !data) {
        setCodeValidation({ valid: false, message: "Invalid invitation code" });
        return;
      }

      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      
      if (now > expiresAt) {
        setCodeValidation({ valid: false, message: "Invitation code has expired" });
        return;
      }

      if (data.current_uses >= data.max_uses) {
        setCodeValidation({ valid: false, message: "Invitation code has reached its usage limit" });
        return;
      }

      setCodeValidation({ valid: true, message: `Valid invitation for ${data.caretaker_type.replace('_', ' ')} role` });
    } catch (error) {
      setCodeValidation({ valid: false, message: "Error validating code" });
    } finally {
      setValidatingCode(false);
    }
  };

  const handleInvitationCodeChange = (value: string) => {
    setInvitationCode(value);
    // Debounce validation
    const timeoutId = setTimeout(() => {
      validateInvitationCode(value);
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  const handleJoinAsCaretaker = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitationCode.trim()) {
      toast.error("Invitation code is required");
      return;
    }

    if (codeValidation && !codeValidation.valid) {
      toast.error("Please enter a valid invitation code");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to join as a caretaker");
      return;
    }

    setLoading(true);

    try {
      const { error: redeemError } = await backendApi.functions.invoke('redeem-invitation', {
        body: {
          invitationCode,
          userId: user.id
        }
      });
      
      if (redeemError) {
        console.error('Invitation redemption error:', redeemError);
        toast.error("Failed to redeem invitation code. Please check the code and try again.");
      } else {
        toast.success("Successfully joined as caretaker!");
        navigate("/caretaker");
      }
    } catch (error: any) {
      console.error('Invitation redemption error:', error);
      toast.error("Failed to redeem invitation code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <SidebarLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join as Caretaker</h1>
          <p className="text-gray-600 text-lg">Help monitor someone's health data by entering their invitation code</p>
        </div>

        {/* How it Works Section */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Info className="h-5 w-5" />
              How the Caretaker System Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-blue-700">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">1</div>
                <h3 className="font-semibold mb-1">Participant Invites</h3>
                <p className="text-sm">Someone generates an invitation code for you</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">2</div>
                <h3 className="font-semibold mb-1">You Join</h3>
                <p className="text-sm">Enter the code below to join as their caretaker</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">3</div>
                <h3 className="font-semibold mb-1">Monitor Data</h3>
                <p className="text-sm">Access their health data with granted permissions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Join Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-green-600" />
              Enter Invitation Code
            </CardTitle>
            <CardDescription>
              Paste or type the invitation code you received from the participant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinAsCaretaker} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="invitationCode">Invitation Code</Label>
                <Input
                  id="invitationCode"
                  type="text"
                  placeholder="Enter invitation code (e.g., ABC123XY)"
                  value={invitationCode}
                  onChange={(e) => handleInvitationCodeChange(e.target.value)}
                  disabled={loading || validatingCode}
                  required
                  className="font-mono text-lg py-3"
                />
              </div>
              
              {validatingCode && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  Validating invitation code...
                </div>
              )}
              
              {codeValidation && (
                <Alert className={codeValidation.valid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <div className="flex items-center gap-2">
                    {codeValidation.valid ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Info className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription className={codeValidation.valid ? "text-green-700" : "text-red-700"}>
                      {codeValidation.message}
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full py-3 text-lg" 
                size="lg"
                disabled={loading || validatingCode || (codeValidation && !codeValidation.valid)}
              >
                {loading ? "Joining..." : (
                  <>
                    Join as Caretaker
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-800">Need an Invitation Code?</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700">
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Ask the person whose health data you want to monitor to send you an invitation code</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>They can generate one from their "Invite Caretakers" page in their dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Each code has specific permissions and may have expiration dates</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>You can be a caretaker for multiple participants</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Link 
            to="/dashboard" 
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default JoinCaretaker;
