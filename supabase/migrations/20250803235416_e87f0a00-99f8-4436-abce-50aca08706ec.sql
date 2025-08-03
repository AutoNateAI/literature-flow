-- Add 'prompt_copied' to the allowed interaction types
ALTER TABLE user_interactions DROP CONSTRAINT IF EXISTS user_interactions_interaction_type_check;

ALTER TABLE user_interactions ADD CONSTRAINT user_interactions_interaction_type_check 
CHECK (interaction_type IN ('copy', 'like', 'comment', 'favorite', 'workflow_step_completed', 'prompt_copied'));