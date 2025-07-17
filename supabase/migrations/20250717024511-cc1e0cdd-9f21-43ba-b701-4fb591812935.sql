-- Update database schema to match actual structure

-- Update prompts table
ALTER TABLE public.prompts 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Make category NOT NULL for prompts (add default first, then set constraint)
UPDATE public.prompts SET category = 'General' WHERE category IS NULL;
ALTER TABLE public.prompts ALTER COLUMN category SET NOT NULL;

-- Update templates table  
ALTER TABLE public.templates
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS copy_count INTEGER DEFAULT 0;

-- Make category and type NOT NULL for templates
UPDATE public.templates SET category = 'General' WHERE category IS NULL;
UPDATE public.templates SET type = 'Document Template' WHERE type IS NULL;
ALTER TABLE public.templates ALTER COLUMN category SET NOT NULL;
ALTER TABLE public.templates ALTER COLUMN type SET NOT NULL;

-- Remove workflow_data column from user_interactions
ALTER TABLE public.user_interactions 
DROP COLUMN IF EXISTS workflow_data;

-- Update check constraints to match exact schema
ALTER TABLE public.comments 
DROP CONSTRAINT IF EXISTS comments_item_type_check,
ADD CONSTRAINT comments_item_type_check 
CHECK (item_type = ANY (ARRAY['prompt'::text, 'template'::text]));

ALTER TABLE public.favorites
DROP CONSTRAINT IF EXISTS favorites_item_type_check,
ADD CONSTRAINT favorites_item_type_check 
CHECK (item_type = ANY (ARRAY['prompt'::text, 'template'::text]));

-- Update prompts difficulty level constraint
ALTER TABLE public.prompts
DROP CONSTRAINT IF EXISTS prompts_difficulty_level_check,
ADD CONSTRAINT prompts_difficulty_level_check 
CHECK (difficulty_level = ANY (ARRAY['Beginner'::text, 'Intermediate'::text, 'Advanced'::text]));

SELECT '✅ Database schema updated to match actual structure!' as message;