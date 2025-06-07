
import { User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCaretakerData } from "@/contexts/CaretakerDataContext";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

const CaretakerPatientSelector = () => {
  const { 
    participants, 
    selectedParticipantId, 
    setSelectedParticipantId, 
    loading, 
    error 
  } = useCaretakerData();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-blue-700 font-semibold text-xs mb-1 group-data-[collapsible=icon]:sr-only">
        Active Patient
      </SidebarGroupLabel>
      <SidebarGroupContent>
        {/* Collapsed state indicator */}
        <div className="group-data-[collapsible=icon]:block hidden mb-2">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
          </div>
          {participants.length > 0 && selectedParticipantId && (
            <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-1"></div>
          )}
        </div>

        {/* Expanded state selector */}
        <div className="group-data-[collapsible=icon]:hidden">
          {loading ? (
            <div className="p-3 bg-gray-50 rounded-lg animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : error ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-sm text-red-600 font-medium">Error loading patients</span>
            </div>
          ) : participants.length > 0 ? (
            <Select
              value={selectedParticipantId || ''}
              onValueChange={(value) => {
                console.log('CaretakerPatientSelector: Patient selected:', value);
                setSelectedParticipantId(value);
              }}
            >
              <SelectTrigger className="h-10 bg-white border-gray-300 shadow-sm">
                <SelectValue placeholder="Select patient..." />
              </SelectTrigger>
              <SelectContent className="w-full bg-white border border-gray-200 shadow-lg rounded-lg">
                {participants.map((participant) => (
                  <SelectItem key={participant.id} value={participant.id} className="hover:bg-gray-50">
                    <div className="flex items-center gap-3 min-w-0 flex-1 py-1">
                      <div className="w-6 h-6 bg-blue-100 text-blue-700 text-xs flex-shrink-0 rounded-full flex items-center justify-center font-medium">
                        {participant.full_name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate text-sm">{participant.full_name}</div>
                        <div className="text-xs text-gray-500 truncate">{participant.email}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="text-sm text-gray-500">No patients available</span>
            </div>
          )}
          
          {/* Status info */}
          <div className="mt-2 flex items-center text-xs">
            {participants.length > 0 ? (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{participants.length} patient(s) available</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>No active patients</span>
              </div>
            )}
          </div>
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default CaretakerPatientSelector;
