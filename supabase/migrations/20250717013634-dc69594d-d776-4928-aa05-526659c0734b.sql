-- Update user_interactions table to allow text item_id for workflow steps
ALTER TABLE public.user_interactions 
ALTER COLUMN item_id TYPE text;