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
  {
    id: '1',
    position: { x: 250, y: 25 },
    data: { label: 'Research Focus' },
    type: 'default',
    style: { backgroundColor: '#e9d5ff', border: '2px solid #8b5cf6' },
  },
  {
    id: '2',
    position: { x: 100, y: 125 },
    data: { label: 'Concept A' },
    type: 'default',
    style: { backgroundColor: '#dbeafe', border: '2px solid #3b82f6' },
  },
  {
    id: '3',
    position: { x: 400, y: 125 },
    data: { label: 'Concept B' },
    type: 'default',
    style: { backgroundColor: '#dbeafe', border: '2px solid #3b82f6' },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e1-3', source: '1', target: '3' },
];

export const GraphView: React.FC<GraphViewProps> = ({ projectId, onGraphControlsChange }) => {
  const isMobile = useIsMobile();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [layoutMode, setLayoutMode] = useState<'hierarchical' | 'spatial'>('hierarchical');

  const nodeStats = {
    concept: 2,
    hypothesis: 1,
    insight: 0,
    notebook: 0,
    source: 0,
  };

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
          onClick={() => setLayoutMode('hierarchical')}
          className="flex items-center gap-2"
        >
          <Network className="h-4 w-4" />
          Hierarchical
        </Button>
        <Button
          variant={layoutMode === 'spatial' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setLayoutMode('spatial')}
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