import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Camera, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { FileUpload } from "@/components/capture/FileUpload";
import { ProcessingIndicator } from "@/components/capture/ProcessingIndicator";
import { uploadFile } from "@/utils/analysisService";
import { useUsageCheck } from "@/hooks/useUsageCheck";
import { useAuth } from "@/contexts/AuthContext";
import { createPendingAnalysis } from "@/utils/pendingAnalysisService";

const Capture = () => {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const { checkUsageLimits, incrementUsage, rollbackUsage } = useUsageCheck();
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
      const { error: asyncError } = await supabase.functions.invoke('async-analyze', {
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

      // Navigate back to dashboard with refresh flag
      navigate("/dashboard", { 
        state: { shouldRefresh: true },
        replace: true 
      });

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

  if (!user) {
    return null;
  }

  return (
    <SidebarLayout>
      <div className="max-w-lg mx-auto space-y-4 p-4 pt-16 lg:pt-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
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
              Upload an image or PDF, or describe what you want to track. Advanced AI analysis will run in the background.
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

              <Button 
                type="submit" 
                disabled={loading || (!file && !description)} 
                className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Analysis...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Start AI Analysis
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
};

export default Capture;
