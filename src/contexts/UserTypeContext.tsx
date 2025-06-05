
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
  const { user } = useAuth();
  const [userType, setUserType] = useState<'participant' | 'caretaker' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserType = async () => {
    if (!user) {
      console.log('UserTypeContext: No user, resetting state');
      setUserType(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('UserTypeContext: Fetching user type for:', user.email);

      const { data: userData, error } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('UserTypeContext: Error fetching user type:', error);
        // Default to participant if error
        setUserType('participant');
      } else {
        const type = userData?.user_type as 'participant' | 'caretaker' || 'participant';
        console.log('UserTypeContext: User type fetched:', type);
        setUserType(type);
      }
    } catch (error) {
      console.error('UserTypeContext: Error:', error);
      setUserType('participant');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserType();
  }, [user]);

  const refreshUserType = async () => {
    await fetchUserType();
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
