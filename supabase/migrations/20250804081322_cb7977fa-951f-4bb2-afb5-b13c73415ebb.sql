-- First, update the node type constraint to include 'project' type
ALTER TABLE graph_nodes DROP CONSTRAINT IF EXISTS graph_nodes_node_type_check;
ALTER TABLE graph_nodes ADD CONSTRAINT graph_nodes_node_type_check 
CHECK (node_type = ANY (ARRAY['concept'::text, 'hypothesis'::text, 'gap'::text, 'discrepancy'::text, 'publication'::text, 'insight'::text, 'notebook'::text, 'source'::text, 'project'::text]));

-- Now create project root nodes for all existing projects that don't have them
INSERT INTO graph_nodes (
  project_id,
  user_id,
  node_type,
  title,
  content,
  is_project_root,
  position_x,
  position_y,
  hierarchical_position_x,
  hierarchical_position_y,
  spatial_position_x,
  spatial_position_y
)
SELECT DISTINCT
  p.id as project_id,
  p.user_id,
  'project' as node_type,
  p.title,
  COALESCE(p.hypothesis, p.research_focus, 'Research project exploring ' || p.paper_type) as content,
  true as is_project_root,
  400 as position_x,
  50 as position_y,
  400 as hierarchical_position_x,
  50 as hierarchical_position_y,
  400 as spatial_position_x,
  50 as spatial_position_y
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM graph_nodes gn 
  WHERE gn.project_id = p.id 
  AND gn.is_project_root = true
);

-- Create a function to automatically create project root nodes when projects are created
CREATE OR REPLACE FUNCTION create_project_root_node()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO graph_nodes (
    project_id,
    user_id,
    node_type,
    title,
    content,
    is_project_root,
    position_x,
    position_y,
    hierarchical_position_x,
    hierarchical_position_y,
    spatial_position_x,
    spatial_position_y
  ) VALUES (
    NEW.id,
    NEW.user_id,
    'project',
    NEW.title,
    COALESCE(NEW.hypothesis, NEW.research_focus, 'Research project exploring ' || NEW.paper_type),
    true,
    400, 50, 400, 50, 400, 50
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create project root nodes
DROP TRIGGER IF EXISTS trigger_create_project_root_node ON projects;
CREATE TRIGGER trigger_create_project_root_node
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION create_project_root_node();