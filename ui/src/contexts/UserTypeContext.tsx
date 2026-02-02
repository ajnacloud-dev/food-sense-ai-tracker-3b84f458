import React, { createContext, useContext } from 'react';
import { useUserData } from './UserDataContext';

interface UserTypeContextType {
  userType: 'participant' | 'caretaker' | null;
  isLoading: boolean;
  refreshUserType: () => Promise<void>;
}

const UserTypeContext = createContext<UserTypeContextType | undefined>(undefined);

export const useUserType = () => {
  const context = useContext(UserTypeContext);
  if (context === undefined) {
    throw new Error('useUserType must be used within a UserTypeProvider');
  }
  return context;
};

export const UserTypeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get data from centralized context instead of making duplicate API calls
  const { userType, isLoading, refreshData } = useUserData();

  const refreshUserType = async () => {
    await refreshData();
  };

  return (
    <UserTypeContext.Provider value={{
      userType,
      isLoading,
      refreshUserType
    }}>
      {children}
    </UserTypeContext.Provider>
  );
};