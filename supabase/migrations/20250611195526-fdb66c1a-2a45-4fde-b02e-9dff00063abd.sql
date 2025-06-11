
-- Enable RLS on api_costs table if not already enabled
ALTER TABLE public.api_costs ENABLE ROW LEVEL SECURITY;

-- Drop any existing problematic policies
DROP POLICY IF EXISTS "Users can view their own costs" ON public.api_costs;
DROP POLICY IF EXISTS "Admin users can view all costs" ON public.api_costs;

-- Create policy for users to view their own costs
CREATE POLICY "Users can view their own costs" ON public.api_costs
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy for admin users to view all costs using our safe function
CREATE POLICY "Admin users can view all costs" ON public.api_costs
FOR SELECT 
USING (public.is_admin());

-- Create policy for users to insert their own costs
CREATE POLICY "Users can insert their own costs" ON public.api_costs
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
