
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { FileUpload } from "./FileUpload";
import { ProcessingIndicator } from "./ProcessingIndicator";
import { uploadFile } from "@/utils/analysisService";
import { useUsageCheck } from "@/hooks/useUsageCheck";
import { useAuth } from "@/contexts/AuthContext";
import { createPendingAnalysis } from "@/utils/pendingAnalysisService";

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisStarted?: () => void;
}

export const QuickCaptureModal = ({ isOpen, onClose, onAnalysisStarted }: QuickCaptureModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const { checkUsageLimits, updateUsageLog } = useUsageCheck();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !description) {
      toast.error("Please upload a file or provide a description");
      return;
    }

    if (!user) {
      toast.error("Please sign in to continue");
      navigate("/auth");
      return;
    }

    setLoading(true);
    setUploadProgress('Preparing...');
    setError('');
    
    try {
      setUploadProgress('Checking usage limits...');

      const usageCheck = await checkUsageLimits(user.id);
      if (!usageCheck) return;

      const { userData, currentUsage } = usageCheck;

      // Upload file if provided
      let fileUrl = null;
      if (file) {
        setUploadProgress('Uploading file...');
        fileUrl = await uploadFile(file, user.id);
      }

      setUploadProgress('Starting AI analysis...');

      // Create pending analysis record
      const pendingAnalysisId = await createPendingAnalysis(
        user.id,
        description || 'AI-analyzed content',
        fileUrl
      );

      // Start analysis with LangGraph workflow
      const { error: asyncError } = await supabase.functions.invoke('async-analyze', {
        body: {
          pendingAnalysisId,
          description,
          imageUrl: fileUrl
        }
      });

      if (asyncError) {
        console.error('Failed to start async analysis:', asyncError);
        throw new Error(asyncError.message || 'Failed to start analysis');
      }

      toast.success("AI analysis started! You'll be notified when complete.", {
        description: "Check your dashboard for updates"
      });

      // Call the callback to refresh the parent component
      onAnalysisStarted?.();
      
      onClose();

      // Update usage log for non-subscribed users
      if (!userData?.is_subscribed) {
        await updateUsageLog(user.id, currentUsage);
      }

      // Reset form
      setFile(null);
      setDescription("");

    } catch (error: any) {
      console.error('Processing error:', error);
      setError(error.message || "Failed to start analysis");
      toast.error(error.message || "Failed to start analysis");
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
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Smart Capture
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

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <p className="font-medium">Analysis Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

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
                  Starting...
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
