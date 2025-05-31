
import { Loader2 } from "lucide-react";

interface ProcessingIndicatorProps {
  loading: boolean;
  progress: string;
}

export const ProcessingIndicator = ({ loading, progress }: ProcessingIndicatorProps) => {
  if (!loading || !progress) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <div className="flex items-center gap-2 text-blue-700">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">{progress}</span>
      </div>
    </div>
  );
};
