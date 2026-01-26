
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, UserPlus, ArrowRight, Users } from "lucide-react";
import { backendApi } from "@/lib/api/client";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { InvitationCodeInput } from "@/components/auth/InvitationCodeInput";

const Join = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValidation, setCodeValidation] = useState<{valid: boolean, message: string} | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Check for invitation code in URL parameters
  useEffect(() => {
    const inviteCode = searchParams.get('invite');
    if (inviteCode) {
      setInvitationCode(inviteCode);
      validateInvitationCode(inviteCode);
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      // If user is already logged in and has an invitation code, redirect to join caretaker page
      const inviteCode = searchParams.get('invite');
      if (inviteCode) {
        navigate(`/join-caretaker?code=${inviteCode}`);
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, navigate, searchParams]);

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

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitationCode.trim()) {
      toast.error("Invitation code is required");
      return;
    }

    if (codeValidation && !codeValidation.valid) {
      toast.error("Please enter a valid invitation code");
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await backendApi.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: redirectUrl
        },
      });
      
      if (error) throw error;
      
      // Redeem invitation code after signup
      if (data.user) {
        try {
          const { error: redeemError } = await backendApi.functions.invoke('redeem-invitation', {
            body: {
              invitationCode,
              userId: data.user.id
            }
          });
          
          if (redeemError) {
            console.error('Invitation redemption error:', redeemError);
            toast.error("Account created but invitation code redemption failed. Please contact support.");
          } else {
            toast.success("Account created and invitation code redeemed successfully!");
          }
        } catch (redeemError) {
          console.error('Invitation redemption error:', redeemError);
          toast.error("Account created but invitation code redemption failed. Please contact support.");
        }
      } else {
        toast.success("Account created successfully!");
      }
      
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">NutriWealth</span>
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <UserPlus className="h-5 w-5 text-green-600" />
            Join as Caretaker
          </CardTitle>
          <CardDescription>
            Enter your invitation code to join as a caretaker
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <InvitationCodeInput
              value={invitationCode}
              onChange={handleInvitationCodeChange}
              disabled={loading || validatingCode}
              autoFilled={!!searchParams.get('invite')}
            />
            
            {validatingCode && (
              <div className="text-sm text-gray-500">Validating invitation code...</div>
            )}
            
            {codeValidation && (
              <div className={`text-sm ${codeValidation.valid ? 'text-green-600' : 'text-red-600'}`}>
                {codeValidation.message}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || validatingCode || (codeValidation && !codeValidation.valid)}
            >
              {loading ? "Creating Account..." : (
                <>
                  Join as Caretaker
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center space-y-2">
            <div className="text-sm text-gray-500">
              Already have an account?
            </div>
            <Link 
              to="/auth" 
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Sign in to your account
            </Link>
            <div className="mt-4 pt-4 border-t">
              <Link 
                to="/join-caretaker" 
                className="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-800 underline"
              >
                <Users className="h-4 w-4" />
                Already have an account? Join as caretaker here
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Join;
