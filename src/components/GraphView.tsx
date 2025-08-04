import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
} from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain,
  Network,
  Target,
  Lightbulb,
  AlertTriangle,
  BookOpen,
  Link,
  Plus,
  Info,
  Grid,
} from 'lucide-react';
import '@xyflow/react/dist/style.css';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface GraphViewProps {
  projectId?: string;
  onGraphControlsChange?: (controls: any) => void;
}

// Node type mapping for styling
const getNodeStyle = (nodeType: string, isHighlighted: boolean = false) => {
  const baseStyle = {
    borderRadius: '8px',
    padding: '12px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: isHighlighted ? '3px solid hsl(var(--primary))' : '2px solid',
    boxShadow: isHighlighted ? '0 0 20px hsl(var(--primary) / 0.3)' : 'none',
  };

  const typeStyles = {
    project: {
      backgroundColor: 'hsl(270 95% 90%)',
      borderColor: 'hsl(270 95% 60%)',
      color: 'hsl(270 95% 20%)',
      width: '180px',
      height: '80px',
    },
    concept: {
      backgroundColor: 'hsl(210 95% 90%)',
      borderColor: 'hsl(210 95% 60%)',
      color: 'hsl(210 95% 20%)',
      width: '160px',
      height: '70px',
    },
    notebook: {
      backgroundColor: 'hsl(25 70% 90%)',
      borderColor: 'hsl(25 70% 60%)',
      color: 'hsl(25 70% 20%)',
      width: '150px',
      height: '60px',
    },
    source: {
      backgroundColor: 'hsl(160 50% 90%)',
      borderColor: 'hsl(160 50% 60%)',
      color: 'hsl(160 50% 20%)',
      width: '140px',
      height: '60px',
    },
    insight: {
      backgroundColor: 'hsl(250 60% 90%)',
      borderColor: 'hsl(250 60% 60%)',
      color: 'hsl(250 60% 20%)',
      width: '170px',
      height: '70px',
    },
    gap: {
      backgroundColor: 'hsl(45 95% 85%)',
      borderColor: 'hsl(45 95% 50%)',
      color: 'hsl(45 95% 20%)',
      width: '160px',
      height: '60px',
    },
    discrepancy: {
      backgroundColor: 'hsl(0 70% 85%)',
      borderColor: 'hsl(0 70% 50%)',
      color: 'hsl(0 70% 20%)',
      width: '170px',
      height: '70px',
    },
  };

  return { ...baseStyle, ...(typeStyles[nodeType as keyof typeof typeStyles] || typeStyles.concept) };
};

