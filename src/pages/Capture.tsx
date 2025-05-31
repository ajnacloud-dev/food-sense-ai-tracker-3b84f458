
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Camera, Loader2, Workflow } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { FileUpload } from "@/components/capture/FileUpload";
import { ProcessingMethodSelector } from "@/components/capture/ProcessingMethodSelector";
import { ProcessingIndicator } from "@/components/capture/ProcessingIndicator";
import { ProcessingTips } from "@/components/capture/ProcessingTips";
import { insertAnalysisResult, uploadImage } from "@/utils/analysisService";
import { navigateToCategory } from "@/utils/navigationUtils";
import { useUsageCheck } from "@/hooks/useUsageCheck";
import { useAuth } from "@/contexts/AuthContext";

const Capture = () => {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [processingMethod, setProcessingMethod] = useState<'standard' | 'langgraph'>('standard');
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
    setUploadProgress('Initializing...');
    
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
        navigateToCategory(navigate, category, entryId);

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
        navigateToCategory(navigate, category, entryId);
      }

      // Update usage log
      if (!userData?.is_subscribed) {
        await updateUsageLog(user.id, currentUsage);
      }

    } catch (error: any) {
      console.error('Processing error:', error);
      toast.error(error.message || "Failed to process upload");
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

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
              <ProcessingMethodSelector 
                value={processingMethod} 
                onChange={setProcessingMethod} 
              />

              <FileUpload 
                file={file} 
                onFileChange={setFile} 
              />

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

              <ProcessingIndicator 
                loading={loading} 
                progress={uploadProgress} 
              />

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

        <ProcessingTips />
      </div>
    </SidebarLayout>
  );
};

export default Capture;
