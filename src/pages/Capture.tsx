
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { FileUpload } from "@/components/capture/FileUpload";
import { ProcessingIndicator } from "@/components/capture/ProcessingIndicator";
import { insertAnalysisResult, uploadImage } from "@/utils/analysisService";
import { navigateToCategory } from "@/utils/navigationUtils";
import { useUsageCheck } from "@/hooks/useUsageCheck";
import { useAuth } from "@/contexts/AuthContext";

const Capture = () => {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const navigate = useNavigate();
  const { checkUsageLimits, updateUsageLog } = useUsageCheck();
  const { user } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !description) {
      toast.error("Please upload an image or provide a description");
      return;
    }

    if (!user) {
      toast.error("Please sign in to continue");
      navigate("/auth");
      return;
    }

    setLoading(true);
    setUploadProgress('Preparing...');
    
    try {
      setUploadProgress('Checking usage limits...');

      const usageCheck = await checkUsageLimits(user.id);
      if (!usageCheck) return;

      const { userData, currentUsage } = usageCheck;

      // Upload image if provided
      let imageUrl = null;
      if (file) {
        setUploadProgress('Uploading image...');
        imageUrl = await uploadImage(file, user.id);
      }

      setUploadProgress('AI is analyzing your content...');

      // Use intelligent auto-selection of processing method
      // For most users, standard processing is optimal
      const useAdvancedProcessing = userData?.is_subscribed || false;

      if (useAdvancedProcessing) {
        console.log('Using advanced workflow for subscribed user...');
        
        const { data: workflowResult, error: workflowError } = await supabase.functions
          .invoke('langgraph-workflow', {
            body: {
              description,
              imageUrl,
              workflowConfig: null
            }
          });

        if (workflowError) {
          console.error('Advanced workflow error:', workflowError);
          throw new Error(workflowError.message || 'Analysis failed');
        }

        if (!workflowResult.success) {
          throw new Error(workflowResult.error || 'Analysis failed');
        }

        const { classification, analysis, enrichment, validation, metadata } = workflowResult.result;
        const finalAnalysis = validation?.cleanedData || analysis;
        const category = classification?.category;

        const entryId = await insertAnalysisResult(user.id, category, finalAnalysis, imageUrl, description);
        
        toast.success(`Analysis complete! Categorized as ${category}`);
        navigateToCategory(navigate, category, entryId);

      } else {
        console.log('Using standard analysis...');

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

        const { category, analysis } = analysisResult;

        const entryId = await insertAnalysisResult(user.id, category, analysis, imageUrl, description);

        toast.success(`AI classified as ${category}! Analysis complete.`);
        navigateToCategory(navigate, category, entryId);
      }

      // Update usage log for non-subscribed users
      if (!userData?.is_subscribed) {
        await updateUsageLog(user.id, currentUsage);
      }

      // Reset form
      setFile(null);
      setDescription("");

    } catch (error: any) {
      console.error('Processing error:', error);
      toast.error(error.message || "Failed to process content");
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <SidebarLayout>
      <div className="max-w-lg mx-auto space-y-4 p-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            Smart Capture
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            AI will automatically analyze and organize your content
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Camera className="h-5 w-5" />
              Capture & Analyze
            </CardTitle>
            <CardDescription className="text-sm">
              Upload an image or describe what you want to track
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FileUpload 
                file={file} 
                onFileChange={setFile} 
              />

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description (Optional)
                </label>
                <Textarea
                  id="description"
                  placeholder="Describe what you're capturing..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="text-base"
                />
              </div>

              <ProcessingIndicator 
                loading={loading} 
                progress={uploadProgress} 
              />

              <Button 
                type="submit" 
                disabled={loading || (!file && !description)} 
                className="w-full h-12 text-base"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Analyze with AI
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            AI will automatically categorize and extract insights from your content
          </p>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default Capture;
