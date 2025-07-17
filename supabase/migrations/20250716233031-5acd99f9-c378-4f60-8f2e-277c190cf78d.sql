-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
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

-- Create prompts table
CREATE TABLE public.prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[],
  difficulty_level TEXT CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced')),
  estimated_time TEXT,
  copy_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  dislike_count INTEGER DEFAULT 0,
  created_by UUID,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create templates table
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  tags TEXT[],
  file_type TEXT,
  file_size TEXT,
  download_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  created_by UUID,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workflows table for user customization
CREATE TABLE public.user_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workflow_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user interactions table for tracking engagement
CREATE TABLE public.user_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('copy', 'favorite', 'like', 'dislike', 'comment')),
  item_type TEXT NOT NULL CHECK (item_type IN ('prompt', 'template')),
  item_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create favorites table
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('prompt', 'template')),
  item_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('prompt', 'template')),
  item_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for prompts (public read, admin write)
CREATE POLICY "Prompts are viewable by everyone" ON public.prompts FOR SELECT USING (true);
CREATE POLICY "Admins can manage prompts" ON public.prompts FOR ALL USING (auth.uid()::text = created_by::text OR created_by IS NULL);

-- RLS Policies for templates (public read, admin write)
CREATE POLICY "Templates are viewable by everyone" ON public.templates FOR SELECT USING (true);
CREATE POLICY "Admins can manage templates" ON public.templates FOR ALL USING (auth.uid()::text = created_by::text OR created_by IS NULL);

-- RLS Policies for user workflows
CREATE POLICY "Users can view their own workflows" ON public.user_workflows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own workflows" ON public.user_workflows FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own workflows" ON public.user_workflows FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user interactions
CREATE POLICY "Users can view their own interactions" ON public.user_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own interactions" ON public.user_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for favorites
CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for comments
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Create function for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prompts_updated_at BEFORE UPDATE ON public.prompts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_workflows_updated_at BEFORE UPDATE ON public.user_workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample prompts data
INSERT INTO public.prompts (title, description, content, category, tags, difficulty_level, estimated_time, is_featured) VALUES
('Funding Opportunity Analysis', 'Analyze funding announcements to identify key priorities and themes', 'Analyze this funding opportunity announcement:\n[PASTE FUNDING ANNOUNCEMENT]\n\nExtract and organize:\n1. Key priorities and themes\n2. Evaluation criteria and their weighting\n3. Required proposal components\n4. Eligibility requirements\n5. Budget constraints and allowable costs\n6. Submission deadlines and formatting requirements\n\nPresent this as a structured summary I can use to plan my proposal.', 'Preparation', ARRAY['funding', 'analysis', 'preparation'], 'Beginner', '30 mins', true),

('Research Narrative Development', 'Create compelling research narratives for grant proposals', 'Help me develop a compelling research narrative for my grant proposal with these elements:\n\nResearch area: [YOUR FIELD]\nSpecific problem: [PROBLEM DESCRIPTION]\nMy approach: [YOUR METHOD/SOLUTION]\nPotential impact: [EXPECTED OUTCOMES]\nTarget funder: [FUNDING AGENCY]\n\nCreate a 3-paragraph narrative that:\n1. Establishes the significance and urgency of the problem\n2. Introduces my innovative approach and its advantages\n3. Articulates potential outcomes and broader impacts\n4. Uses language that will resonate with [FUNDING AGENCY]', 'Strategic Planning', ARRAY['narrative', 'research', 'storytelling'], 'Intermediate', '45 mins', true),

('Specific Aims Generator', 'Generate structured specific aims for your research proposal', 'Based on my research focus:\n[BRIEF PROJECT DESCRIPTION]\n\nGenerate 3-4 specific aims for a [DURATION]-year grant proposal to [FUNDING AGENCY] that:\n1. Are distinct but interconnected\n2. Progress logically from foundational to advanced goals\n3. Are achievable within the timeframe and reasonable resources\n4. Collectively address my research hypothesis\n5. Include a mix of hypothesis-testing and methodological development\n\nFor each aim, provide:\n- A concise title (10 words max)\n- A 1-sentence overview of the aim\n- 2-3 specific objectives or experiments\n- Expected outcomes and their significance', 'Strategic Planning', ARRAY['aims', 'objectives', 'structure'], 'Advanced', '60 mins', true),

