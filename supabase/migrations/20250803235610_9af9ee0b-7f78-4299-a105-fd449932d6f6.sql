-- Add 'workflow_prompt' to the allowed item types
ALTER TABLE user_interactions DROP CONSTRAINT IF EXISTS user_interactions_item_type_check;

ALTER TABLE user_interactions ADD CONSTRAINT user_interactions_item_type_check 
CHECK (item_type IN ('prompt', 'template', 'workflow_step', 'workflow_prompt'));