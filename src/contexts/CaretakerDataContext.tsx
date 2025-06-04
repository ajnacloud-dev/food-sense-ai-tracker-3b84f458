
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface Participant {
  id: string;
  full_name: string;
  email: string;
  caretaker_type: string;
  permission_level: string;
  status: string;
  created_at: string;
  health_score?: number;
}

interface CaretakerDataContextType {
  participants: Participant[];
  selectedParticipantId: string | null;
  participantData: Participant | null;
  loading: boolean;
  error: string | null;
  setSelectedParticipantId: (id: string | null) => void;
  refreshData: () => Promise<void>;
  isCaretaker: boolean;
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
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [participantData, setParticipantData] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCaretaker, setIsCaretaker] = useState(false);

  const fetchCaretakerData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('CaretakerDataContext: Fetching data for user:', user.id);

      // Single optimized query with JOIN to get all relationship and user data
      const { data: relationshipsData, error: relationshipsError } = await supabase
        .from('care_relationships')
        .select(`
          id,
          user_id,
          caretaker_type,
          permission_level,
          status,
          created_at,
          users!care_relationships_user_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('caretaker_id', user.id)
        .order('created_at', { ascending: false });

      if (relationshipsError) {
        console.error('CaretakerDataContext: Error fetching relationships:', relationshipsError);
        throw relationshipsError;
      }

      console.log('CaretakerDataContext: Raw relationships data:', relationshipsData);

      if (!relationshipsData || relationshipsData.length === 0) {
        console.log('CaretakerDataContext: No relationships found, user is not a caretaker');
        setIsCaretaker(false);
        setParticipants([]);
        setSelectedParticipantId(null);
        setParticipantData(null);
        return;
      }

      setIsCaretaker(true);

      // Process the participant data from the JOIN
      const participantList: Participant[] = relationshipsData.map(rel => {
        const userData = rel.users as any;
        
        console.log('CaretakerDataContext: Processing relationship:', {
          relationshipId: rel.id,
          user_id: rel.user_id,
          userData: userData,
          status: rel.status
        });
        
        return {
          id: rel.user_id,
          full_name: userData?.full_name || userData?.email?.split('@')[0] || 'Unknown User',
          email: userData?.email || 'No email available',
          caretaker_type: rel.caretaker_type,
          permission_level: rel.permission_level,
          status: rel.status,
          created_at: rel.created_at,
          health_score: Math.floor(Math.random() * 40) + 60
        };
      });

      console.log('CaretakerDataContext: Processed participants:', participantList);
      setParticipants(participantList);

      // Auto-select first active participant if none selected
      const activeParticipants = participantList.filter(p => p.status === 'active');
      if (activeParticipants.length > 0 && !selectedParticipantId) {
        const firstActive = activeParticipants[0];
        console.log('CaretakerDataContext: Auto-selecting first active participant:', firstActive.id);
        setSelectedParticipantId(firstActive.id);
        setParticipantData(firstActive);
      }

      // Ensure permissions for active participants (background task)
      setTimeout(() => {
        activeParticipants.forEach(participant => {
          ensureParticipantPermissions(participant.id, user.id);
        });
      }, 0);

    } catch (error) {
      console.error('CaretakerDataContext: Error fetching data:', error);
      setError('Failed to load caretaker data');
      toast.error('Failed to load caretaker data');
    } finally {
      setLoading(false);
    }
  };

  const ensureParticipantPermissions = async (participantId: string, caretakerId: string) => {
    try {
      console.log('CaretakerDataContext: Ensuring permissions for participant:', participantId);
      
      const categories: Array<'food_entries' | 'receipts' | 'workouts'> = ['food_entries', 'receipts', 'workouts'];
      
      // Batch check existing permissions
      const { data: existingPermissions } = await supabase
        .from('participant_permissions')
        .select('category')
        .eq('participant_id', participantId)
        .eq('caretaker_id', caretakerId)
        .in('category', categories);

      const existingCategories = existingPermissions?.map(p => p.category) || [];
      const missingCategories = categories.filter(cat => !existingCategories.includes(cat));

      // Batch insert missing permissions
      if (missingCategories.length > 0) {
        const newPermissions = missingCategories.map(category => ({
          participant_id: participantId,
          caretaker_id: caretakerId,
          category: category,
          is_granted: true,
          granted_at: new Date().toISOString()
        }));

        const { error: insertError } = await supabase
          .from('participant_permissions')
          .insert(newPermissions);
            
        if (insertError) {
          console.error('CaretakerDataContext: Error creating permissions:', insertError);
        } else {
          console.log('CaretakerDataContext: Successfully created permissions for categories:', missingCategories);
        }
      }
    } catch (error) {
      console.error('CaretakerDataContext: Error ensuring permissions:', error);
    }
  };

  const handleParticipantSelection = (id: string | null) => {
    console.log('CaretakerDataContext: Participant selected:', id);
    setSelectedParticipantId(id);
    
    if (id) {
      const participant = participants.find(p => p.id === id);
      if (participant) {
        setParticipantData(participant);
        console.log('CaretakerDataContext: Set participant data:', participant);
      } else {
        console.warn('CaretakerDataContext: Participant not found for ID:', id);
        setParticipantData(null);
      }
    } else {
      setParticipantData(null);
    }
  };

  useEffect(() => {
    fetchCaretakerData();
  }, [user]);

  // Update participant data when selection changes
  useEffect(() => {
    if (selectedParticipantId && participants.length > 0) {
      const participant = participants.find(p => p.id === selectedParticipantId);
      setParticipantData(participant || null);
    }
  }, [selectedParticipantId, participants]);

  const value = {
    participants,
    selectedParticipantId,
    participantData,
    loading,
    error,
    setSelectedParticipantId: handleParticipantSelection,
    refreshData: fetchCaretakerData,
    isCaretaker
  };

  return (
    <CaretakerDataContext.Provider value={value}>
      {children}
    </CaretakerDataContext.Provider>
  );
};
