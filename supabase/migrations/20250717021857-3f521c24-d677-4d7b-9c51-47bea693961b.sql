-- =============================================================================
-- COMPLETE DATABASE SETUP SCRIPT (CONFLICT-SAFE VERSION)
-- =============================================================================

-- Add missing columns to existing profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS institution TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS research_area TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp_points INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weekly_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_prompts_copied INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_templates_copied INTEGER DEFAULT 0;

-- Update existing prompts table structure
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS difficulty_level TEXT;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS estimated_time TEXT;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS dislike_count INTEGER DEFAULT 0;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add check constraint for difficulty level
ALTER TABLE public.prompts DROP CONSTRAINT IF EXISTS prompts_difficulty_level_check;
ALTER TABLE public.prompts ADD CONSTRAINT prompts_difficulty_level_check 
CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced'));

-- Update existing templates table structure
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS file_size TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Set default for type column
UPDATE public.templates SET type = 'Document Template' WHERE type IS NULL;
ALTER TABLE public.templates ALTER COLUMN type SET DEFAULT 'Document Template';

-- Create missing tables
CREATE TABLE IF NOT EXISTS public.user_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workflow_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('prompt', 'template')),
  item_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('prompt', 'template')),
  item_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.user_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Update RLS policies for prompts and templates (public access)
DROP POLICY IF EXISTS "Users can view their own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can create their own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can update their own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can delete their own prompts" ON public.prompts;

CREATE POLICY "Prompts are viewable by everyone" 
ON public.prompts 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage prompts" 
ON public.prompts 
FOR ALL 
USING (auth.uid()::text = created_by::text OR created_by IS NULL);

DROP POLICY IF EXISTS "Users can view their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can create their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.templates;

CREATE POLICY "Templates are viewable by everyone" 
ON public.templates 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage templates" 
ON public.templates 
FOR ALL 
USING (auth.uid()::text = created_by::text OR created_by IS NULL);

-- Create RLS policies for new tables
CREATE POLICY "Users can view their own workflows" 
ON public.user_workflows 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workflows" 
ON public.user_workflows 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflows" 
ON public.user_workflows 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own favorites" 
ON public.favorites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites" 
ON public.favorites 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Comments are viewable by everyone" 
ON public.comments 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create comments" 
ON public.comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_user_workflows_updated_at ON public.user_workflows;
CREATE TRIGGER update_user_workflows_updated_at 
BEFORE UPDATE ON public.user_workflows 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;
CREATE TRIGGER update_comments_updated_at 
BEFORE UPDATE ON public.comments 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data (ignore conflicts)
INSERT INTO public.prompts (title, description, content, category, tags, difficulty_level, estimated_time, is_featured) VALUES
('Funding Opportunity Analysis', 'Analyze funding announcements to identify key priorities and themes', 'Analyze this funding opportunity announcement:
[PASTE FUNDING ANNOUNCEMENT]

Extract and organize:
1. Key priorities and themes
2. Evaluation criteria and their weighting
3. Required proposal components
4. Eligibility requirements
5. Budget constraints and allowable costs
6. Submission deadlines and formatting requirements

Present this as a structured summary I can use to plan my proposal.', 'Preparation', ARRAY['funding', 'analysis', 'preparation'], 'Beginner', '30 mins', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.templates (title, description, content, category, type, file_type, file_size, is_featured) VALUES
('Grant Proposal Master Template', 'Complete grant proposal structure with all essential sections', '# [TITLE OF YOUR PROPOSAL]

## Abstract/Executive Summary
[250-300 words that summarize the entire proposal]

## 1. Introduction and Background
### 1.1 Problem Statement
[Define the problem your research addresses]

### 1.2 Significance
[Explain why this problem matters]

### 1.3 Current State of Knowledge
[Summarize existing research and approaches]

### 1.4 Knowledge Gaps
[Identify specific gaps your research will address]

## 2. Innovation
[Describe what makes your approach novel and transformative]

## 3. Specific Aims
### Aim 1: [Title]
[Brief description]

### Aim 2: [Title]
[Brief description]

### Aim 3: [Title]
[Brief description]

## 4. Research Strategy
### 4.1 Overall Approach
[Overview of your research design and rationale]

### 4.2 Preliminary Studies
[Summarize relevant prior work and preliminary data]

### 4.3 Detailed Methodology
#### 4.3.1 Aim 1 Methods
[Detailed procedures, analyses, expected outcomes]

#### 4.3.2 Aim 2 Methods
[Detailed procedures, analyses, expected outcomes]

#### 4.3.3 Aim 3 Methods
[Detailed procedures, analyses, expected outcomes]

### 4.4 Timeline and Milestones
[Project schedule with key deliverables]

### 4.5 Potential Challenges and Alternative Strategies
[Identify potential pitfalls and contingency plans]

## 5. Expected Outcomes and Impact
[Describe anticipated results and their significance]

## 6. Resources and Environment
[Describe facilities, equipment, and institutional support]

## 7. Budget and Justification
[Summarize budget with brief justification for major items]

## 8. References
[Citations in appropriate format]', 'Structure', 'Markdown Template', 'MD', '12KB', true)
ON CONFLICT DO NOTHING;

SELECT '✅ Database setup completed successfully!' as message;