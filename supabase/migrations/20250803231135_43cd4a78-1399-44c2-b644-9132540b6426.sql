-- Create projects table for literature review projects
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  hypothesis TEXT,
  paper_type TEXT NOT NULL CHECK (paper_type IN ('research', 'standalone')),
  theme TEXT,
  structural_outline JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notebooks table for NotebookLM integration
CREATE TABLE public.notebooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  briefing TEXT,
  notebook_url TEXT,
  upload_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create passages table for extracted content from uploads
CREATE TABLE public.passages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notebook_id UUID NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  page_number INTEGER,
  source_file TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workflow_stages table for template stages
CREATE TABLE public.workflow_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  paper_type TEXT NOT NULL CHECK (paper_type IN ('research', 'standalone', 'both')),
  theme TEXT,
  prompt_templates JSONB,
  estimated_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_workflow_progress table for user progress tracking
CREATE TABLE public.project_workflow_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.workflow_stages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  insights TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, stage_id)
);

-- Create graph_nodes table for graph visualization
CREATE TABLE public.graph_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  node_type TEXT NOT NULL CHECK (node_type IN ('point', 'claim', 'notebook')),
  title TEXT NOT NULL,
  content TEXT,
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  color TEXT,
  size TEXT DEFAULT 'medium',
  notebook_id UUID REFERENCES public.notebooks(id) ON DELETE SET NULL,
  passage_id UUID REFERENCES public.passages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create graph_edges table for node connections
CREATE TABLE public.graph_edges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  source_node_id UUID NOT NULL REFERENCES public.graph_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.graph_nodes(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL CHECK (edge_type IN ('support', 'contradict', 'thematic', 'neutral')),
  strength FLOAT DEFAULT 1.0 CHECK (strength >= 0 AND strength <= 1),
  annotation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source_node_id, target_node_id)
);

-- Create claims table for extracted claims from passages
CREATE TABLE public.claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  passage_id UUID NOT NULL REFERENCES public.passages(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  claim_type TEXT DEFAULT 'evidence',
  source_text TEXT,
  confidence_score FLOAT DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_workflow_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects
CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for notebooks
CREATE POLICY "Users can view their own notebooks" ON public.notebooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notebooks" ON public.notebooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notebooks" ON public.notebooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notebooks" ON public.notebooks FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for passages
CREATE POLICY "Users can view passages from their projects" ON public.passages FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM public.projects WHERE id = project_id)
);
CREATE POLICY "Users can create passages in their projects" ON public.passages FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.projects WHERE id = project_id)
);
CREATE POLICY "Users can update passages in their projects" ON public.passages FOR UPDATE USING (
  auth.uid() IN (SELECT user_id FROM public.projects WHERE id = project_id)
);
CREATE POLICY "Users can delete passages from their projects" ON public.passages FOR DELETE USING (
  auth.uid() IN (SELECT user_id FROM public.projects WHERE id = project_id)
);

-- Create RLS policies for workflow_stages (publicly readable for templates)
CREATE POLICY "Everyone can view workflow stages" ON public.workflow_stages FOR SELECT USING (true);

-- Create RLS policies for project_workflow_progress
CREATE POLICY "Users can view their own workflow progress" ON public.project_workflow_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own workflow progress" ON public.project_workflow_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own workflow progress" ON public.project_workflow_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workflow progress" ON public.project_workflow_progress FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for graph_nodes
CREATE POLICY "Users can view their own graph nodes" ON public.graph_nodes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own graph nodes" ON public.graph_nodes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own graph nodes" ON public.graph_nodes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own graph nodes" ON public.graph_nodes FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for graph_edges
CREATE POLICY "Users can view their own graph edges" ON public.graph_edges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own graph edges" ON public.graph_edges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own graph edges" ON public.graph_edges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own graph edges" ON public.graph_edges FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for claims
CREATE POLICY "Users can view claims from their projects" ON public.claims FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create claims in their projects" ON public.claims FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update claims in their projects" ON public.claims FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete claims from their projects" ON public.claims FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_notebooks_project_id ON public.notebooks(project_id);
CREATE INDEX idx_notebooks_user_id ON public.notebooks(user_id);
CREATE INDEX idx_passages_notebook_id ON public.passages(notebook_id);
CREATE INDEX idx_passages_project_id ON public.passages(project_id);
CREATE INDEX idx_workflow_stages_paper_type ON public.workflow_stages(paper_type);
CREATE INDEX idx_workflow_stages_theme ON public.workflow_stages(theme);
CREATE INDEX idx_project_workflow_progress_project_id ON public.project_workflow_progress(project_id);
CREATE INDEX idx_project_workflow_progress_user_id ON public.project_workflow_progress(user_id);
CREATE INDEX idx_graph_nodes_project_id ON public.graph_nodes(project_id);
CREATE INDEX idx_graph_nodes_user_id ON public.graph_nodes(user_id);
CREATE INDEX idx_graph_edges_project_id ON public.graph_edges(project_id);
CREATE INDEX idx_graph_edges_source_node ON public.graph_edges(source_node_id);
CREATE INDEX idx_graph_edges_target_node ON public.graph_edges(target_node_id);
CREATE INDEX idx_claims_project_id ON public.claims(project_id);
CREATE INDEX idx_claims_passage_id ON public.claims(passage_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notebooks_updated_at BEFORE UPDATE ON public.notebooks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_passages_updated_at BEFORE UPDATE ON public.passages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_project_workflow_progress_updated_at BEFORE UPDATE ON public.project_workflow_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_graph_nodes_updated_at BEFORE UPDATE ON public.graph_nodes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_graph_edges_updated_at BEFORE UPDATE ON public.graph_edges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON public.claims FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();