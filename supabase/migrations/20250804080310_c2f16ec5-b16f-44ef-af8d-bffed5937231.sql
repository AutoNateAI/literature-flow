-- First, create graph nodes for all existing notebooks that don't have them
INSERT INTO graph_nodes (
  project_id,
  user_id,
  node_type,
  title,
  content,
  notebook_id,
  position_x,
  position_y,
  hierarchical_position_x,
  hierarchical_position_y,
  spatial_position_x,
  spatial_position_y
)
SELECT DISTINCT
  n.project_id,
  n.user_id,
  'notebook' as node_type,
  n.title,
  n.briefing as content,
  n.id as notebook_id,
  0 as position_x,
  0 as position_y,
  0 as hierarchical_position_x,
  0 as hierarchical_position_y,
  0 as spatial_position_x,
  0 as spatial_position_y
FROM notebooks n
WHERE NOT EXISTS (
  SELECT 1 FROM graph_nodes gn 
  WHERE gn.node_type = 'notebook' 
  AND gn.notebook_id = n.id
);

-- Create graph nodes for all existing notebook resources (sources) that don't have them
INSERT INTO graph_nodes (
  project_id,
  user_id,
  node_type,
  title,
  content,
  notebook_id,
  concept_source,
  position_x,
  position_y,
  hierarchical_position_x,
  hierarchical_position_y,
  spatial_position_x,
  spatial_position_y
)
SELECT DISTINCT
  nr.project_id,
  nr.user_id,
  'source' as node_type,
  nr.title,
  COALESCE(nr.file_type || ' - ' || COALESCE(nr.file_size, 'Unknown size'), nr.file_type, 'Document') as content,
  nr.notebook_id,
  nr.source_url as concept_source,
  0 as position_x,
  0 as position_y,
  0 as hierarchical_position_x,
  0 as hierarchical_position_y,
  0 as spatial_position_x,
  0 as spatial_position_y
FROM notebook_resources nr
WHERE NOT EXISTS (
  SELECT 1 FROM graph_nodes gn 
  WHERE gn.node_type = 'source' 
  AND gn.concept_source = nr.source_url
  AND gn.notebook_id = nr.notebook_id
);

-- Add additional columns to graph_nodes for source-specific data
ALTER TABLE graph_nodes 
ADD COLUMN IF NOT EXISTS file_type text,
ADD COLUMN IF NOT EXISTS file_size text,
ADD COLUMN IF NOT EXISTS source_url text,
ADD COLUMN IF NOT EXISTS resource_id uuid;

-- Update the newly created source nodes with proper file information
UPDATE graph_nodes gn
SET 
  file_type = nr.file_type,
  file_size = nr.file_size,
  source_url = nr.source_url,
  resource_id = nr.id
FROM notebook_resources nr
WHERE gn.node_type = 'source' 
  AND gn.notebook_id = nr.notebook_id 
  AND gn.concept_source = nr.source_url;

-- Create a function to automatically create graph nodes when notebooks are created
CREATE OR REPLACE FUNCTION create_notebook_graph_node()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO graph_nodes (
    project_id,
    user_id,
    node_type,
    title,
    content,
    notebook_id,
    position_x,
    position_y,
    hierarchical_position_x,
    hierarchical_position_y,
    spatial_position_x,
    spatial_position_y
  ) VALUES (
    NEW.project_id,
    NEW.user_id,
    'notebook',
    NEW.title,
    NEW.briefing,
    NEW.id,
    0, 0, 0, 0, 0, 0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a function to automatically create graph nodes when resources are created
CREATE OR REPLACE FUNCTION create_resource_graph_node()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO graph_nodes (
    project_id,
    user_id,
    node_type,
    title,
    content,
    notebook_id,
    concept_source,
    file_type,
    file_size,
    source_url,
    resource_id,
    position_x,
    position_y,
    hierarchical_position_x,
    hierarchical_position_y,
    spatial_position_x,
    spatial_position_y
  ) VALUES (
    NEW.project_id,
    NEW.user_id,
    'source',
    NEW.title,
    COALESCE(NEW.file_type || ' - ' || COALESCE(NEW.file_size, 'Unknown size'), NEW.file_type, 'Document'),
    NEW.notebook_id,
    NEW.source_url,
    NEW.file_type,
    NEW.file_size,
    NEW.source_url,
    NEW.id,
    0, 0, 0, 0, 0, 0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically create graph nodes
CREATE TRIGGER trigger_create_notebook_graph_node
  AFTER INSERT ON notebooks
  FOR EACH ROW
  EXECUTE FUNCTION create_notebook_graph_node();

CREATE TRIGGER trigger_create_resource_graph_node
  AFTER INSERT ON notebook_resources
  FOR EACH ROW
  EXECUTE FUNCTION create_resource_graph_node();