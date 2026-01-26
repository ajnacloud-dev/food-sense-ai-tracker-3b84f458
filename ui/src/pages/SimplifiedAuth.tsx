
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Brain, UserPlus, User, Stethoscope } from "lucide-react";
import { backendApi } from "@/lib/api/client";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { InvitationCodeInput } from "@/components/auth/InvitationCodeInput";

const SimplifiedAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [userType, setUserType] = useState<'participant' | 'caretaker'>('participant');
  const [invitationCode, setInvitationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Check for invitation code in URL parameters
  useEffect(() => {
    const inviteCode = searchParams.get('invite');
    if (inviteCode) {
      setInvitationCode(inviteCode);
      setUserType('caretaker'); // Invitations are typically for caretakers
      setIsLogin(false); // Switch to signup mode for invitation
      toast.info("Invitation code detected! Please complete your signup as a caretaker.");
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
        const { error } = await backendApi.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Successfully signed in!");
        navigate("/dashboard");
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const { data, error } = await backendApi.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              user_type: userType,
            },
            emailRedirectTo: redirectUrl
          },
        });
        
        if (error) throw error;
        
        // Update user type in database after successful signup
        if (data.user) {
          try {
            const { error: updateError } = await backendApi
              .from('users')
              .update({ user_type: userType })
              .eq('id', data.user.id);
              
            if (updateError) {
              console.error('Error updating user type:', updateError);
            }
          } catch (updateError) {
            console.error('Error updating user type:', updateError);
          }
        }
        
        // If there's an invitation code, redeem it after signup
        if (invitationCode && data.user) {
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
        
        // Route based on user type
        if (userType === 'caretaker') {
          navigate("/caretaker");
        } else {
          navigate("/dashboard");
        }
      }
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
            
            {!isLogin && !invitationCode && (
              <div className="space-y-3">
                <Label>Account Type</Label>
                <RadioGroup value={userType} onValueChange={(value) => setUserType(value as 'participant' | 'caretaker')}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="participant" id="participant" />
                    <Label htmlFor="participant" className="flex items-center gap-2 cursor-pointer flex-1">
                      <User className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="font-medium">Participant</div>
                        <div className="text-sm text-gray-500">Track your own health data</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="caretaker" id="caretaker" />
                    <Label htmlFor="caretaker" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Stethoscope className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium">Healthcare Provider</div>
                        <div className="text-sm text-gray-500">Monitor patient health data</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
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
            {!isLogin && userType === 'caretaker' && (
              <InvitationCodeInput
                value={invitationCode}
                onChange={setInvitationCode}
                disabled={loading}
                autoFilled={!!searchParams.get('invite')}
              />
            )}
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

export default SimplifiedAuth;
