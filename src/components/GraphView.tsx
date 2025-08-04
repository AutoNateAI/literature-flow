import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lightbulb, AlertTriangle, BookOpen, Target, Network, Link, Info } from "lucide-react";

interface GraphViewProps {
  projectId: string;
}

// Enhanced Node Components for Research Graph
const HypothesisNode = ({ data }: { data: any }) => (
  <div className="px-6 py-4 shadow-lg rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 border-3 border-purple-300 min-w-[200px] max-w-[300px]">
    <Handle type="target" position={Position.Top} className="w-4 h-4" />
    <div className="text-center">
      <Target className="h-6 w-6 text-purple-700 mx-auto mb-2" />
      <div className="font-bold text-lg text-purple-900">{data.title}</div>
      {data.content && (
        <div className="text-sm text-purple-700 mt-2 leading-relaxed">
          {data.content.length > 100 ? `${data.content.substring(0, 100)}...` : data.content}
        </div>
      )}
      <Badge variant="secondary" className="mt-2 bg-purple-200 text-purple-800">
        Research Focus
      </Badge>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-4 h-4" />
    <Handle type="source" position={Position.Left} className="w-4 h-4" />
    <Handle type="source" position={Position.Right} className="w-4 h-4" />
  </div>
);

const ConceptNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 shadow-md rounded-lg bg-blue-50 border-2 border-blue-200 min-w-[150px] max-w-[250px]">
    <Handle type="target" position={Position.Top} />
    <div className="flex items-start gap-2">
      <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <div className="font-semibold text-sm text-blue-900">{data.title}</div>
        {data.content && (
          <div className="text-xs text-blue-700 mt-1 leading-relaxed">
            {data.content.length > 80 ? `${data.content.substring(0, 80)}...` : data.content}
          </div>
        )}
        {data.confidence_score && (
          <Badge variant="outline" className="text-xs mt-2 border-blue-300 text-blue-700">
            {Math.round(data.confidence_score * 100)}% confidence
          </Badge>
        )}
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const GapNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 shadow-md rounded-lg bg-yellow-50 border-2 border-yellow-200 min-w-[150px] max-w-[250px]">
    <Handle type="target" position={Position.Top} />
    <div className="flex items-start gap-2">
      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <div className="font-semibold text-sm text-yellow-900">{data.title}</div>
        {data.content && (
          <div className="text-xs text-yellow-700 mt-1 leading-relaxed">
            {data.content.length > 80 ? `${data.content.substring(0, 80)}...` : data.content}
          </div>
        )}
        <Badge variant="outline" className="text-xs mt-2 border-yellow-300 text-yellow-700">
          Research Gap
        </Badge>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const DiscrepancyNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 shadow-md rounded-lg bg-red-50 border-2 border-red-200 min-w-[150px] max-w-[250px]">
    <Handle type="target" position={Position.Top} />
    <div className="flex items-start gap-2">
      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <div className="font-semibold text-sm text-red-900">{data.title}</div>
        {data.content && (
          <div className="text-xs text-red-700 mt-1 leading-relaxed">
            {data.content.length > 80 ? `${data.content.substring(0, 80)}...` : data.content}
          </div>
        )}
        <Badge variant="outline" className="text-xs mt-2 border-red-300 text-red-700">
          Discrepancy
        </Badge>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const PublicationNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 shadow-md rounded-lg bg-green-50 border-2 border-green-200 min-w-[150px] max-w-[250px]">
    <Handle type="target" position={Position.Top} />
    <div className="flex items-start gap-2">
      <BookOpen className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <div className="font-semibold text-sm text-green-900">{data.title}</div>
        {data.content && (
          <div className="text-xs text-green-700 mt-1 leading-relaxed">
            {data.content.length > 80 ? `${data.content.substring(0, 80)}...` : data.content}
          </div>
        )}
        <Badge variant="outline" className="text-xs mt-2 border-green-300 text-green-700">
          Key Publication
        </Badge>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const NotebookNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 shadow-md rounded-lg bg-orange-50 border-2 border-orange-200 min-w-[150px] max-w-[250px]">
    <Handle type="target" position={Position.Top} />
    <div className="flex items-start gap-2">
      <BookOpen className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <div className="font-semibold text-sm text-orange-900">{data.title}</div>
        {data.briefing && (
          <div className="text-xs text-orange-700 mt-1 leading-relaxed">
            {data.briefing.length > 80 ? `${data.briefing.substring(0, 80)}...` : data.briefing}
          </div>
        )}
        <Badge variant="outline" className="text-xs mt-2 border-orange-300 text-orange-700">
          Notebook
        </Badge>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const SourceNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 shadow-md rounded-lg bg-teal-50 border-2 border-teal-200 min-w-[150px] max-w-[250px]">
    <Handle type="target" position={Position.Top} />
    <div className="flex items-start gap-2">
      <Link className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <div className="font-semibold text-sm text-teal-900">{data.title}</div>
        {data.file_type && (
          <div className="text-xs text-teal-700 mt-1">
            {data.file_type} {data.file_size && `• ${data.file_size}`}
          </div>
        )}
        <Badge variant="outline" className="text-xs mt-2 border-teal-300 text-teal-700">
          Source
        </Badge>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const nodeTypes = {
  hypothesis: HypothesisNode,
  concept: ConceptNode,
  gap: GapNode,
  discrepancy: DiscrepancyNode,
  publication: PublicationNode,
  notebook: NotebookNode,
  source: SourceNode,
};

