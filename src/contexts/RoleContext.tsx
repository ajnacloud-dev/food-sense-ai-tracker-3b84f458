
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface RoleContextType {
  isParticipant: boolean;
  isCaretaker: boolean;
  hasCaretakerRelationships: boolean;
  isLoading: boolean;
  refreshRoles: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);

  const checkRoles = async () => {
    if (!user) {
      setIsParticipant(false);
      setIsCaretaker(false);
      setHasCaretakerRelationships(false);
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

  return (
    <RoleContext.Provider value={{
      isParticipant,
      isCaretaker,
      hasCaretakerRelationships,
      isLoading,
      refreshRoles
    }}>
      {children}
    </RoleContext.Provider>
  );
};
