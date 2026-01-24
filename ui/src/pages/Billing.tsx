
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Check, Star, Zap, Shield, Users, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";

interface UserData {
  is_subscribed: boolean;
  subscription_id: string | null;
  email: string;
}

const Billing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [usageToday, setUsageToday] = useState(0);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetchUserData();

    // Check for success/cancel URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      toast.success("Subscription activated successfully!");
      checkSubscription();
    } else if (urlParams.get('canceled') === 'true') {
      toast.info("Subscription canceled. You can try again anytime.");
    }
  }, []);

  const fetchUserData = async () => {
    try {
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch user subscription status
      const { data: allUsers } = await api.from('users').select();
      const userInfo = allUsers?.find((u: any) => u.id === user.id);

      // Fetch today's usage
      const today = new Date().toISOString().split('T')[0];
      const { data: allUsage } = await api.from('api_usage_log').select();
      const usage = allUsage?.find((u: any) => u.user_id === user.id && u.usage_date === today);

      setUserData(userInfo || { is_subscribed: false, subscription_id: null, email: user.email || '' });
      setUsageToday(usage?.usage_count || 0);
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      toast.error("Failed to load billing information");
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async () => {
    try {
      const { data, error } = await api.functions.invoke('check-subscription', {
        headers: {
          // Authorization handled by api client if token is set
        },
      });

      if (error) throw error;

      // Refresh user data after checking subscription
      fetchUserData();
    } catch (error: any) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleUpgrade = async (priceId?: string) => {
    try {
      setUpgradeLoading(true);
      const { data, error } = await api.functions.invoke('create-checkout', {
        body: { priceId },
        headers: {
          // Authorization handled by api client
        },
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast.error("Failed to start checkout process");
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true);
      const { data, error } = await api.functions.invoke('customer-portal', {
        headers: {
          // Authorization handled by api client
        },
      });

      if (error) throw error;

      // Open Stripe customer portal in a new tab
      window.open(data.url, '_blank');
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast.error("Failed to open subscription management");
    } finally {
      setPortalLoading(false);
    }
  };

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "2 AI analyses per day",
        "Basic food tracking",
        "Basic receipt scanning",
        "Simple workout logging",
        "Basic insights"
      ],
      limitations: [
        "Limited daily usage",
        "Basic features only"
      ],
      buttonText: "Current Plan",
      buttonVariant: "outline" as const,
      popular: false,
      current: !userData?.is_subscribed,
      priceId: null
    },
    {
      name: "Pro",
      price: "$9.99",
      period: "month",
      description: "Unlimited access to all features",
      features: [
        "Unlimited AI analyses",
        "Advanced food nutrition tracking",
        "Smart receipt categorization",
        "Detailed workout analytics",
        "Advanced insights & recommendations",
        "Export data",
        "Priority support"
      ],
      limitations: [],
      buttonText: userData?.is_subscribed ? "Current Plan" : "Upgrade to Pro",
      buttonVariant: userData?.is_subscribed ? "outline" as const : "default" as const,
      popular: true,
      current: userData?.is_subscribed || false,
      priceId: "price_pro_monthly" // Replace with your actual Stripe price ID
    },
    {
      name: "Enterprise",
      price: "$29.99",
      period: "month",
      description: "For power users and teams",
      features: [
        "Everything in Pro",
        "Team collaboration",
        "Custom integrations",
        "Advanced analytics",
        "Dedicated support",
        "Custom reports",
        "API access"
      ],
      limitations: [],
      buttonText: "Contact Sales",
      buttonVariant: "outline" as const,
      popular: false,
      current: false,
      priceId: "price_enterprise_monthly" // Replace with your actual Stripe price ID
    }
  ];

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading billing information...</div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600">Manage your subscription and billing preferences</p>
        </div>

        {/* Current Status */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-500" />
              Current Plan
            </CardTitle>
            <CardDescription>Your subscription status and usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={userData?.is_subscribed ? "default" : "secondary"}>
                    {userData?.is_subscribed ? "Pro Plan" : "Free Plan"}
                  </Badge>
                  {userData?.is_subscribed && <Star className="h-4 w-4 text-yellow-500" />}
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  Email: {userData?.email}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  {userData?.is_subscribed
                    ? "Unlimited AI analyses available"
                    : `${usageToday}/2 free analyses used today`}
                </p>
                {userData?.subscription_id && (
                  <p className="text-xs text-gray-500">
                    Subscription ID: {userData.subscription_id}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={checkSubscription}>
                  Refresh Status
                </Button>
                {userData?.is_subscribed && (
                  <Button
                    variant="outline"
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                  >
                    {portalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Manage Subscription
                  </Button>
                )}
              </div>
            </div>

            {!userData?.is_subscribed && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium">Upgrade to unlock unlimited access!</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  You've used {usageToday} of your 2 daily free analyses.
                  Upgrade to Pro for unlimited AI-powered insights.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Plans */}
        <div>
          <h2 className="text-2xl font-bold text-center mb-2">Choose Your Plan</h2>
          <p className="text-gray-600 text-center mb-8">
            Select the perfect plan for your health and wellness journey
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${plan.popular ? 'border-blue-500 border-2' : ''} ${plan.current ? 'bg-blue-50' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                  </div>
                )}

                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    {plan.name === 'Free' && <Users className="h-5 w-5" />}
                    {plan.name === 'Pro' && <Star className="h-5 w-5" />}
                    {plan.name === 'Enterprise' && <Shield className="h-5 w-5" />}
                    {plan.name}
                  </CardTitle>
                  <div className="text-3xl font-bold">
                    {plan.price}
                    <span className="text-sm font-normal text-gray-600">/{plan.period}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {plan.limitations.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      {plan.limitations.map((limitation, index) => (
                        <div key={index} className="flex items-center gap-2 text-gray-500">
                          <span className="text-sm">• {limitation}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    variant={plan.buttonVariant}
                    className="w-full"
                    disabled={plan.current || upgradeLoading}
                    onClick={() => {
                      if (plan.name === 'Pro' && !userData?.is_subscribed) {
                        handleUpgrade(plan.priceId);
                      } else if (plan.name === 'Enterprise') {
                        toast.info("Enterprise sales coming soon!");
                      }
                    }}
                  >
                    {upgradeLoading && plan.name === 'Pro' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {plan.current ? "Current Plan" : plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">What happens when I upgrade?</h4>
              <p className="text-sm text-gray-600">
                You'll get immediate access to unlimited AI analyses and all Pro features.
                Your billing cycle starts immediately.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Can I cancel anytime?</h4>
              <p className="text-sm text-gray-600">
                Yes! You can cancel your subscription at any time. You'll continue to have
                access until the end of your current billing period.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">What payment methods do you accept?</h4>
              <p className="text-sm text-gray-600">
                We accept all major credit cards through Stripe. Payment is secure and encrypted.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
};

export default Billing;
