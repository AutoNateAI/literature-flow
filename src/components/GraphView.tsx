import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Position,
  Handle,
  Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  setMultiSelectedConcepts: React.Dispatch<React.SetStateAction<string[]>>; 
  setSelectedNodeDetail: React.Dispatch<React.SetStateAction<any>>;
  setNodeDetailOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const isSelected = multiSelectedConcepts.includes(data.id);
  
  const handleShiftClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      e.stopPropagation();
      if (isSelected) {
        setMultiSelectedConcepts(prev => prev.filter(id => id !== data.id));
      } else {
        setMultiSelectedConcepts(prev => [...prev, data.id]);
      }
    }
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeDetail({ ...data, type: 'hypothesis' });
    setNodeDetailOpen(true);
  };

  return (
    <Card className={`w-40 cursor-pointer transition-all duration-200 ${isSelected ? 'ring-2 ring-primary shadow-lg' : ''}`} 
          onClick={handleShiftClick}>
      <CardHeader className="p-3 pb-2 bg-purple-100">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-purple-600" />
          <CardTitle className="text-xs font-semibold text-purple-800">Research Focus</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <p className="text-xs font-medium text-gray-700 line-clamp-3">{data.title}</p>
        <div className="flex justify-between items-center mt-2">
          <Badge variant="outline" className="text-xs">
            ID: {data.id.slice(-4)}
          </Badge>
          <Button variant="ghost" size="sm" onClick={handleDetailsClick} className="h-6 w-6 p-0">
            <Info className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
};

const ConceptNode = ({ data, multiSelectedConcepts, setMultiSelectedConcepts, setSelectedNodeDetail, setNodeDetailOpen }: { 
  data: any; 
  multiSelectedConcepts: string[]; 
  setMultiSelectedConcepts: React.Dispatch<React.SetStateAction<string[]>>; 
  setSelectedNodeDetail: React.Dispatch<React.SetStateAction<any>>;
  setNodeDetailOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const isSelected = multiSelectedConcepts.includes(data.id);
  
  const handleShiftClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      e.stopPropagation();
      if (isSelected) {
        setMultiSelectedConcepts(prev => prev.filter(id => id !== data.id));
      } else {
        setMultiSelectedConcepts(prev => [...prev, data.id]);
      }
    }
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeDetail({ ...data, type: 'concept' });
    setNodeDetailOpen(true);
  };

  return (
    <Card className={`w-40 cursor-pointer transition-all duration-200 ${isSelected ? 'ring-2 ring-primary shadow-lg' : ''}`} 
          onClick={handleShiftClick}>
      <CardHeader className="p-3 pb-2 bg-blue-100">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-blue-600" />
          <CardTitle className="text-xs font-semibold text-blue-800">Concept</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <p className="text-xs font-medium text-gray-700 line-clamp-3">{data.title}</p>
        <div className="flex justify-between items-center mt-2">
          <Badge variant="outline" className="text-xs">
            ID: {data.id.slice(-4)}
          </Badge>
          <Button variant="ghost" size="sm" onClick={handleDetailsClick} className="h-6 w-6 p-0">
            <Info className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
};

