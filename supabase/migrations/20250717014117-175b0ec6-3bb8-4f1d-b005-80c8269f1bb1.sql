-- Remove the check constraint that's blocking workflow_step_completed
ALTER TABLE public.user_interactions 
DROP CONSTRAINT IF EXISTS user_interactions_interaction_type_check;

-- Add a new constraint that includes workflow_step_completed
ALTER TABLE public.user_interactions 
ADD CONSTRAINT user_interactions_interaction_type_check 
CHECK (interaction_type IN ('copy', 'like', 'comment', 'favorite', 'workflow_step_completed'));