('Background and Significance Writer', 'Draft compelling background sections that establish research importance', 'Draft a Background and Significance section (approximately 750-1000 words) for my grant proposal on [RESEARCH TOPIC] that:\n\n1. Establishes the importance of [PROBLEM] with relevant statistics and citations\n2. Provides essential context about current approaches and their limitations\n3. Identifies specific knowledge gaps my research addresses\n4. Explains the potential impact of filling these gaps\n5. Connects my research to [FUNDING AGENCY]''s priorities, specifically [PRIORITY AREAS]\n\nInclude appropriate places for citations and integrate these key concepts from my preliminary work:\n[LIST 3-5 KEY FINDINGS OR CONCEPTS]', 'Content Generation', ARRAY['background', 'significance', 'writing'], 'Intermediate', '90 mins', false),

('Innovation Statement Crafter', 'Articulate what makes your research innovative and transformative', 'Craft a compelling Innovation section (250-500 words) for my grant proposal that clearly articulates what makes my approach novel and transformative.\n\nMy research involves: [BRIEF DESCRIPTION]\nCurrent approaches typically: [CONVENTIONAL METHODS]\nMy innovation is: [YOUR NOVEL APPROACH]\n\nEmphasize:\n1. Conceptual innovations in my approach\n2. Methodological advancements I''m introducing\n3. How my approach challenges existing paradigms or extends them in significant ways\n4. Potential for transformative impact if successful\n5. Preliminary data supporting feasibility of my innovation: [BRIEF DESCRIPTION OF SUPPORTING DATA]', 'Content Generation', ARRAY['innovation', 'novelty', 'impact'], 'Advanced', '75 mins', false),

('Budget Justification Builder', 'Create detailed budget narratives that justify every expense', 'Create a detailed budget justification narrative for my [AMOUNT] grant proposal that covers:\n\nPersonnel:\n- [LIST ROLES AND TIME COMMITMENTS]\n\nEquipment:\n- [LIST KEY EQUIPMENT NEEDS]\n\nSupplies:\n- [TYPES OF SUPPLIES NEEDED]\n\nTravel:\n- [EXPECTED TRAVEL PURPOSES]\n\nOther costs:\n- [ANY OTHER BUDGET CATEGORIES]\n\nFor each item, provide 1-2 sentences explaining:\n1. Why it''s necessary for the project\n2. How the cost was estimated\n3. How it directly supports specific research aims', 'Content Generation', ARRAY['budget', 'justification', 'finances'], 'Beginner', '45 mins', false),

('Reviewer Perspective Analyzer', 'Get critical feedback from a reviewer''s perspective', 'Adopt the perspective of an experienced [FUNDING AGENCY] reviewer evaluating this section of my grant proposal:\n\n[PASTE SECTION TEXT]\n\nProvide critical feedback as a reviewer would, addressing:\n1. Scientific merit and significance\n2. Innovation and approach\n3. Investigator qualifications implied by the writing\n4. Environment and resources\n5. Overall impact and likelihood of success\n\nInclude both strengths and weaknesses. Be specific about what would improve the proposal''s competitiveness and what might raise concerns for reviewers.', 'Refinement', ARRAY['review', 'feedback', 'evaluation'], 'Advanced', '30 mins', true),

('Executive Summary Generator', 'Create compelling abstracts that hook reviewers from the start', 'Create a compelling executive summary/abstract (250-300 words) for my grant proposal that includes:\n\nResearch focus: [TOPIC]\nProblem addressed: [PROBLEM]\nApproach: [METHOD]\nSpecific aims: [BRIEF AIM DESCRIPTIONS]\nExpected outcomes: [OUTCOMES]\nSignificance: [WHY IT MATTERS]\n\nStructure the summary with:\n1. An engaging opening that establishes importance\n2. Clear statement of the research question or hypothesis\n3. Brief overview of the innovative approach\n4. Concise description of the methodology\n5. Expected outcomes and their significance\n6. Broader impacts aligned with [FUNDING AGENCY]''s mission', 'Finalization', ARRAY['abstract', 'summary', 'overview'], 'Intermediate', '60 mins', true);

