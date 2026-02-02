
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { backendApi } from '@/lib/api/client';

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
      console.log('RoleContext: No user, resetting role state');
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
      const isLocalMode = window.location.hostname === 'localhost';
      console.log('RoleContext: Checking roles for user:', user.email, user.id);

      // Check active caretaker relationships
      const { data: caretakerRelationships, error: caretakerError } = await backendApi
        .from('care_relationships')
        .select('id, status, user_id')
        .eq('caretaker_id', user.id)
        .eq('status', 'active');

      if (caretakerError && !isLocalMode) {
        console.error('RoleContext: Error checking caretaker relationships:', caretakerError);
      }

      const hasActiveCaretakerRels = (caretakerRelationships?.length || 0) > 0;
      console.log('RoleContext: Active caretaker relationships:', hasActiveCaretakerRels);

      setIsCaretaker(hasActiveCaretakerRels);
      setHasCaretakerRelationships(hasActiveCaretakerRels);

      // Check if user has personal data (simplified check)
      const { data: foodEntries, error: foodError } = await backendApi
        .from('food_entries')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (foodError && !isLocalMode) {
        console.error('RoleContext: Food entries error:', foodError);
      }

      const hasPersonalData = (foodEntries && foodEntries.length > 0);
      console.log('RoleContext: Has personal data:', hasPersonalData);
      
      setIsParticipant(hasPersonalData);

      // Check subscription status
      if (isLocalMode && user.id === 'local-dev-user') {
        // In local mode, skip database check
        console.log('RoleContext: Local mode, using default subscription status');
        setHasSubscription(false);
      } else {
        const { data: userData, error: userError } = await backendApi
          .from('users')
          .select('is_subscribed')
          .eq('id', user.id)
          .single();

        if (userError) {
          // In local mode, this is expected - don't log as error
          if (!isLocalMode) {
            console.error('RoleContext: User data error:', userError);
          }
        }

        setHasSubscription(userData?.is_subscribed || false);
      }

      // Simplified role determination
      let determinedPrimaryRole: 'participant' | 'caretaker' | null = null;
      let determinedCurrentRole: 'participant' | 'caretaker' = 'participant';
      
      if (hasActiveCaretakerRels && !hasPersonalData) {
        // Pure caretaker - prioritize caretaker role
        determinedPrimaryRole = 'caretaker';
        determinedCurrentRole = 'caretaker';
        console.log('RoleContext: Determined as PURE CARETAKER');
      } else if (hasPersonalData && !hasActiveCaretakerRels) {
        // Pure participant
        determinedPrimaryRole = 'participant';
        determinedCurrentRole = 'participant';
        console.log('RoleContext: Determined as pure participant');
      } else if (hasPersonalData && hasActiveCaretakerRels) {
        // Dual role - default to participant for now
        determinedPrimaryRole = 'participant';
        determinedCurrentRole = 'participant';
        console.log('RoleContext: Determined as dual role');
      } else {
        // New user - default to participant
        determinedPrimaryRole = 'participant';
        determinedCurrentRole = 'participant';
        console.log('RoleContext: New user, defaulting to participant');
      }

      setPrimaryRole(determinedPrimaryRole);
      setCurrentRole(determinedCurrentRole);

      console.log('RoleContext: Final role state:', {
        isParticipant: hasPersonalData,
        isCaretaker: hasActiveCaretakerRels,
        primaryRole: determinedPrimaryRole,
        currentRole: determinedCurrentRole,
        isPureCaretaker: hasActiveCaretakerRels && !hasPersonalData,
        isPureParticipant: hasPersonalData && !hasActiveCaretakerRels,
        isDualRole: hasPersonalData && hasActiveCaretakerRels
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
