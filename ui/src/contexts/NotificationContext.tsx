
import React, { createContext, useContext, useState, useEffect } from 'react';
import { backendApi } from '@/lib/api/client';
import { useAuth } from './AuthContext';
import { useCaretakerData } from './CaretakerDataContext';
import { toast } from 'sonner';

interface NotificationData {
  id: string;
  type: 'food_entry' | 'comment' | 'workout' | 'receipt' | 'permission_request';
  title: string;
  message: string;
  participantId?: string;
  participantName?: string;
  contentId?: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { participants } = useCaretakerData();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const addNotification = (notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: NotificationData = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50 notifications
    
    // Show toast notification
    toast.info(notification.title, {
      description: notification.message,
      duration: 5000,
    });
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user || !participants.length) return;

    const participantIds = participants.map(p => p.id);
    const channels: any[] = [];

    // Subscribe to food entries for all participants
    participantIds.forEach(participantId => {
      const participant = participants.find(p => p.id === participantId);
      
      // Food entries subscription
      const foodChannel = backendApi
        .channel(`food-entries-${participantId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'food_entries',
            filter: `user_id=eq.${participantId}`
          },
          (payload) => {
            const entry = payload.new;
            addNotification({
              type: 'food_entry',
              title: 'New Food Entry',
              message: `${participant?.full_name} logged a new meal: ${entry.description || 'Food entry'}`,
              participantId,
              participantName: participant?.full_name,
              contentId: entry.id,
            });
          }
        )
        .subscribe();

      // Workouts subscription
      const workoutChannel = backendApi
        .channel(`workouts-${participantId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'workouts',
            filter: `user_id=eq.${participantId}`
          },
          (payload) => {
            const workout = payload.new;
            addNotification({
              type: 'workout',
              title: 'New Workout',
              message: `${participant?.full_name} logged a new workout: ${workout.workout_type}`,
              participantId,
              participantName: participant?.full_name,
              contentId: workout.id,
            });
          }
        )
        .subscribe();

      // Receipts subscription
      const receiptChannel = backendApi
        .channel(`receipts-${participantId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'receipts',
            filter: `user_id=eq.${participantId}`
          },
          (payload) => {
            const receipt = payload.new;
            addNotification({
              type: 'receipt',
              title: 'New Receipt',
              message: `${participant?.full_name} uploaded a receipt from ${receipt.vendor || 'Unknown store'}`,
              participantId,
              participantName: participant?.full_name,
              contentId: receipt.id,
            });
          }
        )
        .subscribe();

      channels.push(foodChannel, workoutChannel, receiptChannel);
    });

    // Comments subscription for caretaker
    const commentsChannel = backendApi
      .channel('participant-comments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'participant_comments',
          filter: `caretaker_id=eq.${user.id}`
        },
        (payload) => {
          const comment = payload.new;
          const participant = participants.find(p => p.id === comment.participant_id);
          
          if (comment.author_type === 'participant') {
            addNotification({
              type: 'comment',
              title: 'New Comment',
              message: `${participant?.full_name} added a comment`,
              participantId: comment.participant_id,
              participantName: participant?.full_name,
              contentId: comment.content_id,
            });
          }
        }
      )
      .subscribe();

    channels.push(commentsChannel);

    // Permission requests subscription
    const permissionChannel = backendApi
      .channel('permission-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'permission_requests',
          filter: `caretaker_id=eq.${user.id}`
        },
        (payload) => {
          const request = payload.new;
          const participant = participants.find(p => p.id === request.participant_id);
          
          addNotification({
            type: 'permission_request',
            title: 'Permission Request',
            message: `${participant?.full_name} requested ${request.category} access`,
            participantId: request.participant_id,
            participantName: participant?.full_name,
            contentId: request.id,
          });
        }
      )
      .subscribe();

    channels.push(permissionChannel);

    return () => {
      channels.forEach(channel => {
        backendApi.removeChannel(channel);
      });
    };
  }, [user, participants]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
