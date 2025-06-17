
-- Create a table for model configurations
CREATE TABLE public.models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL, -- 'openai', 'anthropic', etc.
  model_id TEXT NOT NULL, -- actual model identifier like 'gpt-4o', 'claude-3-sonnet', etc.
  description TEXT,
  input_cost_per_1k_tokens DECIMAL(10,6) NOT NULL DEFAULT 0,
  output_cost_per_1k_tokens DECIMAL(10,6) NOT NULL DEFAULT 0,
  max_tokens INTEGER DEFAULT 4096,
  supports_vision BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  required_subscription_tier TEXT DEFAULT 'free',
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for admin access only
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

-- Only admins can view models
CREATE POLICY "Only admins can view models" 
  ON public.models 
  FOR SELECT 
  USING (is_admin());

-- Only admins can insert models
CREATE POLICY "Only admins can insert models" 
  ON public.models 
  FOR INSERT 
  WITH CHECK (is_admin());

-- Only admins can update models
CREATE POLICY "Only admins can update models" 
  ON public.models 
  FOR UPDATE 
  USING (is_admin());

-- Only admins can delete models
CREATE POLICY "Only admins can delete models" 
  ON public.models 
  FOR DELETE 
  USING (is_admin());

-- Add trigger for updated_at
CREATE TRIGGER set_updated_at_models
  BEFORE UPDATE ON public.models
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Insert some default models with subscription tiers
INSERT INTO public.models (name, provider, model_id, description, input_cost_per_1k_tokens, output_cost_per_1k_tokens, max_tokens, supports_vision, is_active, is_default, required_subscription_tier, category) VALUES
('GPT-4o Mini', 'openai', 'gpt-4o-mini', 'Fast and efficient OpenAI model', 0.00015, 0.0006, 16384, true, true, true, 'free', 'efficient'),
('GPT-4.1 2025', 'openai', 'gpt-4.1-2025-04-14', 'Latest flagship model from OpenAI', 0.0025, 0.01, 8192, true, true, false, 'pro', 'flagship'),
('GPT-4o', 'openai', 'gpt-4o', 'Powerful OpenAI model with vision', 0.0025, 0.01, 4096, true, true, false, 'pro', 'powerful'),
('O4 Mini 2025', 'openai', 'o4-mini-2025-04-16', 'Fast reasoning model', 0.001, 0.004, 8192, true, true, false, 'pro', 'reasoning'),
('O3 2025', 'openai', 'o3-2025-04-16', 'Advanced reasoning model', 0.005, 0.02, 4096, true, true, false, 'enterprise', 'reasoning');

-- Ensure only one default model at a time (corrected function)
CREATE OR REPLACE FUNCTION ensure_single_default_model()
RETURNS TRIGGER AS $$
DECLARE
  first_active_id UUID;
BEGIN
  IF NEW.is_default = true THEN
    -- Set all other models to not default
    UPDATE public.models 
    SET is_default = false 
    WHERE id != NEW.id AND is_default = true;
  END IF;
  
  -- Ensure at least one model is default if this was the only default being set to false
  IF OLD.is_default = true AND NEW.is_default = false THEN
    IF NOT EXISTS (SELECT 1 FROM public.models WHERE is_default = true AND id != NEW.id) THEN
      -- Get the first active model ID
      SELECT id INTO first_active_id 
      FROM public.models 
      WHERE is_active = true AND id != NEW.id 
      ORDER BY created_at 
      LIMIT 1;
      
      -- Set it as default if found
      IF first_active_id IS NOT NULL THEN
        UPDATE public.models 
        SET is_default = true 
        WHERE id = first_active_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_model_trigger
  AFTER UPDATE ON public.models
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_model();

-- Create function to get available models for user's subscription
CREATE OR REPLACE FUNCTION get_available_models_for_user(user_subscription_tier TEXT DEFAULT 'free')
RETURNS TABLE (
  id UUID,
  name TEXT,
  provider TEXT,
  model_id TEXT,
  description TEXT,
  category TEXT,
  supports_vision BOOLEAN,
  is_default BOOLEAN
) 
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    m.id,
    m.name,
    m.provider,
    m.model_id,
    m.description,
    m.category,
    m.supports_vision,
    m.is_default
  FROM public.models m
  WHERE m.is_active = true
  AND (
    (user_subscription_tier = 'free' AND m.required_subscription_tier = 'free') OR
    (user_subscription_tier = 'pro' AND m.required_subscription_tier IN ('free', 'pro')) OR
    (user_subscription_tier = 'enterprise' AND m.required_subscription_tier IN ('free', 'pro', 'enterprise'))
  )
  ORDER BY 
    CASE m.required_subscription_tier 
      WHEN 'free' THEN 1
      WHEN 'pro' THEN 2
      WHEN 'enterprise' THEN 3
    END,
    m.name;
$$;

-- Create function to get default model for user's subscription
CREATE OR REPLACE FUNCTION get_default_model_for_user(user_subscription_tier TEXT DEFAULT 'free')
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT m.model_id
  FROM public.models m
  WHERE m.is_active = true
  AND m.is_default = true
  AND (
    (user_subscription_tier = 'free' AND m.required_subscription_tier = 'free') OR
    (user_subscription_tier = 'pro' AND m.required_subscription_tier IN ('free', 'pro')) OR
    (user_subscription_tier = 'enterprise' AND m.required_subscription_tier IN ('free', 'pro', 'enterprise'))
  )
  LIMIT 1;
$$;