export function GraphView({ projectId }: GraphViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);
  const [edgeDialogOpen, setEdgeDialogOpen] = useState(false);
  const [edgeAnnotation, setEdgeAnnotation] = useState("");
  const [edgeType, setEdgeType] = useState("supports");
  const { user } = useAuth();

  const onConnect = useCallback(
    (params: Connection) => {
      setSelectedEdge(params);
      setEdgeDialogOpen(true);
    },
    []
  );

  const saveConnection = async () => {
    if (!selectedEdge || !user) return;

    try {
      const { data: edge, error } = await supabase
        .from('graph_edges')
        .insert({
          project_id: projectId,
          user_id: user.id,
          source_node_id: selectedEdge.source,
          target_node_id: selectedEdge.target,
          edge_type: edgeType,
          annotation: edgeAnnotation,
          strength: 1.0
        })
        .select()
        .single();

      if (error) throw error;

      const newEdge = {
        id: edge.id,
        source: selectedEdge.source!,
        target: selectedEdge.target!,
        type: 'smoothstep',
        label: edgeAnnotation,
        labelStyle: { fontSize: 12, fontWeight: 600 },
        style: { 
          stroke: getEdgeColor(edgeType),
          strokeWidth: 2 
        },
        data: { edge_type: edgeType, annotation: edgeAnnotation }
      };

      setEdges((eds) => addEdge(newEdge, eds));
      setEdgeDialogOpen(false);
      setEdgeAnnotation("");
      setEdgeType("supports");
      toast.success("Connection added!");
    } catch (error) {
      console.error('Error saving connection:', error);
      toast.error("Failed to save connection");
    }
  };

  const getEdgeColor = (edgeType: string) => {
    const colors = {
      supports: "#10b981",
      contradicts: "#ef4444", 
      relates_to: "#3b82f6",
      builds_on: "#8b5cf6",
      questions: "#f59e0b"
    };
    return colors[edgeType as keyof typeof colors] || "#6b7280";
  };

  const loadGraphData = async () => {
    if (!user) return;

    try {
      // Load graph nodes
      const { data: nodeData, error: nodeError } = await supabase
        .from('graph_nodes')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id);

      if (nodeError) throw nodeError;

      // Load notebooks for this project
      const { data: notebookData, error: notebookError } = await supabase
        .from('notebooks')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id);

      if (notebookError) throw notebookError;

      // Load notebook resources for this project
      const { data: resourceData, error: resourceError } = await supabase
        .from('notebook_resources')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id);

      if (resourceError) throw resourceError;

      // Convert to React Flow nodes
      const flowNodes: Node[] = [];
      
      // Add concept nodes
      nodeData.forEach(node => {
        flowNodes.push({
          id: node.id,
          type: node.node_type,
          position: { x: node.position_x || 400, y: node.position_y || 300 },
          data: {
            title: node.title,
            content: node.content,
            confidence_score: node.confidence_score,
            concept_source: node.concept_source,
            extraction_method: node.extraction_method
          }
        });
      });

      // Add notebook nodes
      notebookData.forEach((notebook, index) => {
        flowNodes.push({
          id: `notebook-${notebook.id}`,
          type: 'notebook',
          position: { x: 100, y: 100 + (index * 200) },
          data: {
            title: notebook.title,
            briefing: notebook.briefing,
            upload_count: notebook.upload_count
          }
        });
      });

      // Add source nodes  
      resourceData.forEach((resource, index) => {
        flowNodes.push({
          id: `source-${resource.id}`,
          type: 'source',
          position: { x: 300, y: 100 + (index * 150) },
          data: {
            title: resource.title,
            file_type: resource.file_type,
            file_size: resource.file_size,
            source_url: resource.source_url
          }
        });
      });

      // Load edges
      const { data: edgeData, error: edgeError } = await supabase
        .from('graph_edges')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id);

      if (edgeError) throw edgeError;

      const flowEdges: Edge[] = edgeData.map(edge => ({
        id: edge.id,
        source: edge.source_node_id,
        target: edge.target_node_id,
        type: 'smoothstep',
        label: edge.annotation,
        labelStyle: { fontSize: 12, fontWeight: 600 },
        style: { 
          stroke: getEdgeColor(edge.edge_type),
          strokeWidth: 2 
        },
        data: { edge_type: edge.edge_type, annotation: edge.annotation }
      }));

      // Add automatic connections from concepts to their supporting sources
      nodeData.forEach(node => {
        if (node.concept_source && typeof node.concept_source === 'object') {
          const sources = Array.isArray(node.concept_source) ? node.concept_source : [node.concept_source];
          sources.forEach((source: any, index: number) => {
            // Connect to notebook
            if (source.notebook_id) {
              flowEdges.push({
                id: `concept-notebook-${node.id}-${source.notebook_id}-${index}`,
                source: `notebook-${source.notebook_id}`,
                target: node.id,
                type: 'smoothstep',
                label: 'supports',
                labelStyle: { fontSize: 10, fontWeight: 400 },
                style: { 
                  stroke: '#f59e0b',
                  strokeWidth: 1,
                  strokeDasharray: '5,5'
                },
                data: { edge_type: 'supports', annotation: 'Notebook source' }
              });
            }
            
            // Connect to resource
            if (source.resource_id) {
              flowEdges.push({
                id: `concept-resource-${node.id}-${source.resource_id}-${index}`,
                source: `source-${source.resource_id}`,
                target: node.id,
                type: 'smoothstep',
                label: 'cites',
                labelStyle: { fontSize: 10, fontWeight: 400 },
                style: { 
                  stroke: '#14b8a6',
                  strokeWidth: 1,
                  strokeDasharray: '5,5'
                },
                data: { edge_type: 'cites', annotation: 'Resource citation' }
              });
            }
          });
        }
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error('Error loading graph data:', error);
      toast.error("Failed to load graph data");
    }
  };

  useEffect(() => {
    loadGraphData();
  }, [projectId, user]);

  const getNodeStats = () => {
    const stats = nodes.reduce((acc, node) => {
      acc[node.type || 'unknown'] = (acc[node.type || 'unknown'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return stats;
  };

  const nodeStats = getNodeStats();

  return (
    <div className="h-full space-y-4">
      {/* Header & Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Research Literature Map
          </CardTitle>
          <CardDescription>
            Visual representation of your research insights extracted from NotebookLM analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {nodeStats.hypothesis && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                {nodeStats.hypothesis} Research Question{nodeStats.hypothesis > 1 ? 's' : ''}
              </Badge>
            )}
            {nodeStats.concept && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {nodeStats.concept} Concept{nodeStats.concept > 1 ? 's' : ''}
              </Badge>
            )}
            {nodeStats.gap && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                {nodeStats.gap} Research Gap{nodeStats.gap > 1 ? 's' : ''}
              </Badge>
            )}
            {nodeStats.discrepancy && (
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                {nodeStats.discrepancy} Discrepanc{nodeStats.discrepancy > 1 ? 'ies' : 'y'}
              </Badge>
            )}
            {nodeStats.publication && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {nodeStats.publication} Key Publication{nodeStats.publication > 1 ? 's' : ''}
              </Badge>
            )}
            {nodeStats.notebook && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                {nodeStats.notebook} Notebook{nodeStats.notebook > 1 ? 's' : ''}
              </Badge>
            )}
            {nodeStats.source && (
              <Badge variant="secondary" className="bg-teal-100 text-teal-800">
                {nodeStats.source} Source{nodeStats.source > 1 ? 's' : ''}
              </Badge>
            )}
            <Badge variant="outline">
              {edges.length} Connection{edges.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          {nodes.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <Info className="h-8 w-8 mx-auto mb-2" />
              <p>No concepts in your graph yet.</p>
              <p className="text-sm">Use the "Extract Concepts" tab to add insights from NotebookLM.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* React Flow Graph */}
      <div className="h-[700px] border rounded-lg bg-background">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          style={{ backgroundColor: 'hsl(var(--background))' }}
          connectionLineStyle={{ stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
          defaultEdgeOptions={{ 
            type: 'smoothstep',
            style: { strokeWidth: 2, stroke: '#10b981' }
          }}
        >
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              const colors = {
                hypothesis: '#8b5cf6',
                concept: '#3b82f6',
                gap: '#f59e0b',
                discrepancy: '#ef4444',
                publication: '#10b981',
                notebook: '#f97316',
                source: '#14b8a6'
              };
              return colors[node.type as keyof typeof colors] || '#6b7280';
            }}
            maskColor="hsl(var(--accent) / 0.1)"
            style={{ backgroundColor: 'hsl(var(--background))' }}
          />
          <Background gap={20} size={1} color="hsl(var(--border))" />
        </ReactFlow>
      </div>

      {/* Connection Dialog */}
      <Dialog open={edgeDialogOpen} onOpenChange={setEdgeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Define Connection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edge-type">Relationship Type</Label>
              <Select value={edgeType} onValueChange={setEdgeType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  <SelectItem value="supports">Supports</SelectItem>
                  <SelectItem value="contradicts">Contradicts</SelectItem>
                  <SelectItem value="relates_to">Relates To</SelectItem>
                  <SelectItem value="builds_on">Builds On</SelectItem>
                  <SelectItem value="questions">Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edge-annotation">Description (Optional)</Label>
              <Textarea
                id="edge-annotation"
                value={edgeAnnotation}
                onChange={(e) => setEdgeAnnotation(e.target.value)}
                placeholder="Explain how these concepts are connected..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveConnection}>Create Connection</Button>
              <Button variant="outline" onClick={() => setEdgeDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}