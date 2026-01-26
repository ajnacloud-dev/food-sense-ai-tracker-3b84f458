
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { backendApi } from "@/lib/api/client";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  analysis_id?: string;
  metadata?: any;
}

export const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      setupRealtimeSubscription();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch from the new persistent notifications table
      const { data: notificationData, error } = await backendApi
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const notificationList: Notification[] = notificationData?.map(notification => ({
        id: notification.id,
        notification_type: notification.notification_type,
        title: notification.title,
        message: notification.message,
        created_at: notification.created_at,
        read: notification.read,
        analysis_id: notification.analysis_id,
        metadata: notification.metadata
      })) || [];

      setNotifications(notificationList);
      setUnreadCount(notificationList.filter(n => !n.read).length);

    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    // Listen for new notifications
    const notificationChannel = backendApi
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          toast.info(newNotification.title);
        }
      )
      .subscribe();

    // Also listen for analysis completions and trigger notification processing
    const analysisChannel = backendApi
      .channel('analysis-completions')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pending_analyses',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          const analysis = payload.new;
          if (analysis.status === 'completed' || analysis.status === 'failed') {
            console.log('Analysis completed, triggering processing:', analysis.id);
            
            // Trigger the processing function
            try {
              const { data, error } = await backendApi.functions.invoke('process-completed-analysis', {
                body: { analysisId: analysis.id }
              });
              
              if (error) {
                console.error('Error processing analysis:', error);
              } else {
                console.log('Analysis processed successfully:', data);
              }
            } catch (error) {
              console.error('Error invoking process function:', error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      backendApi.removeChannel(notificationChannel);
      backendApi.removeChannel(analysisChannel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await backendApi
        .from('user_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error("Failed to mark notification as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await backendApi
        .from('user_notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error("Failed to mark all notifications as read");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'analysis_complete':
        return '✅';
      case 'analysis_failed':
        return '❌';
      default:
        return '📝';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="max-h-96">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`p-3 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <span className="text-lg">{getNotificationIcon(notification.notification_type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{notification.title}</p>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
