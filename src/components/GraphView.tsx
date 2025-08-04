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

interface GraphViewProps {
  projectId?: string;
  onGraphControlsChange?: (controls: any) => void;
}

const initialNodes: Node[] = [
  // Research Focus (Center)
  {
    id: 'research-focus',
    position: { x: 400, y: 200 },
    data: { 
      label: 'AI in Education Research',
      type: 'Research Focus',
      icon: Target 
    },
    type: 'default',
    style: { 
      backgroundColor: 'hsl(270 95% 90%)', 
      border: '3px solid hsl(270 95% 60%)',
      borderRadius: '12px',
      padding: '16px',
      fontSize: '14px',
      fontWeight: '600',
      color: 'hsl(270 95% 20%)',
      width: '180px',
      height: '80px'
    },
  },
  // Key Concepts
  {
    id: 'concept-1',
    position: { x: 100, y: 50 },
    data: { 
      label: 'Machine Learning Algorithms',
      type: 'Concept',
      icon: Lightbulb 
    },
    type: 'default',
    style: { 
      backgroundColor: 'hsl(210 95% 90%)', 
      border: '2px solid hsl(210 95% 60%)',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '12px',
      color: 'hsl(210 95% 20%)',
      width: '160px',
      height: '60px'
    },
  },
  {
    id: 'concept-2',
    position: { x: 700, y: 50 },
    data: { 
      label: 'Personalized Learning',
      type: 'Concept',
      icon: Lightbulb 
    },
    type: 'default',
    style: { 
      backgroundColor: 'hsl(210 95% 90%)', 
      border: '2px solid hsl(210 95% 60%)',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '12px',
      color: 'hsl(210 95% 20%)',
      width: '160px',
      height: '60px'
    },
  },
  {
    id: 'concept-3',
    position: { x: 50, y: 350 },
    data: { 
      label: 'Learning Analytics',
      type: 'Concept',
      icon: Lightbulb 
    },
    type: 'default',
    style: { 
      backgroundColor: 'hsl(210 95% 90%)', 
      border: '2px solid hsl(210 95% 60%)',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '12px',
      color: 'hsl(210 95% 20%)',
      width: '160px',
      height: '60px'
    },
  },
  // Research Gaps
  {
    id: 'gap-1',
    position: { x: 300, y: 50 },
    data: { 
      label: 'Implementation Challenges',
      type: 'Research Gap',
      icon: AlertTriangle 
    },
    type: 'default',
    style: { 
      backgroundColor: 'hsl(45 95% 85%)', 
      border: '2px solid hsl(45 95% 50%)',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '12px',
      color: 'hsl(45 95% 20%)',
      width: '160px',
      height: '60px'
    },
  },
  // Publications/Sources
  {
    id: 'source-1',
    position: { x: 600, y: 350 },
    data: { 
      label: 'Chen et al. (2023)',
      type: 'Publication',
      icon: BookOpen 
    },
    type: 'default',
    style: { 
      backgroundColor: 'hsl(120 40% 85%)', 
      border: '2px solid hsl(120 40% 50%)',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '12px',
      color: 'hsl(120 40% 20%)',
      width: '140px',
      height: '50px'
    },
  },
  {
    id: 'source-2',
    position: { x: 750, y: 300 },
    data: { 
      label: 'Williams (2024)',
      type: 'Publication',
      icon: BookOpen 
    },
    type: 'default',
    style: { 
      backgroundColor: 'hsl(120 40% 85%)', 
      border: '2px solid hsl(120 40% 50%)',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '12px',
      color: 'hsl(120 40% 20%)',
      width: '140px',
      height: '50px'
    },
  },
  // Insights
  {
    id: 'insight-1',
    position: { x: 250, y: 350 },
    data: { 
      label: 'Cross-disciplinary Approach Needed',
      type: 'Insight',
      icon: Brain 
    },
    type: 'default',
    style: { 
      backgroundColor: 'hsl(250 60% 85%)', 
      border: '2px solid hsl(250 60% 50%)',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '12px',
      color: 'hsl(250 60% 20%)',
      width: '180px',
      height: '60px'
    },
  },
  // Notebooks
  {
    id: 'notebook-1',
    position: { x: 500, y: 50 },
    data: { 
      label: 'Literature Review Notes',
      type: 'Notebook',
      icon: BookOpen 
    },
    type: 'default',
    style: { 
      backgroundColor: 'hsl(25 70% 85%)', 
      border: '2px solid hsl(25 70% 50%)',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '12px',
      color: 'hsl(25 70% 20%)',
      width: '160px',
      height: '60px'
    },
  },
  // Discrepancy
  {
    id: 'discrepancy-1',
    position: { x: 450, y: 350 },
    data: { 
      label: 'Conflicting Results on Effectiveness',
      type: 'Discrepancy',
      icon: AlertTriangle 
    },
    type: 'default',
    style: { 
      backgroundColor: 'hsl(0 70% 85%)', 
      border: '2px solid hsl(0 70% 50%)',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '12px',
      color: 'hsl(0 70% 20%)',
      width: '180px',
      height: '60px'
    },
  },
];