-- Insert sample templates data
INSERT INTO public.templates (title, description, content, category, type, file_type, file_size, is_featured) VALUES
('Grant Proposal Master Template', 'Complete grant proposal structure with all essential sections', '# [TITLE OF YOUR PROPOSAL]\n\n## Abstract/Executive Summary\n[250-300 words that summarize the entire proposal]\n\n## 1. Introduction and Background\n### 1.1 Problem Statement\n[Define the problem your research addresses]\n\n### 1.2 Significance\n[Explain why this problem matters]\n\n### 1.3 Current State of Knowledge\n[Summarize existing research and approaches]\n\n### 1.4 Knowledge Gaps\n[Identify specific gaps your research will address]\n\n## 2. Innovation\n[Describe what makes your approach novel and transformative]\n\n## 3. Specific Aims\n### Aim 1: [Title]\n[Brief description]\n\n### Aim 2: [Title]\n[Brief description]\n\n### Aim 3: [Title]\n[Brief description]\n\n## 4. Research Strategy\n### 4.1 Overall Approach\n[Overview of your research design and rationale]\n\n### 4.2 Preliminary Studies\n[Summarize relevant prior work and preliminary data]\n\n### 4.3 Detailed Methodology\n#### 4.3.1 Aim 1 Methods\n[Detailed procedures, analyses, expected outcomes]\n\n#### 4.3.2 Aim 2 Methods\n[Detailed procedures, analyses, expected outcomes]\n\n#### 4.3.3 Aim 3 Methods\n[Detailed procedures, analyses, expected outcomes]\n\n### 4.4 Timeline and Milestones\n[Project schedule with key deliverables]\n\n### 4.5 Potential Challenges and Alternative Strategies\n[Identify potential pitfalls and contingency plans]\n\n## 5. Expected Outcomes and Impact\n[Describe anticipated results and their significance]\n\n## 6. Resources and Environment\n[Describe facilities, equipment, and institutional support]\n\n## 7. Budget and Justification\n[Summarize budget with brief justification for major items]\n\n## 8. References\n[Citations in appropriate format]', 'Structure', 'Markdown Template', 'MD', '12KB', true),

('NIH Grant Template', 'NIH-specific grant proposal template with proper formatting', '# NIH Research Grant Proposal\n\n## Project Summary/Abstract\n[30 lines maximum]\n\n## Project Narrative\n[3 sentences maximum]\n\n## Specific Aims\n[1 page maximum]\n\n## Research Strategy\n### Significance\n### Innovation\n### Approach\n[12 pages maximum for A.1-A.3 combined]\n\n## Bibliography & References Cited\n[No page limit]\n\n## Resource Sharing Plan\n### Data Sharing Plan\n### Model Organism Sharing Plan\n### Genomic Data Sharing Plan\n\n## Authentication of Key Biological and/or Chemical Resources\n\n## Appendix\n[10 pages maximum]', 'Government', 'Document Template', 'DOCX', '8KB', true),

('NSF Proposal Template', 'NSF CAREER and research grant proposal template', '# NSF Research Proposal\n\n## Project Summary\n### Overview\n### Intellectual Merit\n### Broader Impacts\n[1 page maximum]\n\n## Project Description\n### Background and Motivation\n### Research Objectives\n### Methodology\n### Expected Results\n### Timeline\n[15 pages maximum]\n\n## References Cited\n[No page limit]\n\n## Biographical Sketches\n[2 pages per person]\n\n## Budget and Budget Justification\n\n## Current and Pending Support\n\n## Facilities, Equipment and Other Resources\n\n## Data Management Plan\n[2 pages maximum]\n\n## Postdoctoral Researcher Mentoring Plan\n[1 page maximum]', 'Government', 'Document Template', 'DOCX', '10KB', true),

