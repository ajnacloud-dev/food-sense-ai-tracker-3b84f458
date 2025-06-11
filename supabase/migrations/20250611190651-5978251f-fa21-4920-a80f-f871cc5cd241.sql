
-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admin users can view all users" ON public.users;

-- Create a simpler policy that allows users to view their own record
CREATE POLICY "Users can view own record" ON public.users
FOR SELECT 
USING (auth.uid() = id);

-- Create a policy specifically for admin access using a function in public schema
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  );
$$;

-- Create admin policy using the function
CREATE POLICY "Admin users can view all users" ON public.users
FOR SELECT 
USING (public.is_admin());
