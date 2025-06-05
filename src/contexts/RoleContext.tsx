
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
  isPureCaretaker: boolean;
  isPureParticipant: boolean;
  isDualRole: boolean;
  hasSubscription: boolean;
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
  const [hasSubscription, setHasSubscription] = useState(false);

  const checkRoles = async () => {
    if (!user) {
      setIsParticipant(false);
      setIsCaretaker(false);
      setHasCaretakerRelationships(false);
      setPrimaryRole(null);
      setCurrentRole('participant');
      setHasSubscription(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('RoleContext: Checking roles for user:', user.id);

      // Check caretaker relationships first (more deterministic)
      const { data: caretakerRelationships, error: caretakerError } = await supabase
        .from('care_relationships')
        .select('id, status')
        .eq('caretaker_id', user.id)
        .eq('status', 'active');

      if (caretakerError) {
        console.error('RoleContext: Error checking caretaker relationships:', caretakerError);
      }

      const hasRelationships = caretakerRelationships && caretakerRelationships.length > 0;
      console.log('RoleContext: Has caretaker relationships:', hasRelationships, caretakerRelationships);
      
      setIsCaretaker(hasRelationships);
      setHasCaretakerRelationships(hasRelationships);

      // Check if user has personal data (is a participant)
      const [
        { data: foodEntries, error: foodError },
        { data: receipts, error: receiptError },
        { data: workouts, error: workoutError }
      ] = await Promise.all([
        supabase.from('food_entries').select('id').eq('user_id', user.id).limit(1),
        supabase.from('receipts').select('id').eq('user_id', user.id).limit(1),
        supabase.from('workouts').select('id').eq('user_id', user.id).limit(1)
      ]);

      if (foodError) console.error('RoleContext: Food entries error:', foodError);
      if (receiptError) console.error('RoleContext: Receipts error:', receiptError);
      if (workoutError) console.error('RoleContext: Workouts error:', workoutError);

      const hasOwnData = (foodEntries && foodEntries.length > 0) || 
                        (receipts && receipts.length > 0) || 
                        (workouts && workouts.length > 0);
      
      console.log('RoleContext: Has own data (participant):', hasOwnData);
      setIsParticipant(hasOwnData);

      // Check subscription status
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_subscribed')
        .eq('id', user.id)
        .single();
      
      if (userError) {
        console.error('RoleContext: User data error:', userError);
      }
      
      setHasSubscription(userData?.is_subscribed || false);

      // Determine primary role with clear priority
      let determinedPrimaryRole: 'participant' | 'caretaker' | null = null;
      let determinedCurrentRole: 'participant' | 'caretaker' = 'participant';
      
      if (hasRelationships && !hasOwnData) {
        // Pure caretaker
        determinedPrimaryRole = 'caretaker';
        determinedCurrentRole = 'caretaker';
        console.log('RoleContext: Determined as pure caretaker');
      } else if (hasOwnData && !hasRelationships) {
        // Pure participant
        determinedPrimaryRole = 'participant';
        determinedCurrentRole = 'participant';
        console.log('RoleContext: Determined as pure participant');
      } else if (hasOwnData && hasRelationships) {
        // Dual role - default to participant
        determinedPrimaryRole = 'participant';
        determinedCurrentRole = 'participant';
        console.log('RoleContext: Determined as dual role (defaulting to participant)');
      } else {
        // No role yet - default to participant
        determinedPrimaryRole = 'participant';
        determinedCurrentRole = 'participant';
        console.log('RoleContext: No clear role, defaulting to participant');
      }

      setPrimaryRole(determinedPrimaryRole);
      setCurrentRole(determinedCurrentRole);

      console.log('RoleContext: Final role state:', {
        isParticipant: hasOwnData,
        isCaretaker: hasRelationships,
        primaryRole: determinedPrimaryRole,
        currentRole: determinedCurrentRole,
        isPureCaretaker: hasRelationships && !hasOwnData,
        isPureParticipant: hasOwnData && !hasRelationships,
        isDualRole: hasOwnData && hasRelationships
      });

    } catch (error) {
      console.error('RoleContext: Error checking user roles:', error);
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
      console.log('RoleContext: Switching role to:', role);
      setCurrentRole(role);
    }
  };

  const canSwitchRoles = isParticipant && isCaretaker;
  const isPureCaretaker = isCaretaker && !isParticipant;
  const isPureParticipant = isParticipant && !isCaretaker;
  const isDualRole = isParticipant && isCaretaker;

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
      canSwitchRoles,
      isPureCaretaker,
      isPureParticipant,
      isDualRole,
      hasSubscription
    }}>
      {children}
    </RoleContext.Provider>
  );
};
