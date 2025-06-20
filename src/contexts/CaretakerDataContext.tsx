
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useUserType } from './UserTypeContext';

interface ParticipantData {
  id: string;
  full_name: string;
  email: string;
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
  const { user } = useAuth();
  const { userType } = useUserType();
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [participantData, setParticipantData] = useState<ParticipantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipants = async () => {
    if (!user || userType !== 'caretaker') {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('Fetching participants for caretaker:', user.id);
      
      const { data: relationships, error: relationshipError } = await supabase
        .from('care_relationships')
        .select(`
          user_id,
          users!care_relationships_user_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('caretaker_id', user.id)
        .eq('status', 'approved');

      if (relationshipError) {
        console.error('Error fetching relationships:', relationshipError);
        throw relationshipError;
      }

      const participantList: ParticipantData[] = relationships?.map(rel => ({
        id: rel.users.id,
        full_name: rel.users.full_name || 'Unknown',
        email: rel.users.email
      })) || [];

      console.log('Fetched participants:', participantList);
      setParticipants(participantList);

      // Auto-select first participant if none selected and we have participants
      if (!selectedParticipantId && participantList.length > 0) {
        const firstParticipant = participantList[0];
        setSelectedParticipantId(firstParticipant.id);
        setParticipantData(firstParticipant);
        console.log('Auto-selected first participant:', firstParticipant);
      } else if (selectedParticipantId) {
        // Update participant data if already selected
        const currentParticipant = participantList.find(p => p.id === selectedParticipantId);
        setParticipantData(currentParticipant || null);
      }

    } catch (error) {
      console.error('Error in fetchParticipants:', error);
      setError('Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  const refreshParticipants = async () => {
    setLoading(true);
    await fetchParticipants();
  };

  useEffect(() => {
    if (user && userType === 'caretaker') {
      fetchParticipants();
    } else {
      setLoading(false);
    }
  }, [user, userType]);

  // Update participant data when selectedParticipantId changes
  useEffect(() => {
    if (selectedParticipantId && participants.length > 0) {
      const participant = participants.find(p => p.id === selectedParticipantId);
      setParticipantData(participant || null);
      console.log('Updated participant data:', participant);
    } else {
      setParticipantData(null);
    }
  }, [selectedParticipantId, participants]);

  const handleSetSelectedParticipantId = (id: string | null) => {
    console.log('Setting selected participant ID:', id);
    setSelectedParticipantId(id);
  };

  return (
    <CaretakerDataContext.Provider
      value={{
        selectedParticipantId,
        setSelectedParticipantId: handleSetSelectedParticipantId,
        participants,
        participantData,
        loading,
        error,
        refreshParticipants,
      }}
    >
      {children}
    </CaretakerDataContext.Provider>
  );
};
