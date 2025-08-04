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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, Target, FileText, Lightbulb } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GraphViewProps {
  projectId: string;
}

// Custom Node Components
const PointNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-background border-2 border-primary min-w-[150px]">
    <Handle type="target" position={Position.Left} />
    <div className="flex items-center gap-2">
      <Target className="h-4 w-4 text-primary" />
      <div>
        <div className="font-bold text-sm">{data.title}</div>
        {data.content && <div className="text-xs text-muted-foreground">{data.content.substring(0, 50)}...</div>}
      </div>
    </div>
    <Handle type="source" position={Position.Right} />
  </div>
);

const ClaimNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-secondary border-2 border-secondary min-w-[150px]">
    <Handle type="target" position={Position.Left} />
    <div className="flex items-center gap-2">
      <Lightbulb className="h-4 w-4 text-secondary-foreground" />
      <div>
        <div className="font-bold text-sm">{data.title}</div>
        {data.content && <div className="text-xs text-muted-foreground">{data.content.substring(0, 50)}...</div>}
        {data.claim_type && (
          <Badge variant="outline" className="text-xs mt-1">
            {data.claim_type}
          </Badge>
        )}
      </div>
    </div>
    <Handle type="source" position={Position.Right} />
  </div>
);

const NotebookNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-accent border-2 border-accent min-w-[150px]">
    <Handle type="target" position={Position.Left} />
    <div className="flex items-center gap-2">
      <BookOpen className="h-4 w-4 text-accent-foreground" />
      <div>
        <div className="font-bold text-sm">{data.title}</div>
        <div className="text-xs text-muted-foreground">{data.upload_count} files</div>
      </div>
    </div>
    <Handle type="source" position={Position.Right} />
  </div>
);

const nodeTypes = {
  point: PointNode,
  claim: ClaimNode,
  notebook: NotebookNode,
};

export function GraphView({ projectId }: GraphViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showAddNode, setShowAddNode] = useState(false);
  const [newNodeData, setNewNodeData] = useState({
    type: 'point',
    title: '',
    content: '',
    claim_type: 'evidence'
  });
  const { user } = useAuth();

  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        type: 'default',
        data: { annotation: '', edge_type: 'supports' }
      };
      setEdges((eds) => addEdge(edge, eds));
      saveEdgeToDatabase(edge);
    },
    [setEdges]
  );

  const saveEdgeToDatabase = async (edge: any) => {
    if (!user) return;

    try {
      await supabase
        .from('graph_edges')
        .insert({
          project_id: projectId,
          user_id: user.id,
          source_node_id: edge.source,
          target_node_id: edge.target,
          edge_type: edge.data?.edge_type || 'supports',
          annotation: edge.data?.annotation || ''
        });
    } catch (error) {
      console.error('Error saving edge:', error);
    }
  };

  const addNode = async () => {
    if (!user || !newNodeData.title.trim()) {
      toast.error("Please provide a title for the node");
      return;
    }

    try {
      const nodeData = {
        project_id: projectId,
        user_id: user.id,
        title: newNodeData.title,
        content: newNodeData.content,
        node_type: newNodeData.type,
        position_x: Math.random() * 400,
        position_y: Math.random() * 400
      };

      if (newNodeData.type === 'claim') {
        // Create claim in claims table
        const { data: claim, error } = await supabase
          .from('claims')
          .insert({
            project_id: projectId,
            user_id: user.id,
            content: newNodeData.content,
            claim_type: newNodeData.claim_type,
            passage_id: null // Will be linked later
          })
          .select()
          .single();

        if (error) throw error;

        // Create graph node
        await supabase
          .from('graph_nodes')
          .insert({
            ...nodeData,
            passage_id: claim.id
          });
      } else {
        // Create regular graph node
        await supabase
          .from('graph_nodes')
          .insert(nodeData);
      }

      // Reset form and refresh
      setNewNodeData({ type: 'point', title: '', content: '', claim_type: 'evidence' });
      setShowAddNode(false);
      loadGraphData();
      toast.success("Node added successfully");
    } catch (error) {
      console.error('Error adding node:', error);
      toast.error("Failed to add node");
    }
  };

  const loadGraphData = async () => {
    if (!user) return;

    try {
      // Load nodes
      const { data: nodeData, error: nodeError } = await supabase
        .from('graph_nodes')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id);

      if (nodeError) throw nodeError;

      // Load notebooks for notebook nodes
      const { data: notebookData, error: notebookError } = await supabase
        .from('notebooks')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id);

      if (notebookError) throw notebookError;

      // Convert to React Flow nodes
      const flowNodes: Node[] = [
        ...nodeData.map(node => ({
          id: node.id,
          type: node.node_type,
          position: { x: node.position_x || 0, y: node.position_y || 0 },
          data: {
            title: node.title,
            content: node.content,
            claim_type: node.node_type === 'claim' ? 'evidence' : undefined
          }
        })),
        ...notebookData.map((notebook, index) => ({
          id: `notebook-${notebook.id}`,
          type: 'notebook',
          position: { x: 100, y: 100 + (index * 120) },
          data: {
            title: notebook.title,
            upload_count: notebook.upload_count
          }
        }))
      ];

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
        type: 'default',
        label: edge.annotation,
        data: { edge_type: edge.edge_type }
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error('Error loading graph data:', error);
    }
  };

  useEffect(() => {
    loadGraphData();
  }, [projectId, user]);

  return (
    <div className="h-full space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Literature Map
            <Button onClick={() => setShowAddNode(!showAddNode)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Node
            </Button>
          </CardTitle>
          <CardDescription>
            Visual map of your literature, claims, and connections
          </CardDescription>
        </CardHeader>
        {showAddNode && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="node-type">Node Type</Label>
                <Select value={newNodeData.type} onValueChange={(value) => setNewNodeData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="point">Point/Argument</SelectItem>
                    <SelectItem value="claim">Claim/Evidence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newNodeData.type === 'claim' && (
                <div>
                  <Label htmlFor="claim-type">Claim Type</Label>
                  <Select value={newNodeData.claim_type} onValueChange={(value) => setNewNodeData(prev => ({ ...prev, claim_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="evidence">Evidence</SelectItem>
                      <SelectItem value="counterargument">Counter-argument</SelectItem>
                      <SelectItem value="methodology">Methodology</SelectItem>
                      <SelectItem value="finding">Finding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="node-title">Title</Label>
              <Input
                id="node-title"
                value={newNodeData.title}
                onChange={(e) => setNewNodeData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter node title..."
              />
            </div>
            <div>
              <Label htmlFor="node-content">Content</Label>
              <Textarea
                id="node-content"
                value={newNodeData.content}
                onChange={(e) => setNewNodeData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter detailed content..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={addNode}>Add Node</Button>
              <Button variant="outline" onClick={() => setShowAddNode(false)}>Cancel</Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* React Flow Graph */}
      <div className="h-[600px] border rounded-lg">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          style={{ backgroundColor: 'hsl(var(--background))' }}
        >
          <Controls />
          <MiniMap 
            nodeColor="hsl(var(--primary))"
            maskColor="hsl(var(--accent))"
          />
          <Background gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}