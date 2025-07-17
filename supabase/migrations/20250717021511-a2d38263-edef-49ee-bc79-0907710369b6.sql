-- =============================================================================
-- COMPLETE DATABASE SETUP SCRIPT
-- Run this script in a fresh Supabase project to recreate all tables and data
-- =============================================================================

-- Create function for automatic timestamp updates (needed for triggers)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TABLE CREATION
-- =============================================================================

-- Create profiles table for user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  title TEXT,
  institution TEXT,
  research_area TEXT,
  avatar_url TEXT,
  bio TEXT,
  xp_points INTEGER DEFAULT 0,
  weekly_streak INTEGER DEFAULT 0,
  total_prompts_copied INTEGER DEFAULT 0,
  total_templates_copied INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

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
ALTER TABLE public.prompts ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.prompts ALTER COLUMN category SET NOT NULL;

-- Add check constraint for difficulty level
ALTER TABLE public.prompts DROP CONSTRAINT IF EXISTS prompts_difficulty_level_check;
ALTER TABLE public.prompts ADD CONSTRAINT prompts_difficulty_level_check 
CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced'));

-- Update existing templates table structure
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'Document Template';
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS file_size TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.templates ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.templates ALTER COLUMN category SET NOT NULL;

-- Create workflows table for user customization
CREATE TABLE IF NOT EXISTS public.user_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workflow_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('prompt', 'template')),
  item_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

-- Create comments table
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

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can create their own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can update their own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can delete their own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can view their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can create their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.templates;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for prompts (public read, admin write)
CREATE POLICY "Prompts are viewable by everyone" 
ON public.prompts 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage prompts" 
ON public.prompts 
FOR ALL 
USING (auth.uid()::text = created_by::text OR created_by IS NULL);

-- RLS Policies for templates (public read, admin write)
CREATE POLICY "Templates are viewable by everyone" 
ON public.templates 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage templates" 
ON public.templates 
FOR ALL 
USING (auth.uid()::text = created_by::text OR created_by IS NULL);

-- RLS Policies for user workflows
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

-- RLS Policies for user interactions
CREATE POLICY "Users can view their own interactions" 
ON public.user_interactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interactions" 
ON public.user_interactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for favorites
CREATE POLICY "Users can view their own favorites" 
ON public.favorites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites" 
ON public.favorites 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for comments
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

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, title)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'title', 'Researcher')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
BEFORE UPDATE ON public.profiles 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_prompts_updated_at ON public.prompts;
CREATE TRIGGER update_prompts_updated_at 
BEFORE UPDATE ON public.prompts 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_templates_updated_at ON public.templates;
CREATE TRIGGER update_templates_updated_at 
BEFORE UPDATE ON public.templates 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_workflows_updated_at ON public.user_workflows;
CREATE TRIGGER update_user_workflows_updated_at 
BEFORE UPDATE ON public.user_workflows 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;
CREATE TRIGGER update_comments_updated_at 
BEFORE UPDATE ON public.comments 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- SAMPLE DATA INSERT
-- =============================================================================

-- Insert sample prompts data
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

Present this as a structured summary I can use to plan my proposal.', 'Preparation', ARRAY['funding', 'analysis', 'preparation'], 'Beginner', '30 mins', true),

