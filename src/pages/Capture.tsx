
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Camera, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import SidebarLayout from "@/components/layout/SidebarLayout";

const Capture = () => {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !description) {
      toast.error("Please upload an image or provide a description");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check usage limits
      const today = new Date().toISOString().split('T')[0];
      const { data: userData } = await supabase
        .from('users')
        .select('is_subscribed')
        .eq('id', user.id)
        .single();

      let currentUsage = null;
      if (!userData?.is_subscribed) {
        const { data: usageData } = await supabase
          .from('api_usage_log')
          .select('usage_count')
          .eq('user_id', user.id)
          .eq('usage_date', today)
          .single();

        currentUsage = usageData;

        if (currentUsage && currentUsage.usage_count >= 2) {
          toast.error("Daily limit reached. Upgrade to Pro for unlimited access.");
          navigate("/billing");
          return;
        }
      }

      // Upload image if provided
      let imageUrl = null;
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      console.log('Calling AI for auto-classification and analysis...');

      // Call auto-classification function with enhanced analysis
      const { data: analysisResult, error: analysisError } = await supabase.functions
        .invoke('auto-classify-and-analyze', {
          body: {
            description,
            imageUrl
          }
        });

      if (analysisError) {
        console.error('Analysis error:', analysisError);
        throw new Error(analysisError.message || 'Analysis failed');
      }

      const { category, analysis, metadata } = analysisResult;
      console.log('AI classified as:', category);
      console.log('Analysis received:', analysis);
      console.log('Metadata:', metadata);

      // Insert into appropriate table based on AI classification
      let insertData: any = {
        user_id: user.id,
        image_url: imageUrl,
        description: description || 'AI-analyzed content',
      };

      let tableName = '';
      let redirectPath = '';

      switch (category) {
        case 'food':
          tableName = 'food_entries';
          insertData.calories = analysis.calories || 0;
          insertData.ingredients = analysis.ingredients || {};
          insertData.extracted_nutrients = analysis.nutrients || {};
          redirectPath = '/food';
          break;
        case 'receipt':
          tableName = 'receipts';
          insertData.vendor = analysis.vendor || 'Unknown Store';
          insertData.receipt_date = analysis.date || new Date().toISOString().split('T')[0];
          insertData.total_amount = analysis.total || 0;
          insertData.items = analysis.items || [];
          redirectPath = '/receipts';
          break;
        case 'workout':
          tableName = 'workouts';
          insertData.workout_type = analysis.type || 'other';
          insertData.duration = analysis.duration || 0;
          insertData.calories_burned = analysis.calories || 0;
          insertData.notes = analysis.notes || description || 'AI-analyzed workout';
          redirectPath = '/workouts';
          break;
        default:
          throw new Error(`Unsupported category: ${category}`);
      }

      const { error: insertError } = await supabase
        .from(tableName as any)
        .insert(insertData);

      if (insertError) throw insertError;

      // Update usage log
      if (!userData?.is_subscribed) {
        await supabase
          .from('api_usage_log')
          .upsert({
            user_id: user.id,
            usage_date: today,
            usage_count: (currentUsage?.usage_count || 0) + 1
          });
      }

      toast.success(`AI classified as ${category}! Analysis complete. Cost: $${metadata.cost.toFixed(6)}`);
      navigate(redirectPath);

    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Failed to process upload");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-blue-500" />
            AI Smart Capture
          </h1>
          <p className="text-gray-600">AI will automatically identify and analyze your content</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Intelligent Auto-Classification
            </CardTitle>
            <CardDescription>
              Advanced AI will automatically classify your content and extract detailed information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <label htmlFor="image" className="text-sm font-medium">Upload Image (Optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="image" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600">
                      {file ? file.name : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP up to 10MB</p>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description (Optional)</label>
                <Textarea
                  id="description"
                  placeholder="Describe what you're capturing... (AI will use this to improve classification accuracy)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <Button type="submit" disabled={loading || (!file && !description)} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AI is analyzing and classifying...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze with AI
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Enhanced Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Auto-Classification Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• <strong>Smart Detection:</strong> AI automatically identifies food, receipts, or workout content</li>
              <li>• <strong>Food Analysis:</strong> Nutrition facts, calorie estimation, ingredient identification</li>
              <li>• <strong>Receipt Processing:</strong> Expense extraction, vendor detection, itemized lists</li>
              <li>• <strong>Workout Recognition:</strong> Exercise classification, duration estimation, calorie burn</li>
              <li>• <strong>Visual Intelligence:</strong> Advanced image analysis for enhanced accuracy</li>
              <li>• <strong>Cost Tracking:</strong> Real-time API usage and cost monitoring</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
};

export default Capture;
