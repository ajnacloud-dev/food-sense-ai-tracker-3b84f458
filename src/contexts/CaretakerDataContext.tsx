
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

      // First, get care relationships for this caretaker
      const { data: relationshipsData, error: relationshipsError } = await supabase
        .from('care_relationships')
        .select(`
          id,
          user_id,
          caretaker_type,
          permission_level,
          status,
          created_at
        `)
        .eq('caretaker_id', user.id)
        .order('created_at', { ascending: false });

      if (relationshipsError) {
        console.error('CaretakerDataContext: Error fetching relationships:', relationshipsError);
        console.error('CaretakerDataContext: RLS Error Details:', {
          message: relationshipsError.message,
          details: relationshipsError.details,
          hint: relationshipsError.hint,
          code: relationshipsError.code
        });
        throw relationshipsError;
      }

      console.log('CaretakerDataContext: Relationships data:', relationshipsData);

      if (!relationshipsData || relationshipsData.length === 0) {
        console.log('CaretakerDataContext: No relationships found, user is not a caretaker');
        setIsCaretaker(false);
        setParticipants([]);
        setSelectedParticipantId(null);
        setParticipantData(null);
        return;
      }

      setIsCaretaker(true);

      // Get all unique user IDs from relationships
      const userIds = relationshipsData.map(rel => rel.user_id);
      
      console.log('CaretakerDataContext: Fetching user data for IDs:', userIds);
      
      // Fetch user data separately with error handling
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', userIds);

      if (usersError) {
        console.error('CaretakerDataContext: Error fetching users:', usersError);
        console.error('CaretakerDataContext: Users RLS Error Details:', {
          message: usersError.message,
          details: usersError.details,
          hint: usersError.hint,
          code: usersError.code
        });
        
        // Continue with fallback data instead of throwing
        console.warn('CaretakerDataContext: Continuing with fallback user data');
      }

      console.log('CaretakerDataContext: Users data:', usersData);

      // Combine relationship and user data with better fallback handling
      const participantList: Participant[] = relationshipsData.map(rel => {
        const userData = usersData?.find(u => u.id === rel.user_id);
        
        console.log('CaretakerDataContext: Processing relationship:', {
          relationshipId: rel.id,
          user_id: rel.user_id,
          userData: userData,
          status: rel.status
        });
        
        // Provide better fallback values
        const displayName = userData?.full_name || 
                           userData?.email?.split('@')[0] || 
                           `User ${rel.user_id.slice(0, 8)}`;
        
        const displayEmail = userData?.email || 
                            'Email not accessible';
        
        return {
          id: rel.user_id,
          full_name: displayName,
          email: displayEmail,
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to load caretaker data';
      setError(errorMessage);
      
      // Show a more helpful error message based on the error type
      if (errorMessage.includes('policy')) {
        toast.error('Access denied. Please check your permissions or contact support.');
      } else {
        toast.error('Failed to load caretaker data. Please try refreshing.');
      }
    } finally {
      setLoading(false);
    }
  };

  const ensureParticipantPermissions = async (participantId: string, caretakerId: string) => {
    try {
      console.log('CaretakerDataContext: Ensuring permissions for participant:', participantId);
      
      const categories: Array<'food_entries' | 'receipts' | 'workouts'> = ['food_entries', 'receipts', 'workouts'];
      
      // Batch check existing permissions
      const { data: existingPermissions, error: permissionsError } = await supabase
        .from('participant_permissions')
        .select('category')
        .eq('participant_id', participantId)
        .eq('caretaker_id', caretakerId)
        .in('category', categories);

      if (permissionsError) {
        console.error('CaretakerDataContext: Error checking permissions:', permissionsError);
        return;
      }

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
