-- Fix the function search path security issues by adding SECURITY DEFINER and proper search_path
CREATE OR REPLACE FUNCTION create_notebook_graph_node()
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
$$;

CREATE OR REPLACE FUNCTION create_resource_graph_node()
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
$$;