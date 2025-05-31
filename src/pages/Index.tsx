
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Receipt, Dumbbell, TrendingUp, Zap, Shield, Users, BarChart3, Brain, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Camera,
      title: "AI Food Analysis",
      description: "Upload food photos for instant nutrition breakdown and calorie counting",
      color: "text-green-600"
    },
    {
      icon: Receipt,
      title: "Smart Receipt Scanning",
      description: "Extract and categorize grocery expenses with AI-powered receipt analysis",
      color: "text-blue-600"
    },
    {
      icon: Dumbbell,
      title: "Workout Tracking",
      description: "Log workouts and get AI insights on your fitness progress",
      color: "text-purple-600"
    },
    {
      icon: TrendingUp,
      title: "Health Insights",
      description: "Get personalized recommendations based on your data patterns",
      color: "text-orange-600"
    }
  ];

  const benefits = [
    { icon: Zap, text: "2 free AI analyses daily" },
    { icon: Shield, text: "Secure data protection" },
    { icon: Users, text: "Multi-user support" },
    { icon: BarChart3, text: "Advanced analytics" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">NutriWealth</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button onClick={() => navigate("/auth")}>
              Get Started Free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200">
            <Sparkles className="w-4 h-4 mr-1" />
            AI-Powered Health Tracking
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Transform Your Health with
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600"> AI Intelligence</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Upload food photos, receipts, and workout logs. Get instant AI analysis, track nutrition, monitor spending, and unlock personalized health insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8 py-3">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful AI Features</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Everything you need to take control of your health and nutrition in one intelligent platform
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <feature.icon className={`h-12 w-12 ${feature.color} mb-4`} />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why Choose NutriWealth?
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <benefit.icon className="h-6 w-6 text-green-600" />
                    <span className="text-lg text-gray-700">{benefit.text}</span>
                  </div>
                ))}
              </div>
              <Button size="lg" className="mt-8" onClick={() => navigate("/auth")}>
                Get Started Today
              </Button>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-green-100 rounded-2xl p-8">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Free Trial Includes:</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>✓ 2 AI analyses per day</li>
                  <li>✓ Food nutrition tracking</li>
                  <li>✓ Receipt expense analysis</li>
                  <li>✓ Workout logging</li>
                  <li>✓ Basic insights dashboard</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Health?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who are already tracking their health with AI
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate("/auth")}>
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <Brain className="h-8 w-8" />
            <span className="text-2xl font-bold">NutriWealth</span>
          </div>
          <div className="text-center text-gray-400">
            <p>&copy; 2024 NutriWealth. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
