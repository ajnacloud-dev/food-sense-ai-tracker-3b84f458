import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Camera, Loader2, Sparkles, Workflow, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import SidebarLayout from "@/components/layout/SidebarLayout";

const Capture = () => {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [processingMethod, setProcessingMethod] = useState<'standard' | 'langgraph'>('standard');
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error("Please upload a valid image file (JPEG, PNG, WebP, or GIF)");
        return;
      }
      
      setFile(selectedFile);
      toast.success(`File selected: ${selectedFile.name}`);
    }
  };

  const insertAnalysisResult = async (userId: string, category: string, analysis: any, imageUrl: string | null, description: string) => {
    let insertData: any = {
      user_id: userId,
      image_url: imageUrl,
      description: description || 'AI-analyzed content',
    };

    let tableName = '';

    switch (category) {
      case 'food':
        tableName = 'food_entries';
        insertData.calories = analysis.meal_summary?.total_nutrition?.calories || analysis.calories || 0;
        insertData.ingredients = analysis.food_items || analysis.ingredients || {};
        insertData.extracted_nutrients = analysis;
        break;
      case 'receipt':
        tableName = 'receipts';
        insertData.vendor = analysis.merchant?.store_name || analysis.vendor || 'Unknown Store';
        insertData.receipt_date = analysis.transaction?.date || analysis.date || new Date().toISOString().split('T')[0];
        insertData.total_amount = analysis.total || 0;
        insertData.items = analysis;
        break;
      case 'workout':
        tableName = 'workouts';
        const workoutType = analysis.workout_summary?.workout_type || analysis.type || 'other';
        // Ensure workout type is one of the allowed enum values
        const allowedWorkoutTypes = ['cardio', 'strength', 'flexibility', 'sports', 'other'];
        insertData.workout_type = allowedWorkoutTypes.includes(workoutType) ? workoutType : 'other';
        insertData.duration = analysis.workout_summary?.duration_minutes || analysis.duration || 0;
        insertData.calories_burned = analysis.workout_summary?.estimated_calories_burned || analysis.calories || 0;
        insertData.notes = JSON.stringify(analysis);
        break;
      default:
        throw new Error(`Unsupported category: ${category}`);
    }

    const { data, error: insertError } = await supabase
      .from(tableName as any)
      .insert(insertData)
      .select('id')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }
    
    if (!data || typeof data !== 'object' || !('id' in data) || !data.id) {
      throw new Error('No ID returned from insert operation');
    }
    
    return data.id as string;
  };

  const navigateToCategory = (category: string, entryId?: string) => {
    switch (category) {
      case 'food':
        navigate(entryId ? `/food/${entryId}` : '/food');
        break;
      case 'receipt':
        navigate(entryId ? `/receipts/${entryId}` : '/receipts');
        break;
      case 'workout':
        navigate(entryId ? `/workouts/${entryId}` : '/workouts');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !description) {
      toast.error("Please upload an image or provide a description");
      return;
    }

    setLoading(true);
    setUploadProgress('Initializing...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      setUploadProgress('Checking usage limits...');

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
        setUploadProgress('Uploading image...');
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        console.log(`Uploading file: ${fileName}, Size: ${file.size} bytes`);
        
        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
        console.log(`Image uploaded successfully: ${imageUrl}`);
        setUploadProgress('Image uploaded successfully...');
      }

      setUploadProgress('AI is analyzing your content...');

      if (processingMethod === 'langgraph') {
        console.log('Using LangGraph workflow for analysis...');
        
        const { data: workflowResult, error: workflowError } = await supabase.functions
          .invoke('langgraph-workflow', {
            body: {
              description,
              imageUrl,
              workflowConfig: null // Use default workflow
            }
          });

        if (workflowError) {
          console.error('LangGraph workflow error:', workflowError);
          throw new Error(workflowError.message || 'LangGraph workflow failed');
        }

        if (!workflowResult.success) {
          throw new Error(workflowResult.error || 'Workflow execution failed');
        }

        const { classification, analysis, enrichment, validation, metadata } = workflowResult.result;
        
        console.log('LangGraph workflow completed:', {
          category: classification?.category,
          tokens: metadata?.tokensUsed,
          cost: metadata?.costs
        });

        // Use the final validation result or fall back to analysis
        const finalAnalysis = validation?.cleanedData || analysis;
        const category = classification?.category;

        // Insert into appropriate table based on classification
        const entryId = await insertAnalysisResult(user.id, category, finalAnalysis, imageUrl, description);
        
        toast.success(`LangGraph analysis complete! Category: ${category}. Cost: $${metadata?.costs?.toFixed(6) || '0.00'}`);
        navigateToCategory(category, entryId);

      } else {
        console.log('Using standard auto-classification...');

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
        console.log('Standard analysis completed:', {
          category,
          method: metadata?.imageProcessingMethod,
          cost: metadata?.cost
        });

        // Insert into appropriate table based on AI classification
        const entryId = await insertAnalysisResult(user.id, category, analysis, imageUrl, description);

        toast.success(`AI classified as ${category}! Analysis complete. Cost: $${metadata?.cost?.toFixed(6) || '0.00'}`);
        navigateToCategory(category, entryId);
      }

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

    } catch (error: any) {
      console.error('Processing error:', error);
      toast.error(error.message || "Failed to process upload");
    } finally {
      setLoading(false);
      setUploadProgress('');
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
              {/* Processing Method Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">AI Processing Method</label>
                <Select value={processingMethod} onValueChange={(value: 'standard' | 'langgraph') => setProcessingMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Standard AI (Fast & Efficient)
                      </div>
                    </SelectItem>
                    <SelectItem value="langgraph">
                      <div className="flex items-center gap-2">
                        <Workflow className="h-4 w-4" />
                        LangGraph Workflow (Advanced)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {processingMethod === 'standard' 
                    ? 'Single-pass AI analysis with classification and detailed extraction'
                    : 'Multi-step workflow with classification, analysis, enrichment, and validation'
                  }
                </p>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <label htmlFor="image" className="text-sm font-medium">Upload Image (Optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    id="image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="image" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600">
                      {file ? (
                        <span className="text-green-600 font-medium">{file.name}</span>
                      ) : (
                        "Click to upload or drag and drop"
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">JPEG, PNG, WebP, GIF up to 10MB</p>
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

              {/* Progress Indicator */}
              {loading && uploadProgress && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">{uploadProgress}</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button type="submit" disabled={loading || (!file && !description)} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {processingMethod === 'langgraph' ? 'Running LangGraph workflow...' : 'AI is analyzing and classifying...'}
                  </>
                ) : (
                  <>
                    {processingMethod === 'langgraph' ? (
                      <Workflow className="mr-2 h-4 w-4" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
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
            <CardTitle className="text-lg">AI Processing Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-green-600 mb-2">Standard AI Processing</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Fast content classification</li>
                  <li>• Direct category analysis</li>
                  <li>• Cost-effective processing</li>
                  <li>• Reliable for most use cases</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-purple-600 mb-2">LangGraph Workflow</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Multi-step analysis pipeline</li>
                  <li>• Data enrichment & insights</li>
                  <li>• Validation & quality checks</li>
                  <li>• Advanced health recommendations</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Image Processing</p>
                  <p className="text-yellow-700">Images are processed with automatic fallback from URL to base64 encoding for maximum compatibility with AI vision models.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
};

export default Capture;
