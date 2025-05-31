
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Camera, FileText, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import SidebarLayout from "@/components/layout/SidebarLayout";

const Capture = () => {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("food");
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

      console.log('Calling OpenAI analysis...');

      // Call OpenAI analysis function
      const { data: analysisResult, error: analysisError } = await supabase.functions
        .invoke('analyze-content', {
          body: {
            description,
            imageUrl,
            category
          }
        });

      if (analysisError) {
        console.error('Analysis error:', analysisError);
        throw new Error(analysisError.message || 'Analysis failed');
      }

      const { analysis, metadata } = analysisResult;
      console.log('Analysis received:', analysis);
      console.log('Metadata:', metadata);

      // Insert into appropriate table based on category
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

      toast.success(`Successfully analyzed and saved as ${category}! Cost: $${metadata.cost.toFixed(6)}`);
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
            AI Capture
          </h1>
          <p className="text-gray-600">Upload images or describe your content for intelligent AI analysis</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Smart Analysis with OpenAI
            </CardTitle>
            <CardDescription>
              Advanced AI will analyze your content and extract detailed information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Selection */}
              <div className="space-y-2">
                <Label htmlFor="category">Content Category</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="food">Food & Nutrition</option>
                  <option value="receipt">Receipt & Expenses</option>
                  <option value="workout">Workout & Fitness</option>
                </select>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="image">Upload Image (Optional)</Label>
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what you're uploading..."
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
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze with OpenAI
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Enhanced Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Analysis Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• <strong>Food:</strong> Nutrition analysis, calorie estimation, ingredient identification</li>
              <li>• <strong>Receipts:</strong> Expense extraction, vendor detection, itemized lists</li>
              <li>• <strong>Workouts:</strong> Exercise classification, duration estimation, calorie burn calculation</li>
              <li>• <strong>Smart Vision:</strong> AI can analyze images to enhance accuracy</li>
              <li>• <strong>Cost Tracking:</strong> Real-time API usage and cost monitoring</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
};

export default Capture;
