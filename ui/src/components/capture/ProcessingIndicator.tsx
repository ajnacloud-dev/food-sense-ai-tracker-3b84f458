
import { Loader2, Sparkles } from "lucide-react";

interface ProcessingIndicatorProps {
  loading: boolean;
  progress: string;
}

export const ProcessingIndicator = ({ loading, progress }: ProcessingIndicatorProps) => {
  if (!loading || !progress) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center gap-3 text-blue-700">
        <div className="relative">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <Loader2 className="h-3 w-3 animate-spin absolute -top-1 -right-1 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium">{progress}</p>
          <p className="text-xs text-blue-600">Please wait while AI processes your content</p>
        </div>
      </div>
    </div>
  );
};
