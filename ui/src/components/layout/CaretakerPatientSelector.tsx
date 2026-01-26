
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
      <SidebarGroupLabel className="text-green-700 font-bold text-sm mb-3 group-data-[collapsible=icon]:sr-only">
        Active Patient
      </SidebarGroupLabel>
      <SidebarGroupContent>
        {/* Collapsed state indicator */}
        <div className="group-data-[collapsible=icon]:block hidden mb-4">
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <User className="h-6 w-6" />
            </div>
          </div>
          {participants.length > 0 && selectedParticipantId && (
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mt-2 animate-pulse"></div>
          )}
        </div>

        {/* Expanded state selector */}
        <div className="group-data-[collapsible=icon]:hidden">
          {loading ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl animate-pulse">
              <div className="h-4 bg-green-200 rounded w-3/4"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
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
              <SelectTrigger className="h-12 bg-white border-green-200 shadow-sm hover:border-green-300 transition-colors rounded-xl">
                <SelectValue placeholder="Select patient..." />
              </SelectTrigger>
              <SelectContent className="w-full bg-white border border-green-200 shadow-xl rounded-xl">
                {participants.map((participant) => (
                  <SelectItem key={participant.id} value={participant.id} className="hover:bg-green-50 rounded-lg m-1">
                    <div className="flex items-center gap-3 min-w-0 flex-1 py-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xs flex-shrink-0 rounded-xl flex items-center justify-center font-bold">
                        {participant.full_name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 truncate">{participant.full_name}</div>
                        <div className="text-xs text-gray-500 truncate">{participant.email}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-sm text-gray-500">No patients available</span>
            </div>
          )}
          
          {/* Enhanced status info */}
          <div className="mt-3 flex items-center text-xs">
            {participants.length > 0 ? (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg w-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">{participants.length} patient(s) available</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-500 bg-gray-50 px-3 py-2 rounded-lg w-full">
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
