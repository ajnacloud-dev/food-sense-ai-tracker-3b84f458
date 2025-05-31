
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { FileUpload } from "./FileUpload";
import { ProcessingIndicator } from "./ProcessingIndicator";
import { insertAnalysisResult, uploadImage } from "@/utils/analysisService";
import { navigateToCategory } from "@/utils/navigationUtils";
import { useUsageCheck } from "@/hooks/useUsageCheck";
import { useAuth } from "@/contexts/AuthContext";

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickCaptureModal = ({ isOpen, onClose }: QuickCaptureModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const navigate = useNavigate();
  const { checkUsageLimits, updateUsageLog } = useUsageCheck();
  const { user } = useAuth();

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
      const useAdvancedProcessing = userData?.is_subscribed || false;
      let category, analysis, entryId;

      if (useAdvancedProcessing) {
        console.log('Attempting advanced workflow for subscribed user...');
        
        try {
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
            throw new Error(workflowError.message || 'Advanced workflow failed');
          }

          if (!workflowResult?.success) {
            throw new Error(workflowResult?.error || 'Advanced workflow failed');
          }

          const { classification, analysis: workflowAnalysis, enrichment, validation } = workflowResult.result;
          const finalAnalysis = validation?.cleanedData || workflowAnalysis;
          category = classification?.category;
          analysis = finalAnalysis;

          entryId = await insertAnalysisResult(user.id, category, analysis, imageUrl, description);
          
          toast.success(`Advanced analysis complete! Categorized as ${category}`);

        } catch (advancedError) {
          console.error('Advanced workflow failed, falling back to standard analysis:', advancedError);
          
          // Fallback to standard analysis
          setUploadProgress('Advanced analysis unavailable, using standard analysis...');
          
          const { data: analysisResult, error: analysisError } = await supabase.functions
            .invoke('auto-classify-and-analyze', {
              body: {
                description,
                imageUrl
              }
            });

          if (analysisError) {
            console.error('Standard analysis error:', analysisError);
            throw new Error(analysisError.message || 'Analysis failed');
          }

          category = analysisResult.category;
          analysis = analysisResult.analysis;

          entryId = await insertAnalysisResult(user.id, category, analysis, imageUrl, description);
          
          toast.success(`Analysis complete! Categorized as ${category}`);
        }

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

        category = analysisResult.category;
        analysis = analysisResult.analysis;

        entryId = await insertAnalysisResult(user.id, category, analysis, imageUrl, description);

        toast.success(`AI classified as ${category}! Analysis complete.`);
      }

      onClose();
      navigateToCategory(navigate, category, entryId);

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

  const handleClose = () => {
    if (!loading) {
      setFile(null);
      setDescription("");
      setUploadProgress('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Quick Capture
          </DialogTitle>
        </DialogHeader>

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
              className="text-sm"
            />
          </div>

          <ProcessingIndicator 
            loading={loading} 
            progress={uploadProgress} 
          />

          <div className="flex gap-2">
            <Button 
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || (!file && !description)} 
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
