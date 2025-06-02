
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
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
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Successfully signed in!");
        navigate("/dashboard");
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const { data, error } = await supabase.auth.signUp({
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
        
        // If there's an invitation code, redeem it after signup
        if (invitationCode && data.user) {
          try {
            const { error: redeemError } = await supabase.functions.invoke('redeem-invitation', {
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
              <div className="space-y-2">
                <Label htmlFor="invitationCode">
                  Invitation Code {invitationCode ? "(Auto-filled)" : "(Optional)"}
                </Label>
                <Input
                  id="invitationCode"
                  type="text"
                  placeholder="Enter invitation code if you have one"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  className={invitationCode ? "border-green-300 bg-green-50" : ""}
                />
                {invitationCode && (
                  <p className="text-sm text-green-600">
                    You're joining as a caretaker with invitation code: {invitationCode}
                  </p>
                )}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm"
            >
              {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
