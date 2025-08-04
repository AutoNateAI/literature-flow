import { useCallback, useEffect, useState, useMemo } from 'react';
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
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lightbulb, AlertTriangle, BookOpen, Target, Network, Link, Info, LayoutGrid, GitBranch, Plus, Brain, FileText, Database, Edit } from "lucide-react";

interface GraphViewProps {
  projectId: string;
  onGraphControlsChange?: (controls: any) => void;
}

// Enhanced Node Components for Research Graph
const HypothesisNode = ({ data, multiSelectedConcepts, setMultiSelectedConcepts, setSelectedNodeDetail, setNodeDetailOpen }: { 
  data: any; 
  multiSelectedConcepts: string[]; 
  setMultiSelectedConcepts: (fn: (prev: string[]) => string[]) => void;
  setSelectedNodeDetail: (data: any) => void;
  setNodeDetailOpen: (open: boolean) => void;
}) => {
  const nodeId = data.nodeId || data.id;
  return (
    <div 
      className={`px-6 py-4 shadow-lg rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 border-3 border-purple-300 min-w-[200px] max-w-[300px] cursor-pointer hover:shadow-xl transition-shadow ${
        multiSelectedConcepts.includes(nodeId) ? 'ring-4 ring-blue-500 bg-blue-100' : ''
      }`}
      onClick={(e) => {
        if (e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          console.log('Shift+click on hypothesis, node ID:', nodeId);
          setMultiSelectedConcepts(prev => {
            const isAlreadySelected = prev.includes(nodeId);
            if (isAlreadySelected) {
              return prev.filter(id => id !== nodeId);
            } else {
              return [...prev, nodeId];
            }
          });
        } else {
          setSelectedNodeDetail({ ...data, type: 'hypothesis' });
          setNodeDetailOpen(true);
        }
      }}
    >
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
};

const ConceptNode = ({ data, multiSelectedConcepts, setMultiSelectedConcepts, setSelectedNodeDetail, setNodeDetailOpen }: { 
  data: any; 
  multiSelectedConcepts: string[]; 
  setMultiSelectedConcepts: (fn: (prev: string[]) => string[]) => void;
  setSelectedNodeDetail: (data: any) => void;
  setNodeDetailOpen: (open: boolean) => void;
}) => {
  const nodeId = data.nodeId || data.id;
  return (
    <div 
      className={`px-4 py-3 shadow-md rounded-lg bg-blue-50 border-2 border-blue-200 min-w-[150px] max-w-[250px] cursor-pointer hover:shadow-lg transition-shadow ${
        multiSelectedConcepts.includes(nodeId) ? 'ring-4 ring-blue-500 bg-blue-100' : ''
      }`}
      onClick={(e) => {
        if (e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          console.log('Shift+click on concept, node ID:', nodeId);
          console.log('Node data:', data);
          console.log('Current multiSelectedConcepts:', multiSelectedConcepts);
          
          setMultiSelectedConcepts(prev => {
            const isAlreadySelected = prev.includes(nodeId);
            if (isAlreadySelected) {
              console.log('Removing from selection:', nodeId);
              return prev.filter(id => id !== nodeId);
            } else {
              console.log('Adding to selection:', nodeId);
              return [...prev, nodeId];
            }
          });
        } else {
          // Only open detail if not in multi-select mode
          if (multiSelectedConcepts.length === 0) {
            setSelectedNodeDetail({ ...data, type: 'concept' });
            setNodeDetailOpen(true);
          }
        }
      }}
    >
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
};

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

const NotebookNode = ({ data, setSelectedNodeDetail, setNodeDetailOpen }: { 
  data: any; 
  setSelectedNodeDetail: (data: any) => void;
  setNodeDetailOpen: (open: boolean) => void;
}) => (
  <div 
    className="px-4 py-3 shadow-md rounded-lg bg-orange-50 border-2 border-orange-200 min-w-[150px] max-w-[250px] cursor-pointer hover:shadow-lg transition-shadow"
    onClick={() => {
      setSelectedNodeDetail({ ...data, type: 'notebook' });
      setNodeDetailOpen(true);
    }}
  >
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

const SourceNode = ({ data, setSelectedNodeDetail, setNodeDetailOpen }: { 
  data: any; 
  setSelectedNodeDetail: (data: any) => void;
  setNodeDetailOpen: (open: boolean) => void;
}) => (
  <div 
    className="px-4 py-3 shadow-md rounded-lg bg-teal-50 border-2 border-teal-200 min-w-[150px] max-w-[250px] cursor-pointer hover:shadow-lg transition-shadow"
    onClick={() => {
      setSelectedNodeDetail({ ...data, type: 'source' });
      setNodeDetailOpen(true);
    }}
  >
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

const InsightNode = ({ data, setSelectedNodeDetail, setNodeDetailOpen }: { 
  data: any; 
  setSelectedNodeDetail: (data: any) => void;
  setNodeDetailOpen: (open: boolean) => void;
}) => (
  <div 
    className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200 border-3 border-indigo-300 min-w-[180px] max-w-[280px] cursor-pointer hover:shadow-xl transition-shadow"
    onClick={() => {
      setSelectedNodeDetail({ ...data, type: 'insight' });
      setNodeDetailOpen(true);
    }}
  >
    <Handle type="target" position={Position.Top} />
    <div className="flex items-start gap-2">
      <Brain className="h-5 w-5 text-indigo-700 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <div className="font-bold text-sm text-indigo-900">{data.title}</div>
        {data.details && (
          <div className="text-xs text-indigo-700 mt-1 leading-relaxed">
            {data.details.length > 80 ? `${data.details.substring(0, 80)}...` : data.details}
          </div>
        )}
        <Badge variant="outline" className="text-xs mt-2 border-indigo-300 text-indigo-700">
          Insight
        </Badge>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const createNodeTypes = (
  multiSelectedConcepts: string[],
  setMultiSelectedConcepts: (fn: (prev: string[]) => string[]) => void,
  setSelectedNodeDetail: (data: any) => void,
  setNodeDetailOpen: (open: boolean) => void
) => ({
  hypothesis: (props: any) => HypothesisNode({ ...props, multiSelectedConcepts, setMultiSelectedConcepts, setSelectedNodeDetail, setNodeDetailOpen }),
  concept: (props: any) => ConceptNode({ ...props, multiSelectedConcepts, setMultiSelectedConcepts, setSelectedNodeDetail, setNodeDetailOpen }),
  gap: GapNode,
  discrepancy: DiscrepancyNode,
  publication: PublicationNode,
  notebook: (props: any) => NotebookNode({ ...props, setSelectedNodeDetail, setNodeDetailOpen }),
  source: (props: any) => SourceNode({ ...props, setSelectedNodeDetail, setNodeDetailOpen }),
  insight: (props: any) => InsightNode({ ...props, setSelectedNodeDetail, setNodeDetailOpen }),
});

export function GraphView({ projectId, onGraphControlsChange }: GraphViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);
  const [edgeDialogOpen, setEdgeDialogOpen] = useState(false);
  const [edgeAnnotation, setEdgeAnnotation] = useState("");
  const [edgeType, setEdgeType] = useState("supports");
  const [layoutMode, setLayoutMode] = useState<'hierarchical' | 'spatial'>('hierarchical');
  const [insightDialogOpen, setInsightDialogOpen] = useState(false);
  const [insightTitle, setInsightTitle] = useState("");
  const [insightDetails, setInsightDetails] = useState("");
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [selectedNotebook, setSelectedNotebook] = useState("");
  const [selectedSource, setSelectedSource] = useState("");
  const [selectedConcept, setSelectedConcept] = useState("");
  const [nodeDetailOpen, setNodeDetailOpen] = useState(false);
  const [selectedNodeDetail, setSelectedNodeDetail] = useState<any>(null);
  const [sourceSelectionRows, setSourceSelectionRows] = useState([{ id: 1, notebook: '', source: '', concept: '' }]);
  const { user } = useAuth();

  // Fixed multi-select state and behavior
  const [multiSelectedConcepts, setMultiSelectedConcepts] = useState<string[]>([]);
  const [multiSelectActive, setMultiSelectActive] = useState(false);

  // Effect to track multi-select state
  useEffect(() => {
    setMultiSelectActive(multiSelectedConcepts.length > 0);
  }, [multiSelectedConcepts]);

  // Memoize nodeTypes to prevent React Flow warnings
  const nodeTypes = useMemo(() => 
    createNodeTypes(multiSelectedConcepts, setMultiSelectedConcepts, setSelectedNodeDetail, setNodeDetailOpen), 
    [multiSelectedConcepts, setMultiSelectedConcepts, setSelectedNodeDetail, setNodeDetailOpen]
  );

  // Preserve layout mode and node positions
  useEffect(() => {
    const savedLayoutMode = localStorage.getItem(`layoutMode-${projectId}`);
    if (savedLayoutMode) {
      setLayoutMode(savedLayoutMode as 'hierarchical' | 'spatial');
    }
  }, [projectId]);

  useEffect(() => {
    localStorage.setItem(`layoutMode-${projectId}`, layoutMode);
  }, [layoutMode, projectId]);

  // Handle multi-select properly
  useEffect(() => {
    setMultiSelectActive(multiSelectedConcepts.length > 0);
  }, [multiSelectedConcepts]);

  const onConnect = useCallback(
    (params: Connection) => {
      setSelectedEdge(params);
      setEdgeDialogOpen(true);
    },
    []
  );

  // Save node positions when they change
  const onNodesChangeWithSave = useCallback(
    (changes: any[]) => {
      onNodesChange(changes);
      
      // Save position changes to database with layout-specific columns
      changes.forEach(async (change) => {
        if (change.type === 'position' && change.position && user) {
          try {
            const updateData = layoutMode === 'hierarchical' 
              ? {
                  hierarchical_position_x: change.position.x,
                  hierarchical_position_y: change.position.y,
                  position_x: change.position.x, // Keep legacy column updated
                  position_y: change.position.y
                }
              : {
                  spatial_position_x: change.position.x,
                  spatial_position_y: change.position.y,
                  position_x: change.position.x, // Keep legacy column updated
                  position_y: change.position.y
                };

            await supabase
              .from('graph_nodes')
              .update(updateData)
              .eq('id', change.id);
          } catch (error) {
            console.error('Error saving node position:', error);
          }
        }
      });
    },
    [onNodesChange, user, layoutMode]
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

  const getHierarchicalLayout = (nodes: any[], notebookData: any[], resourceData: any[], nodeData: any[], projectData: any) => {
    const layoutNodes: Node[] = [];
    let currentY = 50;
    
    // Level 0: Project Root (top level) - use saved hierarchical position if available
    if (projectData) {
      // Check if we have a project node with saved position
      const projectNode = nodeData.find(node => node.is_project_root);
      const position = projectNode 
        ? { 
            x: projectNode.hierarchical_position_x || 400, 
            y: projectNode.hierarchical_position_y || currentY 
          }
        : { x: 400, y: currentY };
      
      layoutNodes.push({
        id: projectNode ? projectNode.id : `project-${projectData.id}`,
        type: 'hypothesis',
        position,
        data: {
          nodeId: projectNode ? projectNode.id : `project-${projectData.id}`,
          title: projectData.title,
          content: projectData.hypothesis || projectData.research_focus || 'Project research focus',
          project_id: projectData.id,
          is_project_root: true
        }
      });
      currentY += 150;
    }
    
    // Level 1: Notebooks - use saved hierarchical positions if available
    notebookData.forEach((notebook, index) => {
      // Look for saved position from a notebook node
      const notebookNode = nodeData.find(node => node.notebook_id === notebook.id);
      const position = notebookNode 
        ? { 
            x: notebookNode.hierarchical_position_x || (200 + (index * 350)), 
            y: notebookNode.hierarchical_position_y || currentY 
          }
        : { x: 200 + (index * 350), y: currentY };
      
      layoutNodes.push({
        id: `notebook-${notebook.id}`,
        type: 'notebook',
        position,
        data: {
          title: notebook.title,
          briefing: notebook.briefing,
          upload_count: notebook.upload_count,
          notebook_id: notebook.id
        }
      });
    });

    currentY += 200;

    // Level 2: Sources (connected to notebooks) - use saved hierarchical positions
    resourceData.forEach((resource, index) => {
      const notebookIndex = notebookData.findIndex(n => n.id === resource.notebook_id);
      const defaultXPos = notebookIndex >= 0 ? 200 + (notebookIndex * 350) + (index % 2) * 150 : 200 + (index * 200);
      
      // Look for saved position from a source node
      const sourceNode = nodeData.find(node => node.source_id === resource.id);
      const position = sourceNode 
        ? { 
            x: sourceNode.hierarchical_position_x || defaultXPos, 
            y: sourceNode.hierarchical_position_y || currentY 
          }
        : { x: defaultXPos, y: currentY };
      
      layoutNodes.push({
        id: `source-${resource.id}`,
        type: 'source',
        position,
        data: {
          title: resource.title,
          file_type: resource.file_type,
          file_size: resource.file_size,
          source_url: resource.source_url,
          notebook_id: resource.notebook_id
        }
      });
    });

    currentY += 200;

    // Level 3: Concepts and other nodes - use saved hierarchical positions
    nodeData.forEach((node, index) => {
      // Skip project root node as it's already added above
      if (node.is_project_root) return;
      
      let defaultXPos = 400 + (index * 200);
      let defaultYPos = currentY;

      // Try to position near related sources
      if (node.concept_source && typeof node.concept_source === 'object') {
        const sources = Array.isArray(node.concept_source) ? node.concept_source : [node.concept_source];
        const firstSource = sources[0];
        if (firstSource?.resource_id) {
          const sourceNode = layoutNodes.find(n => n.id === `source-${firstSource.resource_id}`);
          if (sourceNode) {
            defaultXPos = sourceNode.position.x + (index % 3 - 1) * 100;
            defaultYPos = currentY + Math.floor(index / 3) * 120;
          }
        }
      }

      const position = {
        x: node.hierarchical_position_x || defaultXPos,
        y: node.hierarchical_position_y || defaultYPos
      };

      layoutNodes.push({
        id: node.id,
        type: node.node_type,
        position,
        data: {
          nodeId: node.id, // Add explicit nodeId for multi-select
          title: node.title,
          content: node.content,
          confidence_score: node.confidence_score,
          concept_source: node.concept_source,
          extraction_method: node.extraction_method,
          is_project_root: node.is_project_root
        }
      });
    });

    return layoutNodes;
  };

  const getSpatialLayout = (nodes: any[], notebookData: any[], resourceData: any[], nodeData: any[], projectData: any) => {
    const layoutNodes: Node[] = [];
    
    // Add project root first if it exists
    if (projectData) {
      const projectNode = nodeData.find(node => node.is_project_root);
      const position = projectNode 
        ? { 
            x: projectNode.spatial_position_x || 400, 
            y: projectNode.spatial_position_y || 50 
          }
        : { x: 400, y: 50 };
      
      layoutNodes.push({
        id: projectNode ? projectNode.id : `project-${projectData.id}`,
        type: 'hypothesis',
        position,
        data: {
          nodeId: projectNode ? projectNode.id : `project-${projectData.id}`,
          title: projectData.title,
          content: projectData.hypothesis || projectData.research_focus || 'Project research focus',
          project_id: projectData.id,
          is_project_root: true
        }
      });
    }
    
    // Add notebooks with saved spatial positions or default
    notebookData.forEach((notebook, index) => {
      const notebookNode = nodeData.find(node => node.notebook_id === notebook.id);
      const position = notebookNode 
        ? { 
            x: notebookNode.spatial_position_x || (100 + (index * 200)), 
            y: notebookNode.spatial_position_y || (100 + (index * 200)) 
          }
        : { x: 100 + (index * 200), y: 100 + (index * 200) };
      
      layoutNodes.push({
        id: `notebook-${notebook.id}`,
        type: 'notebook',
        position,
        data: {
          title: notebook.title,
          briefing: notebook.briefing,
          upload_count: notebook.upload_count,
          notebook_id: notebook.id
        }
      });
    });

    // Add sources with saved spatial positions or default
    resourceData.forEach((resource, index) => {
      const sourceNode = nodeData.find(node => node.source_id === resource.id);
      const position = sourceNode 
        ? { 
            x: sourceNode.spatial_position_x || (300 + (index * 150)), 
            y: sourceNode.spatial_position_y || (100 + (index * 150)) 
          }
        : { x: 300 + (index * 150), y: 100 + (index * 150) };
      
      layoutNodes.push({
        id: `source-${resource.id}`,
        type: 'source',
        position,
        data: {
          title: resource.title,
          file_type: resource.file_type,
          file_size: resource.file_size,
          source_url: resource.source_url,
          notebook_id: resource.notebook_id
        }
      });
    });

    // Add concepts and other nodes with saved spatial positions
    nodeData.forEach((node, index) => {
      // Skip project root node as it's already added above
      if (node.is_project_root) return;
      
      const defaultXPos = 100 + (index % 6) * 180;
      const defaultYPos = 100 + Math.floor(index / 6) * 180;
      
      const position = { 
        x: node.spatial_position_x || defaultXPos, 
        y: node.spatial_position_y || defaultYPos
      };
      
      layoutNodes.push({
        id: node.id,
        type: node.node_type,
        position,
        data: {
          nodeId: node.id, // Add explicit nodeId for multi-select
          title: node.title,
          content: node.content,
          confidence_score: node.confidence_score,
          concept_source: node.concept_source,
          extraction_method: node.extraction_method,
          is_project_root: node.is_project_root
        }
      });
    });

    return layoutNodes;
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

      // Load project data (for hierarchical root)
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Apply layout based on mode
      const flowNodes = layoutMode === 'hierarchical' 
        ? getHierarchicalLayout([], notebookData || [], resourceData || [], nodeData || [], projectData)
        : getSpatialLayout([], notebookData || [], resourceData || [], nodeData || [], projectData);

      // Load edges
      const { data: edgeData, error: edgeError } = await supabase
        .from('graph_edges')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id);

      if (edgeError) throw edgeError;

      const flowEdges: Edge[] = (edgeData || []).map(edge => ({
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

      // Add hierarchical connections between project and notebooks (for both views)
      if (projectData) {
        const projectNodeId = nodeData.find(node => node.is_project_root)?.id || `project-${projectData.id}`;
        (notebookData || []).forEach(notebook => {
          flowEdges.push({
            id: `project-notebook-${projectData.id}-${notebook.id}`,
            source: projectNodeId,
            target: `notebook-${notebook.id}`,
            type: 'smoothstep',
            label: 'includes',
            labelStyle: { fontSize: 10, fontWeight: 400 },
            style: { 
              stroke: '#8b5cf6',
              strokeWidth: 2,
            },
            data: { edge_type: 'includes', annotation: 'Project includes notebook' }
          });
        });
      }

      // Add hierarchical connections between notebooks and sources
      (resourceData || []).forEach(resource => {
        if (resource.notebook_id) {
          flowEdges.push({
            id: `notebook-source-${resource.notebook_id}-${resource.id}`,
            source: `notebook-${resource.notebook_id}`,
            target: `source-${resource.id}`,
            type: 'smoothstep',
            label: 'contains',
            labelStyle: { fontSize: 10, fontWeight: 400 },
            style: { 
              stroke: '#f97316',
              strokeWidth: 2,
            },
            data: { edge_type: 'contains', annotation: 'Notebook contains source' }
          });
        }
      });

      // Add automatic connections from concepts to their supporting sources
      (nodeData || []).forEach(node => {
        if (node.concept_source) {
          // Find matching resource by title
          const matchingResource = (resourceData || []).find(resource => 
            resource.title === node.concept_source || 
            resource.title.includes(node.concept_source) ||
            node.concept_source.includes(resource.title)
          );
          
          if (matchingResource) {
            // Connect source to concept
            flowEdges.push({
              id: `source-concept-${matchingResource.id}-${node.id}`,
              source: `source-${matchingResource.id}`,
              target: node.id,
              type: 'smoothstep',
              label: 'cites',
              labelStyle: { fontSize: 10, fontWeight: 400 },
              style: { 
                stroke: '#14b8a6',
                strokeWidth: 2,
              },
              data: { edge_type: 'cites', annotation: 'Resource citation' }
            });
          }
        }
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error('Error loading graph data:', error);
      toast.error("Failed to load graph data");
    }
  };

  const createInsight = async () => {
    if (!user || !insightTitle || selectedConcepts.length === 0) return;

    try {
      const { data: insight, error } = await supabase
        .from('graph_nodes')
        .insert({
          project_id: projectId,
          user_id: user.id,
          node_type: 'insight',
          title: insightTitle,
          content: insightDetails,
          position_x: 500,
          position_y: 600,
        })
        .select()
        .single();

      if (error) throw error;

      // Create connections from selected concepts to the insight
      const edgePromises = selectedConcepts.map(conceptId =>
        supabase.from('graph_edges').insert({
          project_id: projectId,
          user_id: user.id,
          source_node_id: conceptId,
          target_node_id: insight.id,
          edge_type: 'supports',
          annotation: 'Contributes to insight',
          strength: 1.0
        })
      );

      await Promise.all(edgePromises);

      setInsightDialogOpen(false);
      setInsightTitle("");
      setInsightDetails("");
      setSelectedConcepts([]);
      setMultiSelectedConcepts([]);
      setSourceSelectionRows([{ id: 1, notebook: '', source: '', concept: '' }]);
      loadGraphData();
      toast.success("Insight created!");
    } catch (error) {
      console.error('Error creating insight:', error);
      toast.error("Failed to create insight");
    }
  };

  const addSourceSelectionRow = () => {
    const newId = Math.max(...sourceSelectionRows.map(row => row.id)) + 1;
    setSourceSelectionRows([...sourceSelectionRows, { id: newId, notebook: '', source: '', concept: '' }]);
  };

  const removeSourceSelectionRow = (id: number) => {
    if (sourceSelectionRows.length > 1) {
      setSourceSelectionRows(sourceSelectionRows.filter(row => row.id !== id));
    }
  };

  const updateSourceSelectionRow = (id: number, field: string, value: string) => {
    setSourceSelectionRows(sourceSelectionRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const handleMultiSelectInsight = () => {
    setSelectedConcepts([...multiSelectedConcepts]);
    setInsightDialogOpen(true);
    // Don't clear multi-selected concepts until insight is created
  };

  const getConceptNodes = () => {
    return nodes.filter(node => 
      ['concept', 'hypothesis', 'gap', 'discrepancy', 'publication'].includes(node.type || '')
    );
  };

  useEffect(() => {
    loadGraphData();
  }, [projectId, user, layoutMode]);

  const getNodeStats = () => {
    const stats = nodes.reduce((acc, node) => {
      acc[node.type || 'unknown'] = (acc[node.type || 'unknown'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return stats;
  };

  const nodeStats = getNodeStats();

  return (
    <div className="h-full relative">
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
        <CardContent className="space-y-4">
          {/* Layout Toggle & Add Insight Button */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant={layoutMode === 'hierarchical' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLayoutMode('hierarchical')}
                className="flex items-center gap-2"
              >
                <GitBranch className="h-4 w-4" />
                Hierarchical
              </Button>
              <Button
                variant={layoutMode === 'spatial' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLayoutMode('spatial')}
                className="flex items-center gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                Spatial
              </Button>
            </div>
            <Dialog open={insightDialogOpen} onOpenChange={setInsightDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Insight
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Insight</DialogTitle>
                </DialogHeader>
                 <div className="space-y-4">
                   <div>
                     <Label htmlFor="insight-title">Title</Label>
                     <Input
                       id="insight-title"
                       value={insightTitle}
                       onChange={(e) => setInsightTitle(e.target.value)}
                       placeholder="Enter insight title..."
                     />
                   </div>
                   <div>
                     <Label htmlFor="insight-details">Details</Label>
                     <Textarea
                       id="insight-details"
                       value={insightDetails}
                       onChange={(e) => setInsightDetails(e.target.value)}
                       placeholder="Describe your insight..."
                       rows={3}
                     />
                   </div>

                    {/* Source Selection Rows */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label>Source & Concept Selection</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addSourceSelectionRow}
                          className="h-8"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Row
                        </Button>
                      </div>
                      
                      {sourceSelectionRows.map((row, index) => (
                        <div key={row.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="text-sm font-medium">Selection {index + 1}</Label>
                            {sourceSelectionRows.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSourceSelectionRow(row.id)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              >
                                ×
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2">
                            {/* Notebook Selection */}
                            <div>
                              <Label className="text-xs text-muted-foreground">Notebook</Label>
                              <Select 
                                value={row.notebook} 
                                onValueChange={(value) => updateSourceSelectionRow(row.id, 'notebook', value)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent className="bg-background border border-border z-50 max-h-48 overflow-y-auto">
                                  {nodes.filter(n => n.type === 'notebook').map(notebook => (
                                    <SelectItem 
                                      key={notebook.id} 
                                      value={notebook.id}
                                      className="bg-background hover:bg-accent focus:bg-accent"
                                    >
                                      {notebook.data.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Source Selection */}
                            <div>
                              <Label className="text-xs text-muted-foreground">Source</Label>
                              <Select 
                                value={row.source} 
                                onValueChange={(value) => updateSourceSelectionRow(row.id, 'source', value)}
                                disabled={!row.notebook}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent className="bg-background border border-border z-50 max-h-48 overflow-y-auto">
                                  {nodes.filter(n => 
                                    n.type === 'source' && 
                                    (!row.notebook || n.data.notebook_id === row.notebook.replace('notebook-', ''))
                                  ).map(source => (
                                    <SelectItem 
                                      key={source.id} 
                                      value={source.id}
                                      className="bg-background hover:bg-accent focus:bg-accent"
                                    >
                                      {source.data.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Concept Selection */}
                            <div>
                              <Label className="text-xs text-muted-foreground">Concept</Label>
                              <Select 
                                value={row.concept} 
                                onValueChange={(value) => {
                                  updateSourceSelectionRow(row.id, 'concept', value);
                                  if (value && !selectedConcepts.includes(value)) {
                                    setSelectedConcepts([...selectedConcepts, value]);
                                  }
                                }}
                                disabled={!row.source}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent className="bg-background border border-border z-50 max-h-48 overflow-y-auto">
                                  {getConceptNodes().filter(node => 
                                    !row.source || 
                                    (node.data.concept_source && 
                                     nodes.find(n => n.id === row.source)?.data.title &&
                                     (node.data.concept_source.includes(nodes.find(n => n.id === row.source)?.data.title) ||
                                      nodes.find(n => n.id === row.source)?.data.title.includes(node.data.concept_source)))
                                  ).map(concept => (
                                    <SelectItem 
                                      key={concept.id} 
                                      value={concept.id}
                                      className="bg-background hover:bg-accent focus:bg-accent"
                                    >
                                      {concept.data.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                   {/* Selected Concepts Display */}
                   <div>
                     <Label>Selected Concepts ({selectedConcepts.length})</Label>
                     <div className="border rounded-lg p-3 max-h-32 overflow-y-auto bg-muted/5">
                       {selectedConcepts.length === 0 ? (
                         <p className="text-sm text-muted-foreground">No concepts selected</p>
                       ) : (
                         <div className="flex flex-wrap gap-1">
                           {selectedConcepts.map(conceptId => {
                             const concept = nodes.find(n => n.id === conceptId);
                             return concept ? (
                               <Badge 
                                 key={conceptId} 
                                 variant="secondary" 
                                 className="flex items-center gap-1"
                               >
                                 {concept.data.title}
                                 <button
                                   onClick={() => setSelectedConcepts(selectedConcepts.filter(id => id !== conceptId))}
                                   className="ml-1 text-xs hover:text-destructive"
                                 >
                                   ×
                                 </button>
                               </Badge>
                             ) : null;
                           })}
                         </div>
                       )}
                     </div>
                   </div>

                   <div className="flex gap-2">
                     <Button 
                       onClick={createInsight}
                       disabled={!insightTitle || selectedConcepts.length === 0}
                     >
                       Create Insight
                     </Button>
                     <Button variant="outline" onClick={() => {
                       setInsightDialogOpen(false);
                       setSelectedNotebook("");
                       setSelectedSource("");
                       setSelectedConcept("");
                       setSelectedConcepts([]);
                     }}>
                       Cancel
                     </Button>
                   </div>
                 </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Improved Legend */}
          <div className="border rounded-lg p-4 bg-muted/5">
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
            {nodeStats.insight && (
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                {nodeStats.insight} Insight{nodeStats.insight > 1 ? 's' : ''}
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
      <div className="h-full border rounded-lg bg-background">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChangeWithSave}
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
                source: '#14b8a6',
                insight: '#6366f1'
              };
              return colors[node.type as keyof typeof colors] || '#6b7280';
            }}
            maskColor="hsl(var(--muted) / 0.3)"
            style={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))'
            }}
            pannable
            zoomable
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
                <SelectContent className="bg-popover border border-border z-50">
                  <SelectItem value="supports" className="bg-popover hover:bg-accent">Supports</SelectItem>
                  <SelectItem value="contradicts" className="bg-popover hover:bg-accent">Contradicts</SelectItem>
                  <SelectItem value="relates_to" className="bg-popover hover:bg-accent">Relates To</SelectItem>
                  <SelectItem value="builds_on" className="bg-popover hover:bg-accent">Builds On</SelectItem>
                  <SelectItem value="questions" className="bg-popover hover:bg-accent">Questions</SelectItem>
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

      {/* Multi-select Add Insight Button */}
      {multiSelectActive && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button 
            onClick={() => {
              setSelectedConcepts([...multiSelectedConcepts]);
              setInsightDialogOpen(true);
            }}
            className="flex items-center gap-2 shadow-lg bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <Brain className="h-5 w-5" />
            Add Insight ({multiSelectedConcepts.length} concepts)
          </Button>
        </div>
      )}

      {/* Node Detail Modal */}
      <Dialog open={nodeDetailOpen} onOpenChange={setNodeDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNodeDetail?.type === 'notebook' && <BookOpen className="h-5 w-5 text-orange-600" />}
              {selectedNodeDetail?.type === 'source' && <Link className="h-5 w-5 text-teal-600" />}
              {selectedNodeDetail?.type === 'concept' && <Lightbulb className="h-5 w-5 text-blue-600" />}
              {selectedNodeDetail?.type === 'hypothesis' && <Target className="h-5 w-5 text-purple-600" />}
              {selectedNodeDetail?.type === 'insight' && <Brain className="h-5 w-5 text-indigo-600" />}
              {selectedNodeDetail?.title || 'Node Details'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedNodeDetail && (
            <div className="space-y-4">
              {/* Notebook Details */}
              {selectedNodeDetail.type === 'notebook' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Upload Count
                      </Label>
                      <p className="text-sm bg-muted p-2 rounded">{selectedNodeDetail.upload_count || 0}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Notebook ID
                      </Label>
                      <p className="text-xs bg-muted p-2 rounded font-mono">{selectedNodeDetail.notebook_id}</p>
                    </div>
                  </div>
                  {selectedNodeDetail.briefing && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Briefing</Label>
                      <p className="text-sm bg-muted p-3 rounded leading-relaxed">{selectedNodeDetail.briefing}</p>
                    </div>
                  )}
                  
                  {/* Connected Sources */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Connected Sources</Label>
                    <div className="space-y-1">
                      {nodes.filter(n => n.type === 'source' && n.data.notebook_id === selectedNodeDetail.notebook_id).map(source => (
                        <div key={source.id} className="text-xs bg-teal-50 p-2 rounded border border-teal-200">
                          {source.data.title} ({source.data.file_type})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Source Details */}
              {selectedNodeDetail.type === 'source' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">File Type</Label>
                      <p className="text-sm bg-muted p-2 rounded">{selectedNodeDetail.file_type || 'Unknown'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">File Size</Label>
                      <p className="text-sm bg-muted p-2 rounded">{selectedNodeDetail.file_size || 'Unknown'}</p>
                    </div>
                  </div>
                  {selectedNodeDetail.source_url && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Source URL</Label>
                      <p className="text-xs bg-muted p-2 rounded font-mono break-all">{selectedNodeDetail.source_url}</p>
                    </div>
                  )}
                  
                  {/* Connected Concepts */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Connected Concepts</Label>
                    <div className="space-y-1">
                      {nodes.filter(n => 
                        ['concept', 'hypothesis', 'gap', 'discrepancy', 'publication'].includes(n.type || '') &&
                        n.data.concept_source && selectedNodeDetail.title &&
                        (n.data.concept_source.includes(selectedNodeDetail.title) || selectedNodeDetail.title.includes(n.data.concept_source))
                      ).map(concept => (
                        <div key={concept.id} className="text-xs bg-blue-50 p-2 rounded border border-blue-200">
                          {concept.data.title} ({concept.type})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Concept Details */}
              {(selectedNodeDetail.type === 'concept' || selectedNodeDetail.type === 'hypothesis') && (
                <div className="space-y-3">
                  {selectedNodeDetail.content && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Content</Label>
                      <p className="text-sm bg-muted p-3 rounded leading-relaxed">{selectedNodeDetail.content}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    {selectedNodeDetail.confidence_score && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Confidence Score</Label>
                        <p className="text-sm bg-muted p-2 rounded">{Math.round(selectedNodeDetail.confidence_score * 100)}%</p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Extraction Method</Label>
                      <p className="text-sm bg-muted p-2 rounded">{selectedNodeDetail.extraction_method || 'manual'}</p>
                    </div>
                  </div>
                  
                  {selectedNodeDetail.concept_source && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Source</Label>
                      <p className="text-sm bg-muted p-2 rounded">{selectedNodeDetail.concept_source}</p>
                    </div>
                  )}
                  
                  {/* Network Connections */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Network Connections</Label>
                    <div className="space-y-1">
                      {edges.filter(e => e.source === selectedNodeDetail.id || e.target === selectedNodeDetail.id).map(edge => {
                        const otherNodeId = edge.source === selectedNodeDetail.id ? edge.target : edge.source;
                        const otherNode = nodes.find(n => n.id === otherNodeId);
                        const isOutgoing = edge.source === selectedNodeDetail.id;
                        return (
                          <div key={edge.id} className="text-xs bg-gray-50 p-2 rounded border">
                            {isOutgoing ? '→' : '←'} {otherNode?.data.title} ({edge.data?.edge_type})
                            {edge.label && <span className="text-muted-foreground ml-2">- {edge.label}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Insight Details */}
              {selectedNodeDetail.type === 'insight' && (
                <div className="space-y-3">
                  {selectedNodeDetail.details && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Details</Label>
                      <p className="text-sm bg-muted p-3 rounded leading-relaxed">{selectedNodeDetail.details}</p>
                    </div>
                  )}
                  
                  {/* Contributing Concepts */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Contributing Concepts</Label>
                    <div className="space-y-1">
                      {edges.filter(e => e.target === selectedNodeDetail.id).map(edge => {
                        const sourceNode = nodes.find(n => n.id === edge.source);
                        return sourceNode ? (
                          <div key={edge.id} className="text-xs bg-blue-50 p-2 rounded border border-blue-200">
                            {sourceNode.data.title} ({sourceNode.type})
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setNodeDetailOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
