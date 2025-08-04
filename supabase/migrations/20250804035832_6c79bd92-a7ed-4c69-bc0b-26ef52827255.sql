-- Add separate position columns for hierarchical and spatial layouts
ALTER TABLE graph_nodes 
ADD COLUMN hierarchical_position_x double precision DEFAULT 0,
ADD COLUMN hierarchical_position_y double precision DEFAULT 0,
ADD COLUMN spatial_position_x double precision DEFAULT 0,
ADD COLUMN spatial_position_y double precision DEFAULT 0;

-- Copy existing positions to both layout columns as default
UPDATE graph_nodes 
SET hierarchical_position_x = COALESCE(position_x, 0),
    hierarchical_position_y = COALESCE(position_y, 0),
    spatial_position_x = COALESCE(position_x, 0),
    spatial_position_y = COALESCE(position_y, 0);