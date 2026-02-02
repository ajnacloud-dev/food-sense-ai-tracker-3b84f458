
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Camera, Loader2, AlertCircle, Mic } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { FileUpload } from "@/components/capture/FileUpload";
import { ProcessingIndicator } from "@/components/capture/ProcessingIndicator";
import { uploadFile } from "@/utils/analysisService";
import { useUsageCheck } from "@/hooks/useUsageCheck";
import { useAuth } from "@/contexts/AuthContext";
import { createPendingAnalysis } from "@/utils/pendingAnalysisService";
import VoiceInput from "@/components/capture/VoiceInput";
import PullToRefresh from "@/components/pwa/PullToRefresh";
import { useAnalysisQueue } from "@/hooks/useAnalysisQueue";

const Capture = () => {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const { checkUsageLimits, incrementUsage, rollbackUsage } = useUsageCheck();
  const { user } = useAuth();
  const { queueAnalysis } = useAnalysisQueue();

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const handleVoiceTranscription = (text: string) => {
    setDescription(prev => prev ? `${prev} ${text}` : text);
    toast.success('Voice note added to description');
  };

  const handleRefresh = async () => {
    // Custom refresh logic for capture page
    setFile(null);
    setDescription("");
    setError("");
    toast.success('Capture form refreshed');
  };

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
      userData = checkedUserData;

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

      // Step 4: Call analyze endpoint directly
      setUploadProgress('Analyzing with GPT-5.2...');

      const analyzeResponse = await fetch('/v1/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('mock_token') || user.id}`
        },
        body: JSON.stringify({
          user_id: user.id,
          description: description || 'AI-analyzed content',
          image_url: fileUrl || ''
        })
      });

      if (!analyzeResponse.ok) {
        const error = await analyzeResponse.json();
        throw new Error(error.error || 'Failed to analyze');
      }

      const result = await analyzeResponse.json();

      // Success! Analysis completed
      toast.success("Analysis completed! 🚀", {
        description: `${result.summary?.description || 'Food analyzed'}: ${result.summary?.calories || 0} calories`,
        action: {
          label: 'View Details',
          onClick: () => navigate(`/food/${result.entry_id}`)
        }
      });

      // Reset form immediately - don't block UI
      setFile(null);
      setDescription("");
      setLoading(false);
      setUploadProgress('');

      // Optional: Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate("/dashboard", {
          state: { shouldRefresh: true }
        });
      }, 1500);

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
      <PullToRefresh onRefresh={handleRefresh}>
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
                Upload an image or PDF, add voice notes, or describe what you want to track. Advanced AI analysis will run in the background.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <FileUpload
                  file={file}
                  onFileChange={setFile}
                />

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                    Description
                    <span className="text-xs text-gray-500">(Optional)</span>
                  </label>
                  <div className="space-y-2">
                    <Textarea
                      id="description"
                      placeholder="Describe what you're capturing or add voice notes..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="text-base"
                    />
                    <div className="flex justify-end">
                      <VoiceInput
                        onTranscription={handleVoiceTranscription}
                        disabled={loading}
                        placeholder="Add voice note"
                      />
                    </div>
                  </div>
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
      </PullToRefresh>
    </SidebarLayout>
  );
};

export default Capture;
