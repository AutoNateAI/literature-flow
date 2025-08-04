-- Update the check constraint to allow the new node types used by ConceptExtractor
ALTER TABLE graph_nodes DROP CONSTRAINT IF EXISTS graph_nodes_node_type_check;

-- Add new constraint with all the node types
ALTER TABLE graph_nodes ADD CONSTRAINT graph_nodes_node_type_check 
CHECK (node_type = ANY (ARRAY['point'::text, 'claim'::text, 'notebook'::text, 'concept'::text, 'gap'::text, 'discrepancy'::text, 'publication'::text, 'hypothesis'::text]));