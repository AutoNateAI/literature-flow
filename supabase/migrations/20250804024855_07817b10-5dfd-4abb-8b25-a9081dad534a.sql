-- Update the check constraint to allow 'insight' node type
ALTER TABLE public.graph_nodes 
DROP CONSTRAINT IF EXISTS graph_nodes_node_type_check;

-- Add updated constraint with insight type
ALTER TABLE public.graph_nodes 
ADD CONSTRAINT graph_nodes_node_type_check 
CHECK (node_type IN ('concept', 'hypothesis', 'gap', 'discrepancy', 'publication', 'insight'));

-- Also update the default values to ensure consistency
ALTER TABLE public.graph_nodes 
ALTER COLUMN node_type SET DEFAULT 'concept';