('Budget Spreadsheet Template', 'Comprehensive budget planning spreadsheet for multi-year grants', 'Year 1,Year 2,Year 3,Total,Justification\nPersonnel,,,,,\nPI (20% effort),$25000,$26000,$27000,$78000,Leadership and oversight\nCo-I (10% effort),$15000,$15600,$16200,$46800,Technical expertise\nPostdoc,$45000,$46800,$48600,$140400,Full-time research\nGraduate Student,$25000,$26000,$27000,$78000,Research assistance\nEquipment,,,,,\nMicroscope,$15000,$0,$0,$15000,Essential for imaging\nComputer,$3000,$0,$3000,$6000,Data analysis\nSupplies,,,,,\nLab Supplies,$8000,$8500,$9000,$25500,Reagents and materials\nSoftware,$2000,$2000,$2000,$6000,Analysis tools\nTravel,,,,,\nConferences,$3000,$3000,$3000,$9000,Dissemination\nIndirect (30%),$42300,$43980,$45690,$131970,Institutional overhead\nTotal,$183300,$191880,$200490,$575670,', 'Financial', 'Spreadsheet', 'CSV', '4KB', false),

('Timeline Gantt Template', 'Project timeline template with milestones and deliverables', 'Quarter,Aim 1 Activities,Aim 2 Activities,Aim 3 Activities,Administrative,Dissemination\nYear 1 Q1,Literature review,Equipment setup,Pilot studies,IRB approval,Conference planning\nYear 1 Q2,Method development,Initial experiments,Data collection,Progress reports,Abstract submission\nYear 1 Q3,Validation studies,Data analysis,Protocol refinement,Advisory meeting,Manuscript prep\nYear 1 Q4,Results analysis,Method optimization,Preliminary results,Annual report,Conference presentation\nYear 2 Q1,Extended studies,Full implementation,Scale-up experiments,Budget review,Publication 1\nYear 2 Q2,Data collection,Results validation,Advanced analysis,Interim report,Grant applications\nYear 2 Q3,Analysis phase,Troubleshooting,Integration studies,Advisory meeting,Conference abstract\nYear 2 Q4,Manuscript prep,Method refinement,Results synthesis,Annual report,Conference presentation\nYear 3 Q1,Final experiments,Validation phase,Comprehensive analysis,Progress review,Publication 2\nYear 3 Q2,Data analysis,Final testing,Results compilation,Budget reconciliation,Manuscript revision\nYear 3 Q3,Manuscript writing,Documentation,Dissemination prep,Final reports,Conference presentation\nYear 3 Q4,Publication submission,Project closeout,Future planning,Final documentation,Impact assessment', 'Planning', 'Spreadsheet', 'CSV', '6KB', false),

('Reviewer Response Template', 'Professional template for responding to grant review feedback', '# Response to Reviewers\n\nDear Review Committee,\n\nThank you for your thoughtful feedback on our proposal titled "[TITLE]." We appreciate the opportunity to address your comments and have made significant revisions to strengthen our proposal.\n\n## Response to Reviewer 1\n\n### Comment 1: [Paste comment]\nResponse: [Your response, referencing specific changes made]\n\n### Comment 2: [Paste comment]\nResponse: [Your response, referencing specific changes made]\n\n## Response to Reviewer 2\n\n### Comment 1: [Paste comment]\nResponse: [Your response, referencing specific changes made]\n\n### Comment 2: [Paste comment]\nResponse: [Your response, referencing specific changes made]\n\n## Response to Reviewer 3\n\n### Comment 1: [Paste comment]\nResponse: [Your response, referencing specific changes made]\n\n### Comment 2: [Paste comment]\nResponse: [Your response, referencing specific changes made]\n\n## Summary of Major Changes\n1. [Summarize major change 1]\n2. [Summarize major change 2]\n3. [Summarize major change 3]\n\nWe believe these revisions have substantially strengthened our proposal and addressed all the concerns raised. Thank you again for your valuable feedback and for considering our revised submission.\n\nSincerely,\n[YOUR NAME]', 'Communication', 'Document Template', 'MD', '5KB', false);