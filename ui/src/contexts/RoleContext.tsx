import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUserData } from './UserDataContext';

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
  // Get data from centralized context instead of making duplicate API calls
  const {
    isParticipant,
    isCaretaker,
    hasCaretakerRelationships,
    hasSubscription,
    isLoading: dataLoading,
    refreshData
  } = useUserData();

  const [currentRole, setCurrentRole] = useState<'participant' | 'caretaker'>('participant');

  // Determine primary role based on data from UserDataContext
  const determinePrimaryRole = (): 'participant' | 'caretaker' | null => {
    if (isCaretaker && !isParticipant) {
      // Pure caretaker
      return 'caretaker';
    } else if (isParticipant && !isCaretaker) {
      // Pure participant
      return 'participant';
    } else if (isParticipant && isCaretaker) {
      // Dual role - default to participant
      return 'participant';
    } else {
      // New user - default to participant
      return 'participant';
    }
  };

  const primaryRole = determinePrimaryRole();

  useEffect(() => {
    // Update current role based on primary role
    if (primaryRole) {
      setCurrentRole(primaryRole);
      console.log('RoleContext: Updated current role to:', primaryRole);
    }
  }, [primaryRole]);

  const refreshRoles = async () => {
    await refreshData();
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
      isLoading: dataLoading,
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