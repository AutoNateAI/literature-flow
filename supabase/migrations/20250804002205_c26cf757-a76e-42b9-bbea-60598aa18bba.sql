-- Add resources table to track files within notebooks
CREATE TABLE public.notebook_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notebook_id UUID NOT NULL,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  file_type TEXT,
  file_size TEXT,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notebook_resources ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notebook resources" 
ON public.notebook_resources 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notebook resources" 
ON public.notebook_resources 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notebook resources" 
ON public.notebook_resources 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notebook resources" 
ON public.notebook_resources 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for timestamps
CREATE TRIGGER update_notebook_resources_updated_at
BEFORE UPDATE ON public.notebook_resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add concept_source to graph_nodes to track where concepts came from
ALTER TABLE public.graph_nodes 
ADD COLUMN concept_source TEXT,
ADD COLUMN extraction_method TEXT DEFAULT 'manual',
ADD COLUMN confidence_score DECIMAL(3,2) DEFAULT 1.0;

-- Add workflow prompts table for NotebookLM guidance
CREATE TABLE public.workflow_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_name TEXT NOT NULL,
  prompt_title TEXT NOT NULL,
  prompt_content TEXT NOT NULL,
  expected_output TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for workflow prompts (read-only for users)
ALTER TABLE public.workflow_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view workflow prompts" 
ON public.workflow_prompts 
FOR SELECT 
USING (true);

-- Insert default NotebookLM workflow prompts
INSERT INTO public.workflow_prompts (stage_name, prompt_title, prompt_content, expected_output, order_index) VALUES
('concept_extraction', 'Extract Key Concepts', 'Analyze the uploaded sources and identify the main concepts, theories, and frameworks discussed. For each concept, provide: 1) The concept name, 2) A brief definition, 3) How it relates to the research question, 4) Which sources discuss it most thoroughly.', 'List of key concepts with definitions and source references', 1),
('gap_analysis', 'Identify Research Gaps', 'Based on the literature, identify gaps in current knowledge or understanding. Look for: 1) Areas where sources disagree, 2) Questions that remain unanswered, 3) Methodological limitations mentioned, 4) Suggestions for future research.', 'List of research gaps and limitations', 2),
('discrepancy_analysis', 'Find Discrepancies', 'Compare findings across sources and identify any contradictions or conflicting viewpoints. For each discrepancy: 1) Describe the conflicting views, 2) Identify which sources support each view, 3) Assess potential reasons for the disagreement.', 'List of discrepancies with source analysis', 3),
('pivotal_publications', 'Identify Pivotal Publications', 'Determine which publications are most frequently cited or seem most influential in this field. Look for: 1) Papers that introduce key theories, 2) Highly cited foundational works, 3) Recent papers that challenge established views, 4) Review papers that synthesize the field.', 'List of pivotal publications with impact analysis', 4);