-- Add project level hypothesis/research focus support
-- Update graph_nodes to support project-level nodes
ALTER TABLE public.graph_nodes 
ADD COLUMN IF NOT EXISTS is_project_root BOOLEAN DEFAULT false;

-- Create index for project root nodes
CREATE INDEX IF NOT EXISTS idx_graph_nodes_project_root 
ON public.graph_nodes(project_id, is_project_root) 
WHERE is_project_root = true;

-- Update projects table to ensure hypothesis field exists
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS research_focus TEXT;