
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Workflow } from "lucide-react";

interface ProcessingMethodSelectorProps {
  value: 'standard' | 'langgraph';
  onChange: (value: 'standard' | 'langgraph') => void;
}

export const ProcessingMethodSelector = ({ value, onChange }: ProcessingMethodSelectorProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">AI Processing Method</label>
      <Select value={value} onValueChange={onChange}>
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
        {value === 'standard' 
          ? 'Single-pass AI analysis with classification and detailed extraction'
          : 'Multi-step workflow with classification, analysis, enrichment, and validation'
        }
      </p>
    </div>
  );
};