const initialEdges: Edge[] = [
  // Research Focus connections
  { id: 'e1', source: 'research-focus', target: 'concept-1', style: { stroke: 'hsl(210 95% 60%)', strokeWidth: 2 } },
  { id: 'e2', source: 'research-focus', target: 'concept-2', style: { stroke: 'hsl(210 95% 60%)', strokeWidth: 2 } },
  { id: 'e3', source: 'research-focus', target: 'concept-3', style: { stroke: 'hsl(210 95% 60%)', strokeWidth: 2 } },
  
  // Gap connections
  { id: 'e4', source: 'concept-1', target: 'gap-1', style: { stroke: 'hsl(45 95% 50%)', strokeWidth: 2, strokeDasharray: '5,5' } },
  { id: 'e5', source: 'concept-2', target: 'gap-1', style: { stroke: 'hsl(45 95% 50%)', strokeWidth: 2, strokeDasharray: '5,5' } },
  
  // Source connections
  { id: 'e6', source: 'concept-2', target: 'source-1', style: { stroke: 'hsl(120 40% 50%)', strokeWidth: 2 } },
  { id: 'e7', source: 'concept-2', target: 'source-2', style: { stroke: 'hsl(120 40% 50%)', strokeWidth: 2 } },
  { id: 'e8', source: 'source-1', target: 'discrepancy-1', style: { stroke: 'hsl(0 70% 50%)', strokeWidth: 2 } },
  { id: 'e9', source: 'source-2', target: 'discrepancy-1', style: { stroke: 'hsl(0 70% 50%)', strokeWidth: 2 } },
  
  // Insight connections
  { id: 'e10', source: 'concept-3', target: 'insight-1', style: { stroke: 'hsl(250 60% 50%)', strokeWidth: 2 } },
  { id: 'e11', source: 'gap-1', target: 'insight-1', style: { stroke: 'hsl(250 60% 50%)', strokeWidth: 2 } },
  
  // Notebook connections
  { id: 'e12', source: 'notebook-1', target: 'research-focus', style: { stroke: 'hsl(25 70% 50%)', strokeWidth: 2 } },
  { id: 'e13', source: 'notebook-1', target: 'gap-1', style: { stroke: 'hsl(25 70% 50%)', strokeWidth: 2 } },
];

