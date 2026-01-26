
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import { backendApi } from "@/lib/api/client";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { InvitationCodeInput } from "@/components/auth/InvitationCodeInput";
// import { signIn, signUp, confirmSignUp } from "aws-amplify/auth"; // Commented out - using mock auth

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Check for invitation code in URL parameters
  useEffect(() => {
    const inviteCode = searchParams.get('invite');
    if (inviteCode) {
      setInvitationCode(inviteCode);
      setIsLogin(false); // Switch to signup mode for invitation
      toast.info("Invitation code detected! Please complete your signup.");
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Use mock authentication from backendApi
        const { data, error } = await backendApi.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          throw error;
        }

        toast.success("Successfully signed in! (Mock Auth - Any email/password works)");
        // Need to reload to update auth context
        window.location.href = "/dashboard";
      } else {
        // For signup, skip verification in mock mode
        const { data, error } = await backendApi.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              user_type: invitationCode ? 'caretaker' : 'participant'
            }
          }
        });

        if (error) {
          throw error;
        }

        toast.success("Account created successfully! (Mock Auth - Signing you in...)");

        // Handle invitation code if present
        if (invitationCode && data?.user?.id) {
          try {
            await api.functions.invoke('redeem-invitation', {
              body: {
                invitationCode,
                userId: data.user.id
              }
            });
          } catch (redeemError) {
            console.error('Invitation redemption error:', redeemError);
          }
        }

        // Auto sign in after signup with mock auth
        window.location.href = "/dashboard";
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
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
            {invitationCode && <UserPlus className="h-5 w-5 text-green-600" />}
            {isLogin ? "Welcome Back" : invitationCode ? "Join as Caretaker" : "Create Account"}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? "Sign in to your account"
              : invitationCode
                  ? "Complete your signup to join as a caretaker"
                  : "Start your health journey today"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
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
            )}
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
            {!isLogin && (
              <InvitationCodeInput
                value={invitationCode}
                onChange={setInvitationCode}
                disabled={loading}
                autoFilled={!!searchParams.get('invite')}
              />
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
              <strong>🔓 Mock Auth Mode:</strong> Use any email/password to login
              <br />
              <span className="text-xs">Example: test@example.com / password123</span>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
              <Button
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm"
              >
                {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
              </Button>

              {isLogin && (
                <div className="pt-2 border-t">
                  <div className="text-sm text-gray-500 mb-2">
                    Have an invitation code?
                  </div>
                  <Link
                    to="/join"
                    className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center justify-center gap-1"
                  >
                    <UserPlus className="h-4 w-4" />
                    Join as Caretaker
                  </Link>
                </div>
              )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
