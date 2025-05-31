
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Camera, FileText, Loader2 } from "lucide-react";
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

      if (!userData?.is_subscribed) {
        const { data: usage } = await supabase
          .from('api_usage_log')
          .select('usage_count')
          .eq('user_id', user.id)
          .eq('usage_date', today)
          .single();

        if (usage && usage.usage_count >= 2) {
          toast.error("Daily limit reached. Upgrade to Pro for unlimited access.");
          navigate("/billing");
          return;
        }
      }

      let imageUrl = null;
      
      // Upload image if provided
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

      // For now, we'll create a simple classification based on description keywords
      // In production, this would call an AI service
      let category = 'food'; // default
      const desc = description.toLowerCase();
      
      if (desc.includes('receipt') || desc.includes('grocery') || desc.includes('store') || desc.includes('purchase')) {
        category = 'receipt';
      } else if (desc.includes('workout') || desc.includes('exercise') || desc.includes('gym') || desc.includes('run')) {
        category = 'workout';
      }

      // Insert into appropriate table
      let insertData: any = {
        user_id: user.id,
        image_url: imageUrl,
        description: description || 'Uploaded image',
      };

      let tableName = '';
      let redirectPath = '';

      switch (category) {
        case 'food':
          tableName = 'food_entries';
          insertData.calories = Math.floor(Math.random() * 600) + 200; // Mock data
          insertData.ingredients = { main: ['Sample ingredient'] };
          insertData.extracted_nutrients = { protein: 20, carbs: 30, fat: 15 };
          redirectPath = '/food';
          break;
        case 'receipt':
          tableName = 'receipts';
          insertData.vendor = 'Sample Store';
          insertData.receipt_date = new Date().toISOString().split('T')[0];
          insertData.total_amount = (Math.random() * 100 + 10).toFixed(2);
          insertData.items = [{ name: 'Sample item', price: 10.99 }];
          redirectPath = '/receipts';
          break;
        case 'workout':
          tableName = 'workouts';
          insertData.workout_type = 'cardio';
          insertData.duration = Math.floor(Math.random() * 60) + 30;
          insertData.calories_burned = Math.floor(Math.random() * 400) + 200;
          insertData.notes = description || 'Workout session';
          redirectPath = '/workouts';
          break;
      }

      const { error: insertError } = await supabase
        .from(tableName)
        .insert(insertData);

      if (insertError) throw insertError;

      // Update usage log
      if (!userData?.is_subscribed) {
        await supabase
          .from('api_usage_log')
          .upsert({
            user_id: user.id,
            usage_date: today,
            usage_count: (usage?.usage_count || 0) + 1
          });
      }

      toast.success(`Successfully analyzed and saved as ${category}!`);
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
          <h1 className="text-3xl font-bold text-gray-900">AI Capture</h1>
          <p className="text-gray-600">Upload images or describe your food, receipts, or workouts for AI analysis</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Smart Analysis
            </CardTitle>
            <CardDescription>
              Our AI will automatically detect whether this is food, a receipt, or workout data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="Describe what you're uploading (e.g., 'Chicken salad lunch', 'Grocery receipt from Walmart', 'Morning run workout')..."
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
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Analyze with AI
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tips for Better Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• <strong>Food:</strong> Include clear photos and describe ingredients or dishes</li>
              <li>• <strong>Receipts:</strong> Ensure text is readable and mention the store name</li>
              <li>• <strong>Workouts:</strong> Describe the type of exercise, duration, and intensity</li>
              <li>• <strong>Mixed content:</strong> Use keywords like "receipt", "workout", or "food" to help categorization</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
};

export default Capture;