export const GraphView: React.FC<GraphViewProps> = ({ projectId, onGraphControlsChange }) => {
  const isMobile = useIsMobile();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [layoutMode, setLayoutMode] = useState<'hierarchical' | 'spatial'>('spatial');

  const nodeStats = {
    concept: 3,
    hypothesis: 1,
    insight: 1,
    notebook: 1,
    source: 2,
    gaps: 1,
    discrepancies: 1,
  };

  const applyHierarchicalLayout = useCallback(() => {
    const hierarchicalNodes = nodes.map((node) => {
      let newPosition = { x: 0, y: 0 };
      
      // Define hierarchy levels and positions
      if (node.id === 'research-focus') {
        newPosition = { x: 400, y: 100 }; // Top center
      } else if (node.data.type === 'Concept') {
        const conceptIndex = ['concept-1', 'concept-2', 'concept-3'].indexOf(node.id);
        newPosition = { x: 200 + (conceptIndex * 200), y: 200 };
      } else if (node.data.type === 'Research Gap') {
        newPosition = { x: 400, y: 300 };
      } else if (node.data.type === 'Notebook') {
        newPosition = { x: 100, y: 50 };
      } else if (node.data.type === 'Publication') {
        const sourceIndex = ['source-1', 'source-2'].indexOf(node.id);
        newPosition = { x: 300 + (sourceIndex * 200), y: 400 };
      } else if (node.data.type === 'Insight') {
        newPosition = { x: 200, y: 450 };
      } else if (node.data.type === 'Discrepancy') {
        newPosition = { x: 600, y: 450 };
      }
      
      return {
        ...node,
        position: newPosition,
      };
    });
    
    setNodes(hierarchicalNodes);
  }, [nodes, setNodes]);

  const applySpatialLayout = useCallback(() => {
    const spatialNodes = nodes.map((node) => {
      let newPosition = { x: 0, y: 0 };
      
      // Restore original spatial positions
      if (node.id === 'research-focus') {
        newPosition = { x: 400, y: 200 };
      } else if (node.id === 'concept-1') {
        newPosition = { x: 100, y: 50 };
      } else if (node.id === 'concept-2') {
        newPosition = { x: 700, y: 50 };
      } else if (node.id === 'concept-3') {
        newPosition = { x: 50, y: 350 };
      } else if (node.id === 'gap-1') {
        newPosition = { x: 300, y: 50 };
      } else if (node.id === 'source-1') {
        newPosition = { x: 600, y: 350 };
      } else if (node.id === 'source-2') {
        newPosition = { x: 750, y: 300 };
      } else if (node.id === 'insight-1') {
        newPosition = { x: 250, y: 350 };
      } else if (node.id === 'notebook-1') {
        newPosition = { x: 500, y: 50 };
      } else if (node.id === 'discrepancy-1') {
        newPosition = { x: 450, y: 350 };
      }
      
      return {
        ...node,
        position: newPosition,
      };
    });
    
    setNodes(spatialNodes);
  }, [nodes, setNodes]);

  const handleLayoutChange = useCallback((mode: 'hierarchical' | 'spatial') => {
    setLayoutMode(mode);
    if (mode === 'hierarchical') {
      applyHierarchicalLayout();
    } else {
      applySpatialLayout();
    }
  }, [applyHierarchicalLayout, applySpatialLayout]);

  return (
    <div className="h-full flex flex-col">
      {/* React Flow Graph */}
      <div className="flex-1 border rounded-lg overflow-hidden" style={{ height: '70vh' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
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
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Insight
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
            <span className="text-xs">Research Focus</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <Lightbulb className="h-2 w-2 text-white" />
            </div>
            <span className="text-xs">Concept</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-2 w-2 text-white" />
            </div>
            <span className="text-xs">Research Gap</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-2 w-2 text-white" />
            </div>
            <span className="text-xs">Discrepancy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <BookOpen className="h-2 w-2 text-white" />
            </div>
            <span className="text-xs">Publication</span>
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
        {nodeStats.concept > 0 && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
            {nodeStats.concept} Concept{nodeStats.concept > 1 ? 's' : ''}
          </Badge>
        )}
        {nodeStats.hypothesis > 0 && (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
            {nodeStats.hypothesis} Research Question{nodeStats.hypothesis > 1 ? 's' : ''}
          </Badge>
        )}
        <Badge variant="outline" className="text-xs">
          {edges.length} Connection{edges.length !== 1 ? 's' : ''}
        </Badge>
      </div>
    </div>
  );
};

export default GraphView;