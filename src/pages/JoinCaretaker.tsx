
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

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
      const { data, error } = await supabase
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
      const { error: redeemError } = await supabase.functions.invoke('redeem-invitation', {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <UserPlus className="h-5 w-5 text-green-600" />
            Join as Caretaker
          </CardTitle>
          <CardDescription>
            Enter your invitation code to join as a caretaker for a participant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoinAsCaretaker} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invitationCode">Invitation Code</Label>
              <Input
                id="invitationCode"
                type="text"
                placeholder="Enter your invitation code"
                value={invitationCode}
                onChange={(e) => handleInvitationCodeChange(e.target.value)}
                disabled={loading || validatingCode}
                required
              />
            </div>
            
            {validatingCode && (
              <div className="text-sm text-gray-500">Validating invitation code...</div>
            )}
            
            {codeValidation && (
              <div className={`text-sm ${codeValidation.valid ? 'text-green-600' : 'text-red-600'}`}>
                {codeValidation.message}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || validatingCode || (codeValidation && !codeValidation.valid)}
            >
              {loading ? "Joining..." : (
                <>
                  Join as Caretaker
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center space-y-2">
            <div className="text-sm text-gray-500">
              Don't have an invitation code?
            </div>
            <div className="text-sm text-gray-600">
              Ask the participant to send you an invitation code through their settings.
            </div>
            <Link 
              to="/dashboard" 
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Back to Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinCaretaker;
