
-- Enable RLS on user_notifications table if not already enabled
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.user_notifications;

-- Create policy for users to view their own notifications
CREATE POLICY "Users can view their own notifications" ON public.user_notifications
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy for users to update their own notifications (for marking as read)
CREATE POLICY "Users can update their own notifications" ON public.user_notifications
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policy for system to insert notifications (for edge functions)
CREATE POLICY "System can insert notifications" ON public.user_notifications
FOR INSERT 
WITH CHECK (true);
