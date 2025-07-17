-- Update RLS policies to allow users to see all prompts (including system prompts)
DROP POLICY IF EXISTS "Users can view their own prompts" ON public.prompts;

CREATE POLICY "Users can view all prompts" 
ON public.prompts 
FOR SELECT 
TO authenticated
USING (true);

-- Also update templates policy for consistency
DROP POLICY IF EXISTS "Users can view their own templates" ON public.templates;

CREATE POLICY "Users can view all templates" 
ON public.templates 
FOR SELECT 
TO authenticated
USING (true);