export const GraphView: React.FC<GraphViewProps> = ({ projectId, onGraphControlsChange }) => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [layoutMode, setLayoutMode] = useState<'hierarchical' | 'spatial'>('spatial');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load graph data from database
  const loadGraphData = useCallback(async () => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Load nodes
      const { data: graphNodes, error: nodesError } = await supabase
        .from('graph_nodes')
        .select('*')
        .eq('project_id', projectId);

      if (nodesError) throw nodesError;

      // Load edges
      const { data: graphEdges, error: edgesError } = await supabase
        .from('graph_edges')
        .select('*')
        .eq('project_id', projectId);

      if (edgesError) throw edgesError;

      // Transform database nodes to ReactFlow format
      const flowNodes: Node[] = (graphNodes || []).map((node) => ({
        id: node.id,
        position: layoutMode === 'spatial' 
          ? { x: node.spatial_position_x || 0, y: node.spatial_position_y || 0 }
          : { x: node.hierarchical_position_x || 0, y: node.hierarchical_position_y || 0 },
        data: { 
          label: node.title,
          content: node.content,
          type: node.node_type,
          nodeData: node
        },
        type: 'default',
        style: getNodeStyle(node.node_type, selectedNode === node.id),
      }));

      // Transform database edges to ReactFlow format
      const flowEdges: Edge[] = (graphEdges || []).map((edge) => ({
        id: edge.id,
        source: edge.source_node_id,
        target: edge.target_node_id,
        type: 'default',
        style: {
          stroke: 'hsl(var(--muted-foreground))',
          strokeWidth: 2,
        },
        data: {
          edgeType: edge.edge_type,
          annotation: edge.annotation,
          strength: edge.strength,
        }
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error('Error loading graph data:', error);
      toast.error('Failed to load graph data');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, layoutMode, selectedNode, setNodes, setEdges]);

  // Load data when component mounts or projectId changes
  useEffect(() => {
    loadGraphData();
  }, [loadGraphData]);

  // Handle node click
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(selectedNode === node.id ? null : node.id);
    
    // Update node styles to show selection
    setNodes((nodes) => 
      nodes.map((n) => ({
        ...n,
        style: getNodeStyle(n.data.type, n.id === node.id ? selectedNode !== node.id : false),
      }))
    );
  }, [selectedNode, setNodes]);

  // Handle edge connections
  const onConnect = useCallback(
    async (params: Edge | Connection) => {
      if (!projectId || !user) return;

      try {
        // Add edge to database
        const { error } = await supabase
          .from('graph_edges')
          .insert({
            project_id: projectId,
            user_id: user.id,
            source_node_id: params.source,
            target_node_id: params.target,
            edge_type: 'connection',
            strength: 1.0,
          });

        if (error) throw error;

        // Add edge to local state
        setEdges((eds) => addEdge(params, eds));
        toast.success('Connection created');
      } catch (error) {
        console.error('Error creating edge:', error);
        toast.error('Failed to create connection');
      }
    },
    [projectId, user, setEdges]
  );

  // Layout functions
  const applyHierarchicalLayout = useCallback(async () => {
    if (!projectId) return;

    const hierarchicalNodes = nodes.map((node, index) => {
      const { nodeData } = node.data;
      const newPosition = { 
        x: nodeData.hierarchical_position_x || (index * 200 + 100), 
        y: nodeData.hierarchical_position_y || (Math.floor(index / 4) * 150 + 100) 
      };
      
      return {
        ...node,
        position: newPosition,
      };
    });
    
    setNodes(hierarchicalNodes);
  }, [nodes, setNodes, projectId]);

  const applySpatialLayout = useCallback(async () => {
    if (!projectId) return;

    const spatialNodes = nodes.map((node) => {
      const { nodeData } = node.data;
      const newPosition = { 
        x: nodeData.spatial_position_x || 0, 
        y: nodeData.spatial_position_y || 0 
      };
      
      return {
        ...node,
        position: newPosition,
      };
    });
    
    setNodes(spatialNodes);
  }, [nodes, setNodes, projectId]);

  const handleLayoutChange = useCallback((mode: 'hierarchical' | 'spatial') => {
    setLayoutMode(mode);
    if (mode === 'hierarchical') {
      applyHierarchicalLayout();
    } else {
      applySpatialLayout();
    }
  }, [applyHierarchicalLayout, applySpatialLayout]);

  // Calculate node statistics
  const nodeStats = nodes.reduce((acc, node) => {
    const type = node.data.type;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading graph data...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* React Flow Graph */}
      <div className="flex-1 border rounded-lg overflow-hidden" style={{ height: '70vh' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
          attributionPosition="bottom-left"
          defaultViewport={{ x: 0, y: 0, zoom: isMobile ? 0.6 : 0.8 }}
          minZoom={0.2}
          maxZoom={2}
          style={{ backgroundColor: 'hsl(var(--background))' }}
        >
          <Controls showZoom showFitView showInteractive />
          {!isMobile && (
            <MiniMap 
              nodeStrokeWidth={3}
              maskColor="hsl(var(--muted) / 0.3)"
              style={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))'
              }}
              pannable
              zoomable
            />
          )}
          <Background gap={20} size={1} color="hsl(var(--border))" />
        </ReactFlow>
      </div>

      {/* Layout Controls */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        <Button
          variant={layoutMode === 'hierarchical' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleLayoutChange('hierarchical')}
          className="flex items-center gap-2"
        >
          <Network className="h-4 w-4" />
          Hierarchical
        </Button>
        <Button
          variant={layoutMode === 'spatial' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleLayoutChange('spatial')}
          className="flex items-center gap-2"
        >
          <Grid className="h-4 w-4" />
          Spatial
        </Button>
        <Button
          size="sm"
          onClick={loadGraphData}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Legend */}
      <div className="mt-4 border rounded-lg p-4 bg-muted/5">
        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Network className="h-4 w-4" />
          Node Types
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
              <Target className="h-2 w-2 text-white" />
            </div>
            <span className="text-xs">Project</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <Lightbulb className="h-2 w-2 text-white" />
            </div>
            <span className="text-xs">Concept</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
              <BookOpen className="h-2 w-2 text-white" />
            </div>
            <span className="text-xs">Notebook</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center">
              <Link className="h-2 w-2 text-white" />
            </div>
            <span className="text-xs">Source</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
              <Brain className="h-2 w-2 text-white" />
            </div>
            <span className="text-xs">Insight</span>
          </div>
        </div>
      </div>

      {/* Node Statistics */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {Object.entries(nodeStats).map(([type, count]) => (
          <Badge key={type} variant="secondary" className="text-xs">
            {String(count)} {type}{(count as number) > 1 ? 's' : ''}
          </Badge>
        ))}
        <Badge variant="outline" className="text-xs">
          {edges.length} Connection{edges.length !== 1 ? 's' : ''}
        </Badge>
      </div>
    </div>
  );
};

export default GraphView;