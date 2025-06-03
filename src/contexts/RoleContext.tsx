
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface RoleContextType {
  isParticipant: boolean;
  isCaretaker: boolean;
  hasCaretakerRelationships: boolean;
  primaryRole: 'participant' | 'caretaker' | null;
  currentRole: 'participant' | 'caretaker';
  isLoading: boolean;
  refreshRoles: () => Promise<void>;
  switchRole: (role: 'participant' | 'caretaker') => void;
  canSwitchRoles: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isParticipant, setIsParticipant] = useState(false);
  const [isCaretaker, setIsCaretaker] = useState(false);
  const [hasCaretakerRelationships, setHasCaretakerRelationships] = useState(false);
  const [primaryRole, setPrimaryRole] = useState<'participant' | 'caretaker' | null>(null);
  const [currentRole, setCurrentRole] = useState<'participant' | 'caretaker'>('participant');
  const [isLoading, setIsLoading] = useState(true);

  const checkRoles = async () => {
    if (!user) {
      setIsParticipant(false);
      setIsCaretaker(false);
      setHasCaretakerRelationships(false);
      setPrimaryRole(null);
      setCurrentRole('participant');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Check if user is a participant (has their own data)
      const [
        { data: foodEntries },
        { data: receipts },
        { data: workouts }
      ] = await Promise.all([
        supabase.from('food_entries').select('id').eq('user_id', user.id).limit(1),
        supabase.from('receipts').select('id').eq('user_id', user.id).limit(1),
        supabase.from('workouts').select('id').eq('user_id', user.id).limit(1)
      ]);

      const hasOwnData = (foodEntries && foodEntries.length > 0) || 
                        (receipts && receipts.length > 0) || 
                        (workouts && workouts.length > 0);
      
      setIsParticipant(hasOwnData);

      // Check if user is a caretaker (has relationships with other participants)
      const { data: caretakerRelationships } = await supabase
        .from('care_relationships')
        .select('id')
        .eq('caretaker_id', user.id)
        .eq('status', 'active');

      const hasRelationships = caretakerRelationships && caretakerRelationships.length > 0;
      setIsCaretaker(hasRelationships);
      setHasCaretakerRelationships(hasRelationships);

      // Determine primary role based on data patterns
      let determinedPrimaryRole: 'participant' | 'caretaker' | null = null;
      
      if (hasOwnData && hasRelationships) {
        // User has both roles - default to participant unless they have significantly more caretaker activity
        determinedPrimaryRole = 'participant';
      } else if (hasOwnData) {
        determinedPrimaryRole = 'participant';
      } else if (hasRelationships) {
        determinedPrimaryRole = 'caretaker';
      }

      setPrimaryRole(determinedPrimaryRole);
      
      // Set current role to primary role if not already set
      if (determinedPrimaryRole && currentRole !== determinedPrimaryRole && !hasOwnData && !hasRelationships) {
        setCurrentRole(determinedPrimaryRole);
      }

    } catch (error) {
      console.error('Error checking user roles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkRoles();
  }, [user]);

  const refreshRoles = async () => {
    await checkRoles();
  };

  const switchRole = (role: 'participant' | 'caretaker') => {
    if ((role === 'participant' && isParticipant) || (role === 'caretaker' && isCaretaker)) {
      setCurrentRole(role);
    }
  };

  const canSwitchRoles = isParticipant && isCaretaker;

  return (
    <RoleContext.Provider value={{
      isParticipant,
      isCaretaker,
      hasCaretakerRelationships,
      primaryRole,
      currentRole,
      isLoading,
      refreshRoles,
      switchRole,
      canSwitchRoles
    }}>
      {children}
    </RoleContext.Provider>
  );
};
