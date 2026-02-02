import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUserData } from './UserDataContext';
import { useUserType } from './UserTypeContext';

interface ParticipantData {
  id: string;
  full_name: string;
  email: string;
  caretaker_type: string;
  status: string;
  health_score: number;
}

interface CaretakerDataContextType {
  selectedParticipantId: string | null;
  setSelectedParticipantId: (id: string | null) => void;
  participants: ParticipantData[];
  participantData: ParticipantData | null;
  loading: boolean;
  error: string | null;
  refreshParticipants: () => Promise<void>;
}

const CaretakerDataContext = createContext<CaretakerDataContextType | undefined>(undefined);

export const useCaretakerData = () => {
  const context = useContext(CaretakerDataContext);
  if (context === undefined) {
    throw new Error('useCaretakerData must be used within a CaretakerDataProvider');
  }
  return context;
};

export const CaretakerDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userType } = useUserType();
  const { participantData: relationshipData, isLoading, error: dataError, refreshData } = useUserData();

  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [participantData, setParticipantData] = useState<ParticipantData | null>(null);

  // Transform relationship data to participant format
  const participants: ParticipantData[] = relationshipData.map((rel: any) => ({
    id: rel.user?.id || rel.user_id,
    full_name: rel.user?.full_name || 'Unknown',
    email: rel.user?.email || '',
    caretaker_type: rel.caretaker_type || 'family_member',
    status: rel.status || 'active',
    health_score: 85 // Default health score
  }));

  useEffect(() => {
    // Auto-select first participant if none selected and we have participants
    if (!selectedParticipantId && participants.length > 0 && userType === 'caretaker') {
      const firstParticipant = participants[0];
      setSelectedParticipantId(firstParticipant.id);
      setParticipantData(firstParticipant);
      console.log('CaretakerDataContext: Auto-selected first participant:', firstParticipant);
    } else if (selectedParticipantId) {
      // Update participant data if already selected
      const currentParticipant = participants.find(p => p.id === selectedParticipantId);
      setParticipantData(currentParticipant || null);
    }
  }, [selectedParticipantId, participants, userType]);

  const refreshParticipants = async () => {
    await refreshData();
  };

  return (
    <CaretakerDataContext.Provider value={{
      selectedParticipantId,
      setSelectedParticipantId,
      participants,
      participantData,
      loading: isLoading,
      error: dataError,
      refreshParticipants
    }}>
      {children}
    </CaretakerDataContext.Provider>
  );
};