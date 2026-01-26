
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { backendApi } from "@/lib/api/client";
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
  const { checkUsageLimits, incrementUsage, rollbackUsage } = useUsageCheck();
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
    
    let usageIncremented = false;
    let userData: any = null;
    
    try {
      setUploadProgress('Checking usage limits...');

      // Step 1: Check usage limits
      const usageCheck = await checkUsageLimits(user.id);
      if (!usageCheck) {
        setLoading(false);
        return;
      }

      const { userData: checkedUserData, currentUsage } = usageCheck;
      userData = checkedUserData; // Store in outer scope

      // Step 2: Increment usage BEFORE starting analysis (for non-subscribed users)
      if (!userData?.is_subscribed) {
        setUploadProgress('Updating usage...');
        await incrementUsage(user.id, currentUsage);
        usageIncremented = true;
        console.log('Usage incremented before analysis');
      }

      // Step 3: Upload file if provided
      let fileUrl = null;
      if (file) {
        setUploadProgress('Uploading file...');
        fileUrl = await uploadFile(file, user.id);
      }

      setUploadProgress('Creating analysis record...');

      // Step 4: Create pending analysis record
      const pendingAnalysisId = await createPendingAnalysis(
        user.id,
        description || 'AI-analyzed content',
        fileUrl
      );

      setUploadProgress('Starting AI analysis...');

      // Step 5: Start analysis with enhanced error handling
      const { error: asyncError } = await backendApi.functions.invoke('async-analyze', {
        body: {
          pendingAnalysisId,
          description,
          imageUrl: fileUrl,
          skipUsageCheck: true // Backend should skip usage check since we already did it
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

      // Reset form
      setFile(null);
      setDescription("");

    } catch (error: any) {
      console.error('Processing error:', error);
      
      // Rollback usage if we incremented it but analysis failed
      if (usageIncremented && userData && !userData.is_subscribed) {
        console.log('Rolling back usage due to error');
        try {
          await rollbackUsage(user.id);
          toast.info("Usage count restored due to analysis failure");
        } catch (rollbackError) {
          console.error('Failed to rollback usage:', rollbackError);
        }
      }
      
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
      <DialogContent>
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
