import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { backendApi } from '@/lib/api/client';

interface UserData {
  userType: 'participant' | 'caretaker' | null;
  isParticipant: boolean;
  isCaretaker: boolean;
  hasCaretakerRelationships: boolean;
  hasSubscription: boolean;
  caretakerRelationships: any[];
  participantData: any[];
}

interface UserDataContextType extends UserData {
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within UserDataProvider');
  }
  return context;
};

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [data, setData] = useState<UserData>({
    userType: null,
    isParticipant: false,
    isCaretaker: false,
    hasCaretakerRelationships: false,
    hasSubscription: false,
    caretakerRelationships: [],
    participantData: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllUserData = async () => {
    if (!user) {
      console.log('UserDataContext: No user, resetting state');
      setData({
        userType: null,
        isParticipant: false,
        isCaretaker: false,
        hasCaretakerRelationships: false,
        hasSubscription: false,
        caretakerRelationships: [],
        participantData: []
      });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const isLocalMode = window.location.hostname === 'localhost';

      console.log('UserDataContext: Fetching all user data for:', user.id);

      // Make all API calls in parallel to avoid duplicate requests
      const [userResult, relationshipsResult, foodResult] = await Promise.allSettled([
        // Fetch user data
        backendApi.from('users').select('user_type, is_subscribed').eq('id', user.id).single(),
        // Fetch caretaker relationships
        backendApi.from('care_relationships').select('*').eq('caretaker_id', user.id).eq('status', 'active'),
        // Check if user has food entries
        backendApi.from('food_entries').select('id').eq('user_id', user.id).limit(1)
      ]);

      let userType: 'participant' | 'caretaker' = 'participant';
      let hasSubscription = false;
      let caretakerRelationships: any[] = [];
      let hasPersonalData = false;

      // Process user data
      if (userResult.status === 'fulfilled' && userResult.value.data) {
        userType = userResult.value.data.user_type || 'participant';
        hasSubscription = userResult.value.data.is_subscribed || false;
      } else if (isLocalMode && user.id === 'local-dev-user') {
        // Local mode defaults
        userType = 'participant';
        hasSubscription = false;
      }

      // Process relationships
      if (relationshipsResult.status === 'fulfilled' && relationshipsResult.value.data) {
        caretakerRelationships = relationshipsResult.value.data;
      }

      // Process food entries
      if (foodResult.status === 'fulfilled' && foodResult.value.data) {
        hasPersonalData = foodResult.value.data.length > 0;
      }

      const hasActiveCaretakerRels = caretakerRelationships.length > 0;

      // If user is a caretaker, fetch participant details
      let participantData: any[] = [];
      if (hasActiveCaretakerRels) {
        const participantIds = caretakerRelationships.map(r => r.user_id);
        const { data: participants } = await backendApi
          .from('users')
          .select('id, full_name, email')
          .in('id', participantIds);

        if (participants) {
          participantData = caretakerRelationships.map(rel => {
            const userData = participants.find(u => u.id === rel.user_id);
            return {
              ...rel,
              user: userData
            };
          });
        }
      }

      console.log('UserDataContext: Data fetched successfully', {
        userType,
        hasPersonalData,
        hasActiveCaretakerRels,
        hasSubscription
      });

      setData({
        userType,
        isParticipant: hasPersonalData,
        isCaretaker: hasActiveCaretakerRels,
        hasCaretakerRelationships: hasActiveCaretakerRels,
        hasSubscription,
        caretakerRelationships,
        participantData
      });

    } catch (err) {
      console.error('UserDataContext: Error fetching data:', err);
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUserData();
  }, [user]);

  const refreshData = async () => {
    await fetchAllUserData();
  };

  return (
    <UserDataContext.Provider value={{
      ...data,
      isLoading,
      error,
      refreshData
    }}>
      {children}
    </UserDataContext.Provider>
  );
};