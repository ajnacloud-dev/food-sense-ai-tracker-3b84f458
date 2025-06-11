
-- Create RLS policy to allow admin users to view all users
CREATE POLICY "Admin users can view all users" ON public.users
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