('Research Narrative Development', 'Create compelling research narratives for grant proposals', 'Help me develop a compelling research narrative for my grant proposal with these elements:

Research area: [YOUR FIELD]
Specific problem: [PROBLEM DESCRIPTION]
My approach: [YOUR METHOD/SOLUTION]
Potential impact: [EXPECTED OUTCOMES]
Target funder: [FUNDING AGENCY]

Create a 3-paragraph narrative that:
1. Establishes the significance and urgency of the problem
2. Introduces my innovative approach and its advantages
3. Articulates potential outcomes and broader impacts
4. Uses language that will resonate with [FUNDING AGENCY]', 'Strategic Planning', ARRAY['narrative', 'research', 'storytelling'], 'Intermediate', '45 mins', true),

('Specific Aims Generator', 'Generate structured specific aims for your research proposal', 'Based on my research focus:
[BRIEF PROJECT DESCRIPTION]

Generate 3-4 specific aims for a [DURATION]-year grant proposal to [FUNDING AGENCY] that:
1. Are distinct but interconnected
2. Progress logically from foundational to advanced goals
3. Are achievable within the timeframe and reasonable resources
4. Collectively address my research hypothesis
5. Include a mix of hypothesis-testing and methodological development

For each aim, provide:
- A concise title (10 words max)
- A 1-sentence overview of the aim
- 2-3 specific objectives or experiments
- Expected outcomes and their significance', 'Strategic Planning', ARRAY['aims', 'objectives', 'structure'], 'Advanced', '60 mins', true),

('Background and Significance Writer', 'Draft compelling background sections that establish research importance', 'Draft a Background and Significance section (approximately 750-1000 words) for my grant proposal on [RESEARCH TOPIC] that:

1. Establishes the importance of [PROBLEM] with relevant statistics and citations
2. Provides essential context about current approaches and their limitations
3. Identifies specific knowledge gaps my research addresses
4. Explains the potential impact of filling these gaps
5. Connects my research to [FUNDING AGENCY]''s priorities, specifically [PRIORITY AREAS]

Include appropriate places for citations and integrate these key concepts from my preliminary work:
[LIST 3-5 KEY FINDINGS OR CONCEPTS]', 'Content Generation', ARRAY['background', 'significance', 'writing'], 'Intermediate', '90 mins', false),

('Innovation Statement Crafter', 'Articulate what makes your research innovative and transformative', 'Craft a compelling Innovation section (250-500 words) for my grant proposal that clearly articulates what makes my approach novel and transformative.

My research involves: [BRIEF DESCRIPTION]
Current approaches typically: [CONVENTIONAL METHODS]
My innovation is: [YOUR NOVEL APPROACH]

Emphasize:
1. Conceptual innovations in my approach
2. Methodological advancements I''m introducing
3. How my approach challenges existing paradigms or extends them in significant ways
4. Potential for transformative impact if successful
5. Preliminary data supporting feasibility of my innovation: [BRIEF DESCRIPTION OF SUPPORTING DATA]', 'Content Generation', ARRAY['innovation', 'novelty', 'impact'], 'Advanced', '75 mins', false),

('Budget Justification Builder', 'Create detailed budget narratives that justify every expense', 'Create a detailed budget justification narrative for my [AMOUNT] grant proposal that covers:

Personnel:
- [LIST ROLES AND TIME COMMITMENTS]

Equipment:
- [LIST KEY EQUIPMENT NEEDS]

Supplies:
- [TYPES OF SUPPLIES NEEDED]

Travel:
- [EXPECTED TRAVEL PURPOSES]

Other costs:
- [ANY OTHER BUDGET CATEGORIES]

For each item, provide 1-2 sentences explaining:
1. Why it''s necessary for the project
2. How the cost was estimated
3. How it directly supports specific research aims', 'Content Generation', ARRAY['budget', 'justification', 'finances'], 'Beginner', '45 mins', false),

('Reviewer Perspective Analyzer', 'Get critical feedback from a reviewer''s perspective', 'Adopt the perspective of an experienced [FUNDING AGENCY] reviewer evaluating this section of my grant proposal:

[PASTE SECTION TEXT]

Provide critical feedback as a reviewer would, addressing:
1. Scientific merit and significance
2. Innovation and approach
3. Investigator qualifications implied by the writing
4. Environment and resources
5. Overall impact and likelihood of success

Include both strengths and weaknesses. Be specific about what would improve the proposal''s competitiveness and what might raise concerns for reviewers.', 'Refinement', ARRAY['review', 'feedback', 'evaluation'], 'Advanced', '30 mins', true),

('Executive Summary Generator', 'Create compelling abstracts that hook reviewers from the start', 'Create a compelling executive summary/abstract (250-300 words) for my grant proposal that includes:

Research focus: [TOPIC]
Problem addressed: [PROBLEM]
Approach: [METHOD]
Specific aims: [BRIEF AIM DESCRIPTIONS]
Expected outcomes: [OUTCOMES]
Significance: [WHY IT MATTERS]

Structure the summary with:
1. An engaging opening that establishes importance
2. Clear statement of the research question or hypothesis
3. Brief overview of the innovative approach
4. Concise description of the methodology
5. Expected outcomes and their significance
6. Broader impacts aligned with [FUNDING AGENCY]''s mission', 'Finalization', ARRAY['abstract', 'summary', 'overview'], 'Intermediate', '60 mins', true)
ON CONFLICT DO NOTHING;

-- Insert sample templates data
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
[Citations in appropriate format]', 'Structure', 'Markdown Template', 'MD', '12KB', true),

('NIH Grant Template', 'NIH-specific grant proposal template with proper formatting', '# NIH Research Grant Proposal

## Project Summary/Abstract
[30 lines maximum]

## Project Narrative
[3 sentences maximum]

## Specific Aims
[1 page maximum]

## Research Strategy
### Significance
### Innovation
### Approach
[12 pages maximum for A.1-A.3 combined]

## Bibliography & References Cited
[No page limit]

## Resource Sharing Plan
### Data Sharing Plan
### Model Organism Sharing Plan
### Genomic Data Sharing Plan

## Authentication of Key Biological and/or Chemical Resources

## Appendix
[10 pages maximum]', 'Government', 'Document Template', 'DOCX', '8KB', true),

('NSF Proposal Template', 'NSF CAREER and research grant proposal template', '# NSF Research Proposal

## Project Summary
### Overview
### Intellectual Merit
### Broader Impacts
[1 page maximum]

## Project Description
### Background and Motivation
### Research Objectives
### Methodology
### Expected Results
### Timeline
[15 pages maximum]

## References Cited
[No page limit]

## Biographical Sketches
[2 pages per person]

## Budget and Budget Justification

## Current and Pending Support

## Facilities, Equipment and Other Resources

## Data Management Plan
[2 pages maximum]

## Postdoctoral Researcher Mentoring Plan
[1 page maximum]', 'Government', 'Document Template', 'DOCX', '10KB', true),

('Budget Spreadsheet Template', 'Comprehensive budget planning spreadsheet for multi-year grants', 'Year 1,Year 2,Year 3,Total,Justification
Personnel,,,,,
PI (20% effort),$25000,$26000,$27000,$78000,Leadership and oversight
Co-I (10% effort),$15000,$15600,$16200,$46800,Technical expertise
Postdoc,$45000,$46800,$48600,$140400,Full-time research
Graduate Student,$25000,$26000,$27000,$78000,Research assistance
Equipment,,,,,
Microscope,$15000,$0,$0,$15000,Essential for imaging
Computer,$3000,$0,$3000,$6000,Data analysis
Supplies,,,,,
Lab Supplies,$8000,$8500,$9000,$25500,Reagents and materials
Software,$2000,$2000,$2000,$6000,Analysis tools
Travel,,,,,
Conferences,$3000,$3000,$3000,$9000,Dissemination
Indirect (30%),$42300,$43980,$45690,$131970,Institutional overhead
Total,$183300,$191880,$200490,$575670,', 'Financial', 'Spreadsheet', 'CSV', '4KB', false),

('Timeline Gantt Template', 'Project timeline template with milestones and deliverables', 'Quarter,Aim 1 Activities,Aim 2 Activities,Aim 3 Activities,Administrative,Dissemination
Year 1 Q1,Literature review,Equipment setup,Pilot studies,IRB approval,Conference planning
Year 1 Q2,Method development,Initial experiments,Data collection,Progress reports,Abstract submission
Year 1 Q3,Validation studies,Data analysis,Protocol refinement,Advisory meeting,Manuscript prep
Year 1 Q4,Results analysis,Method optimization,Preliminary results,Annual report,Conference presentation
Year 2 Q1,Extended studies,Full implementation,Scale-up experiments,Budget review,Publication 1
Year 2 Q2,Data collection,Results validation,Advanced analysis,Interim report,Grant applications
Year 2 Q3,Analysis phase,Troubleshooting,Integration studies,Advisory meeting,Conference abstract
Year 2 Q4,Manuscript prep,Method refinement,Results synthesis,Annual report,Conference presentation
Year 3 Q1,Final experiments,Validation phase,Comprehensive analysis,Progress review,Publication 2
Year 3 Q2,Data analysis,Final testing,Results compilation,Budget reconciliation,Manuscript revision
Year 3 Q3,Manuscript writing,Documentation,Dissemination prep,Final reports,Conference presentation
Year 3 Q4,Publication submission,Project closeout,Future planning,Final documentation,Impact assessment', 'Planning', 'Spreadsheet', 'CSV', '6KB', false),

('Response to Reviewers Template', 'Template for responding to grant reviewer comments', '# Response to Reviewers

## Summary of Changes
[Brief overview of major revisions made in response to reviewer feedback]

## Detailed Response to Reviewer Comments

### Reviewer 1

**Comment 1.1:** [Quote the reviewer comment]

**Response:** [Your detailed response explaining how you addressed the concern]

**Changes Made:** [Specific changes to the proposal, with page/section references]

---

**Comment 1.2:** [Quote the reviewer comment]

**Response:** [Your detailed response]

**Changes Made:** [Specific changes made]

---

### Reviewer 2

**Comment 2.1:** [Quote the reviewer comment]

**Response:** [Your detailed response]

**Changes Made:** [Specific changes made]

---

**Comment 2.2:** [Quote the reviewer comment]

**Response:** [Your detailed response]

**Changes Made:** [Specific changes made]

---

### Reviewer 3

[Continue same format for additional reviewers]

## Additional Improvements
[Any additional changes made beyond reviewer comments]

## Conclusion
[Brief statement thanking reviewers and summarizing how their feedback strengthened the proposal]', 'Refinement', 'Document Template', 'DOCX', '5KB', false)
ON CONFLICT DO NOTHING;

-- Success message
SELECT '✅ Database setup completed successfully! All tables, policies, functions, triggers, and sample data have been created.' as message;