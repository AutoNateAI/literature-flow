-- Update the check constraint to allow the new edge types used by GraphView
ALTER TABLE graph_edges DROP CONSTRAINT IF EXISTS graph_edges_edge_type_check;

-- Add new constraint with all the edge types used in the application
ALTER TABLE graph_edges ADD CONSTRAINT graph_edges_edge_type_check 
CHECK (edge_type = ANY (ARRAY['supports'::text, 'contradicts'::text, 'relates_to'::text, 'builds_on'::text, 'questions'::text, 'cites'::text, 'derived_from'::text, 'challenges'::text]));

-- Also add node types for notebooks and sources if they don't exist
ALTER TABLE graph_nodes DROP CONSTRAINT IF EXISTS graph_nodes_node_type_check;
ALTER TABLE graph_nodes ADD CONSTRAINT graph_nodes_node_type_check 
CHECK (node_type = ANY (ARRAY['point'::text, 'claim'::text, 'notebook'::text, 'concept'::text, 'gap'::text, 'discrepancy'::text, 'publication'::text, 'hypothesis'::text, 'source'::text]));