const GapNode = ({ data, setSelectedNodeDetail, setNodeDetailOpen }: { 
  data: any; 
  setSelectedNodeDetail: React.Dispatch<React.SetStateAction<any>>;
  setNodeDetailOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeDetail({ ...data, type: 'gap' });
    setNodeDetailOpen(true);
  };

  return (
    <Card className="w-40 cursor-pointer">
      <CardHeader className="p-3 pb-2 bg-yellow-100">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <CardTitle className="text-xs font-semibold text-yellow-800">Research Gap</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <p className="text-xs font-medium text-gray-700 line-clamp-3">{data.title}</p>
        <div className="flex justify-between items-center mt-2">
          <Badge variant="outline" className="text-xs">
            ID: {data.id.slice(-4)}
          </Badge>
          <Button variant="ghost" size="sm" onClick={handleDetailsClick} className="h-6 w-6 p-0">
            <Info className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
};

const DiscrepancyNode = ({ data, setSelectedNodeDetail, setNodeDetailOpen }: { 
  data: any; 
  setSelectedNodeDetail: React.Dispatch<React.SetStateAction<any>>;
  setNodeDetailOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeDetail({ ...data, type: 'discrepancy' });
    setNodeDetailOpen(true);
  };

  return (
    <Card className="w-40 cursor-pointer">
      <CardHeader className="p-3 pb-2 bg-red-100">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <CardTitle className="text-xs font-semibold text-red-800">Discrepancy</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <p className="text-xs font-medium text-gray-700 line-clamp-3">{data.title}</p>
        <div className="flex justify-between items-center mt-2">
          <Badge variant="outline" className="text-xs">
            ID: {data.id.slice(-4)}
          </Badge>
          <Button variant="ghost" size="sm" onClick={handleDetailsClick} className="h-6 w-6 p-0">
            <Info className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
};

const PublicationNode = ({ data, setSelectedNodeDetail, setNodeDetailOpen }: { 
  data: any; 
  setSelectedNodeDetail: React.Dispatch<React.SetStateAction<any>>;
  setNodeDetailOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeDetail({ ...data, type: 'publication' });
    setNodeDetailOpen(true);
  };

  return (
    <Card className="w-40 cursor-pointer">
      <CardHeader className="p-3 pb-2 bg-green-100">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-green-600" />
          <CardTitle className="text-xs font-semibold text-green-800">Publication</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <p className="text-xs font-medium text-gray-700 line-clamp-3">{data.title}</p>
        <div className="flex justify-between items-center mt-2">
          <Badge variant="outline" className="text-xs">
            ID: {data.id.slice(-4)}
          </Badge>
          <Button variant="ghost" size="sm" onClick={handleDetailsClick} className="h-6 w-6 p-0">
            <Info className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
};

const NotebookNode = ({ data, setSelectedNodeDetail, setNodeDetailOpen }: { 
  data: any; 
  setSelectedNodeDetail: React.Dispatch<React.SetStateAction<any>>;
  setNodeDetailOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeDetail({ ...data, type: 'notebook' });
    setNodeDetailOpen(true);
  };

  return (
    <Card className="w-40 cursor-pointer">
      <CardHeader className="p-3 pb-2 bg-orange-100">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-orange-600" />
          <CardTitle className="text-xs font-semibold text-orange-800">Notebook</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <p className="text-xs font-medium text-gray-700 line-clamp-3">{data.title}</p>
        <div className="flex justify-between items-center mt-2">
          <Badge variant="outline" className="text-xs">
            {data.upload_count || 0} files
          </Badge>
          <Button variant="ghost" size="sm" onClick={handleDetailsClick} className="h-6 w-6 p-0">
            <Info className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
};

const SourceNode = ({ data, setSelectedNodeDetail, setNodeDetailOpen }: { 
  data: any; 
  setSelectedNodeDetail: React.Dispatch<React.SetStateAction<any>>;
  setNodeDetailOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeDetail({ ...data, type: 'source' });
    setNodeDetailOpen(true);
  };

  return (
    <Card className="w-40 cursor-pointer">
      <CardHeader className="p-3 pb-2 bg-teal-100">
        <div className="flex items-center gap-2">
          <Link className="h-4 w-4 text-teal-600" />
          <CardTitle className="text-xs font-semibold text-teal-800">Source</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <p className="text-xs font-medium text-gray-700 line-clamp-3">{data.title}</p>
        <div className="flex justify-between items-center mt-2">
          <Badge variant="outline" className="text-xs">
            {data.file_type || 'File'}
          </Badge>
          <Button variant="ghost" size="sm" onClick={handleDetailsClick} className="h-6 w-6 p-0">
            <Info className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
};

const InsightNode = ({ data, setSelectedNodeDetail, setNodeDetailOpen }: { 
  data: any; 
  setSelectedNodeDetail: React.Dispatch<React.SetStateAction<any>>;
  setNodeDetailOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeDetail({ ...data, type: 'insight' });
    setNodeDetailOpen(true);
  };

  return (
    <Card className="w-40 cursor-pointer">
      <CardHeader className="p-3 pb-2 bg-indigo-100">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-indigo-600" />
          <CardTitle className="text-xs font-semibold text-indigo-800">Insight</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <p className="text-xs font-medium text-gray-700 line-clamp-3">{data.title}</p>
        <div className="flex justify-between items-center mt-2">
          <Badge variant="outline" className="text-xs">
            ID: {data.id.slice(-4)}
          </Badge>
          <Button variant="ghost" size="sm" onClick={handleDetailsClick} className="h-6 w-6 p-0">
            <Info className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
};

// Factory function to create node types with necessary props
const createNodeTypes = (
  multiSelectedConcepts: string[], 
  setMultiSelectedConcepts: React.Dispatch<React.SetStateAction<string[]>>, 
  setSelectedNodeDetail: React.Dispatch<React.SetStateAction<any>>,
  setNodeDetailOpen: React.Dispatch<React.SetStateAction<boolean>>
) => ({
  hypothesis: (props: any) => <HypothesisNode {...props} 
    multiSelectedConcepts={multiSelectedConcepts} 
    setMultiSelectedConcepts={setMultiSelectedConcepts}
    setSelectedNodeDetail={setSelectedNodeDetail}
    setNodeDetailOpen={setNodeDetailOpen}
  />,
  concept: (props: any) => <ConceptNode {...props} 
    multiSelectedConcepts={multiSelectedConcepts} 
    setMultiSelectedConcepts={setMultiSelectedConcepts}
    setSelectedNodeDetail={setSelectedNodeDetail}
    setNodeDetailOpen={setNodeDetailOpen}
  />,
  gap: (props: any) => <GapNode {...props} 
    setSelectedNodeDetail={setSelectedNodeDetail}
    setNodeDetailOpen={setNodeDetailOpen}
  />,
  discrepancy: (props: any) => <DiscrepancyNode {...props} 
    setSelectedNodeDetail={setSelectedNodeDetail}
    setNodeDetailOpen={setNodeDetailOpen}
  />,
  publication: (props: any) => <PublicationNode {...props} 
    setSelectedNodeDetail={setSelectedNodeDetail}
    setNodeDetailOpen={setNodeDetailOpen}
  />,
  notebook: (props: any) => <NotebookNode {...props} 
    setSelectedNodeDetail={setSelectedNodeDetail}
    setNodeDetailOpen={setNodeDetailOpen}
  />,
  source: (props: any) => <SourceNode {...props} 
    setSelectedNodeDetail={setSelectedNodeDetail}
    setNodeDetailOpen={setNodeDetailOpen}
  />,
  insight: (props: any) => <InsightNode {...props} 
    setSelectedNodeDetail={setSelectedNodeDetail}
    setNodeDetailOpen={setNodeDetailOpen}
  />,
});

export function GraphView({ projectId, onGraphControlsChange }: GraphViewProps) {
  const { user } = useAuth();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [layoutMode, setLayoutMode] = useState<'hierarchical' | 'spatial'>('hierarchical');
  const [edgeDialogOpen, setEdgeDialogOpen] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
  const [connectionType, setConnectionType] = useState("");
  const [connectionAnnotation, setConnectionAnnotation] = useState("");
  const [insightDialogOpen, setInsightDialogOpen] = useState(false);
  const [insightTitle, setInsightTitle] = useState("");
  const [insightDetails, setInsightDetails] = useState("");
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [selectedNotebook, setSelectedNotebook] = useState("");
  const [selectedSource, setSelectedSource] = useState("");
  const [selectedConcept, setSelectedConcept] = useState("");
  const [nodeDetailOpen, setNodeDetailOpen] = useState(false);
  const [selectedNodeDetail, setSelectedNodeDetail] = useState<any>(null);
  const [multiSelectActive, setMultiSelectActive] = useState(false);
  const [multiSelectedConcepts, setMultiSelectedConcepts] = useState<string[]>([]);
  const [sourceSelectionRows, setSourceSelectionRows] = useState([{ id: 1, notebook: '', source: '', concept: '' }]);
  const [projectData, setProjectData] = useState<any>(null);

  const nodeTypes = useMemo(
    () => createNodeTypes(multiSelectedConcepts, setMultiSelectedConcepts, setSelectedNodeDetail, setNodeDetailOpen),
    [multiSelectedConcepts, setMultiSelectedConcepts, setSelectedNodeDetail, setNodeDetailOpen]
  );

  // ... rest of component logic would go here
  
  const getNodeStats = () => {
    const stats = {
      concepts: nodes.filter(n => n.type === 'concept').length,
      hypotheses: nodes.filter(n => n.type === 'hypothesis').length,
      notebooks: nodes.filter(n => n.type === 'notebook').length,
      sources: nodes.filter(n => n.type === 'source').length,
      insights: nodes.filter(n => n.type === 'insight').length,
      connections: edges.length
    };
    return stats;
  };

  const nodeStats = getNodeStats();

  // Pass controls data to parent component (sidebar)
  useEffect(() => {
    if (onGraphControlsChange) {
      onGraphControlsChange({
        layoutMode,
        onLayoutChange: setLayoutMode,
        onAddInsight: () => setInsightDialogOpen(true),
        multiSelectedConcepts,
        nodeStats
      });
    }
  }, [layoutMode, multiSelectedConcepts, nodeStats, onGraphControlsChange]);

  return (
    <div className="h-full relative">
      {/* React Flow Graph */}
      <div className="h-full border rounded-lg bg-background">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
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
                gap: '#eab308',
                discrepancy: '#ef4444',
                publication: '#22c55e',
                notebook: '#f97316',
                source: '#14b8a6',
                insight: '#6366f1'
              };
              return colors[node.type as keyof typeof colors] || '#6b7280';
            }}
            className="bg-background border border-border"
          />
          <Background />
        </ReactFlow>
      </div>

      {/* Insight Dialog */}
      <Dialog open={insightDialogOpen} onOpenChange={setInsightDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Insight</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insight-title">Title</Label>
                <Input
                  id="insight-title"
                  value={insightTitle}
                  onChange={(e) => setInsightTitle(e.target.value)}
                  placeholder="Enter insight title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insight-details">Details</Label>
                <Textarea
                  id="insight-details"
                  value={insightDetails}
                  onChange={(e) => setInsightDetails(e.target.value)}
                  placeholder="Enter insight details"
                  className="min-h-[100px]"
                />
              </div>
            </div>

            {multiSelectedConcepts.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Concepts ({multiSelectedConcepts.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {multiSelectedConcepts.map(conceptId => {
                    const concept = nodes.find(n => n.id === conceptId);
                    return concept ? (
                      <Badge key={conceptId} variant="secondary">
                        {concept.data.title}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  // Create insight logic would go here
                  setInsightDialogOpen(false);
                  setInsightTitle("");
                  setInsightDetails("");
                  setSelectedConcepts([]);
                  setMultiSelectedConcepts([]);
                  setSourceSelectionRows([{ id: 1, notebook: '', source: '', concept: '' }]);
                }}
                disabled={!insightTitle || selectedConcepts.length === 0}
              >
                Create Insight
              </Button>
              <Button variant="outline" onClick={() => {
                setInsightDialogOpen(false);
                setInsightTitle("");
                setInsightDetails("");
                setSelectedConcepts([]);
                setMultiSelectedConcepts([]);
                setSourceSelectionRows([{ id: 1, notebook: '', source: '', concept: '' }]);
              }}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Node Detail Modal */}
      <Dialog open={nodeDetailOpen} onOpenChange={setNodeDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNodeDetail?.title || 'Node Details'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedNodeDetail && (
            <div className="space-y-4">
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