
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Check } from "lucide-react";

interface InvitationCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFilled?: boolean;
}

export const InvitationCodeInput = ({ 
  value, 
  onChange, 
  disabled = false, 
  autoFilled = false 
}: InvitationCodeInputProps) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor="invitationCode" className="flex items-center gap-2">
        <UserPlus className="h-4 w-4" />
        Invitation Code {autoFilled ? "(Auto-filled)" : "(Optional)"}
        {value && <Check className="h-4 w-4 text-green-600" />}
      </Label>
      <Input
        id="invitationCode"
        type="text"
        placeholder="Enter invitation code if you have one"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`
          transition-colors duration-200
          ${value ? "border-green-300 bg-green-50" : ""}
          ${focused ? "ring-2 ring-blue-200" : ""}
          ${disabled ? "opacity-50" : ""}
        `}
      />
      {value && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Check className="h-4 w-4" />
          <span>
            You're joining as a caretaker with invitation code: <code className="font-mono">{value}</code>
          </span>
        </div>
      )}
    </div>
  );
};
