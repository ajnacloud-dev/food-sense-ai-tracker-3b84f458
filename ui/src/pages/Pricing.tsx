
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, CheckCircle, ArrowLeft, Star, Zap, Shield, Users } from "lucide-react";

const Pricing = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleSignUp = (plan: string) => {
    navigate(`/auth?plan=${plan}`);
  };

  const handleBack = () => {
    navigate("/");
  };

  const plans = [
    {
      name: "Starter",
      description: "Perfect for individuals starting their wellness journey",
      monthlyPrice: 9,
      yearlyPrice: 79,
      features: [
        "AI-powered food tracking",
        "Basic nutrition insights",
        "Meal recommendations",
        "Progress tracking",
        "Mobile app access",
        "Email support"
      ],
      popular: false,
      cta: "Start Free Trial"
    },
    {
      name: "Professional",
      description: "For serious health enthusiasts and fitness professionals",
      monthlyPrice: 19,
      yearlyPrice: 179,
      features: [
        "Everything in Starter",
        "Advanced analytics & reports",
        "Custom goal setting",
        "Meal planning & prep guides",
        "Integration with fitness devices",
        "Priority support",
        "Export data capabilities"
      ],
      popular: true,
      cta: "Start Free Trial"
    },
    {
      name: "Care Team",
      description: "For healthcare providers and care teams",
      monthlyPrice: 39,
      yearlyPrice: 379,
      features: [
        "Everything in Professional",
        "Multi-patient dashboard",
        "Secure patient data sharing",
        "HIPAA compliance",
        "Custom branding",
        "Advanced permissions",
        "Dedicated account manager",
        "24/7 phone support"
      ],
      popular: false,
      cta: "Contact Sales"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-green-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                NutriWealth
              </span>
            </div>
            <Button onClick={() => navigate("/auth")} className="bg-green-600 hover:bg-green-700 text-white">
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full text-green-700 text-sm font-medium mb-8">
              <Star className="h-4 w-4" />
              14-Day Free Trial • No Credit Card Required
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-green-800 to-gray-900 bg-clip-text text-transparent">
              Choose Your
              <span className="block text-green-600">Wellness Plan</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Select the perfect plan for your health journey. All plans include our core AI-powered features 
              with a 14-day free trial to get you started.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  billingCycle === 'yearly' ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
                Yearly
              </span>
              {billingCycle === 'yearly' && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Save 25%
                </Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={plan.name} 
                className={`relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${
                  plan.popular 
                    ? 'ring-2 ring-green-500 scale-105' 
                    : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8 pt-8">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
                    index === 0 ? 'bg-gradient-to-br from-blue-100 to-blue-200' :
                    index === 1 ? 'bg-gradient-to-br from-green-100 to-green-200' :
                    'bg-gradient-to-br from-purple-100 to-purple-200'
                  }`}>
                    {index === 0 ? <Zap className="h-8 w-8 text-blue-600" /> :
                     index === 1 ? <Star className="h-8 w-8 text-green-600" /> :
                     <Shield className="h-8 w-8 text-purple-600" />}
                  </div>
                  
                  <CardTitle className="text-2xl text-gray-900 mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-600 mb-6">
                    {plan.description}
                  </CardDescription>
                  
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 mb-1">
                      ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                      <span className="text-lg font-normal text-gray-500">
                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <div className="text-sm text-green-600 font-medium">
                        Save ${(plan.monthlyPrice * 12) - plan.yearlyPrice} per year
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    onClick={() => handleSignUp(plan.name.toLowerCase())}
                    className={`w-full py-3 h-auto ${
                      plan.popular 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                  
                  <p className="text-xs text-gray-500 text-center mt-4">
                    14-day free trial • Cancel anytime
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
              Frequently Asked Questions
            </h2>
            
            <div className="grid gap-8 text-left">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can I switch plans anytime?
                </h3>
                <p className="text-gray-600">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                  and we'll prorate any billing adjustments.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What happens after my free trial?
                </h3>
                <p className="text-gray-600">
                  After your 14-day free trial, you'll be charged for your selected plan. 
                  You can cancel anytime during the trial with no charges.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Is my data secure?
                </h3>
                <p className="text-gray-600">
                  Absolutely. We use bank-level encryption and are HIPAA compliant for our Care Team plans. 
                  Your data is never shared without your explicit permission.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Do you offer refunds?
                </h3>
                <p className="text-gray-600">
                  We offer a 30-day money-back guarantee on all plans. If you're not satisfied, 
                  contact us for a full refund.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-white">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">NutriWealth</span>
          </div>
          <p className="text-gray-400 text-sm">
            Secure • Private • Personal Wellness Management
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
