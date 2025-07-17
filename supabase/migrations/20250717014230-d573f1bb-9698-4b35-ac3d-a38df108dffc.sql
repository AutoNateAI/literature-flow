-- Remove the item_type check constraint that's blocking workflow_step
ALTER TABLE public.user_interactions 
DROP CONSTRAINT IF EXISTS user_interactions_item_type_check;

-- Add a new constraint that includes workflow_step
ALTER TABLE public.user_interactions 
ADD CONSTRAINT user_interactions_item_type_check 
CHECK (item_type IN ('prompt', 'template', 'workflow_step'));