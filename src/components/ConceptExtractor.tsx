import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Lightbulb, AlertTriangle, BookOpen, Target, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConceptExtractorProps {
  projectId: string;
  notebookId?: string;
  onConceptCreated?: () => void;
}

interface ConceptSource {
  notebookId: string;
  sourceId: string;
}

interface ConceptForm {
  title: string;
  content: string;
  nodeType: string;
  sources: ConceptSource[];
  confidenceScore: number;
}

const nodeTypes = [
  { value: "concept", label: "Key Concept", icon: Lightbulb, color: "bg-blue-100 text-blue-800" },
  { value: "gap", label: "Research Gap", icon: AlertTriangle, color: "bg-yellow-100 text-yellow-800" },
  { value: "discrepancy", label: "Discrepancy", icon: AlertTriangle, color: "bg-red-100 text-red-800" },
  { value: "publication", label: "Pivotal Publication", icon: BookOpen, color: "bg-green-100 text-green-800" },
  { value: "hypothesis", label: "Research Question/Hypothesis", icon: Target, color: "bg-purple-100 text-purple-800" }
];

export function ConceptExtractor({ projectId, notebookId, onConceptCreated }: ConceptExtractorProps) {
  const [form, setForm] = useState<ConceptForm>({
    title: "",
    content: "",
    nodeType: "",
    sources: [{ notebookId: "", sourceId: "" }],
    confidenceScore: 1.0
  });
  const [isCreating, setIsCreating] = useState(false);
  const [notebooks, setNotebooks] = useState<any[]>([]);
  const [notebookResources, setNotebookResources] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchNotebooks();
      fetchNotebookResources();
    }
  }, [user, projectId]);

  const fetchNotebooks = async () => {
    const { data, error } = await supabase
      .from('notebooks')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user?.id);

    if (!error && data) {
      setNotebooks(data);
    }
  };

  const fetchNotebookResources = async () => {
    const { data, error } = await supabase
      .from('notebook_resources')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user?.id);

    if (!error && data) {
      setNotebookResources(data);
    }
  };

  const updateForm = (field: keyof ConceptForm, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const updateSource = (index: number, field: keyof ConceptSource, value: string) => {
    setForm(prev => ({
      ...prev,
      sources: prev.sources.map((source, i) => 
        i === index ? { ...source, [field]: value } : source
      )
    }));
  };

  const addSource = () => {
    setForm(prev => ({
      ...prev,
      sources: [...prev.sources, { notebookId: "", sourceId: "" }]
    }));
  };

  const removeSource = (index: number) => {
    if (form.sources.length > 1) {
      setForm(prev => ({
        ...prev,
        sources: prev.sources.filter((_, i) => i !== index)
      }));
    }
  };

  const createConcept = async () => {
    if (!user || !form.title.trim() || !form.nodeType) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreating(true);

    try {
      // Calculate position (spread nodes in a circle around center)
      const angle = Math.random() * 2 * Math.PI;
      const radius = form.nodeType === 'hypothesis' ? 0 : 200 + Math.random() * 100;
      const positionX = 400 + Math.cos(angle) * radius;
      const positionY = 300 + Math.sin(angle) * radius;

      // Create sources metadata string
      const sourcesData = form.sources
        .filter(source => source.notebookId && source.sourceId)
        .map(source => {
          const notebook = notebooks.find(n => n.id === source.notebookId);
          const resource = notebookResources.find(r => r.id === source.sourceId);
          return `${notebook?.title || 'Unknown Notebook'} - ${resource?.title || 'Unknown Source'}`;
        })
        .join('; ');

      const { data: concept, error } = await supabase
        .from('graph_nodes')
        .insert({
          project_id: projectId,
          user_id: user.id,
          node_type: form.nodeType,
          title: form.title,
          content: form.content,
          concept_source: sourcesData,
          extraction_method: 'notebooklm',
          confidence_score: form.confidenceScore,
          notebook_id: form.sources[0]?.notebookId || notebookId,
          position_x: positionX,
          position_y: positionY,
          size: form.nodeType === 'hypothesis' ? 'large' : 'medium',
          color: getNodeColor(form.nodeType)
        })
        .select()
        .single();

      if (error) throw error;

      // Track concept creation
      await supabase
        .from('user_interactions')
        .insert({
          user_id: user.id,
          item_id: concept.id,
          item_type: 'concept',
          interaction_type: 'created'
        });

      toast.success("Concept added to graph successfully!");
      
      // Reset form
      setForm({
        title: "",
        content: "",
        nodeType: "",
        sources: [{ notebookId: "", sourceId: "" }],
        confidenceScore: 1.0
      });

      // Call the callback if provided
      if (onConceptCreated) {
        onConceptCreated();
      }
    } catch (error) {
      console.error("Error creating concept:", error);
      toast.error("Failed to create concept");
    } finally {
      setIsCreating(false);
    }
  };

  const getNodeColor = (nodeType: string) => {
    const colors = {
      concept: "#3b82f6",
      gap: "#f59e0b", 
      discrepancy: "#ef4444",
      publication: "#10b981",
      hypothesis: "#8b5cf6"
    };
    return colors[nodeType as keyof typeof colors] || "#6b7280";
  };

  const selectedNodeType = nodeTypes.find(type => type.value === form.nodeType);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Extract Concepts from NotebookLM
        </CardTitle>
        <CardDescription>
          Copy insights from NotebookLM analysis and create graph nodes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Node Type Selection */}
        <div className="space-y-3">
          <Label>Concept Type</Label>
          <Select value={form.nodeType} onValueChange={(value) => updateForm("nodeType", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select the type of concept you're adding" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-md">
              {nodeTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {selectedNodeType && (
            <Badge variant="secondary" className={selectedNodeType.color}>
              <selectedNodeType.icon className="h-3 w-3 mr-1" />
              {selectedNodeType.label}
            </Badge>
          )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="concept-title">Title</Label>
          <Input
            id="concept-title"
            value={form.title}
            onChange={(e) => updateForm("title", e.target.value)}
            placeholder="e.g., Machine Learning Bias, Data Privacy Gap, etc."
          />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label htmlFor="concept-content">Description/Details</Label>
          <Textarea
            id="concept-content"
            value={form.content}
            onChange={(e) => updateForm("content", e.target.value)}
            placeholder="Paste the detailed analysis from NotebookLM here..."
            rows={6}
          />
        </div>

        {/* Sources */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Supporting Sources</Label>
            <Button type="button" variant="outline" size="sm" onClick={addSource}>
              <Plus className="h-4 w-4 mr-1" />
              Add Source
            </Button>
          </div>
          
          {form.sources.map((source, index) => (
            <div key={index} className="flex gap-2 items-center">
              <div className="flex-1">
                <Select 
                  value={source.notebookId} 
                  onValueChange={(value) => updateSource(index, "notebookId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select notebook" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md">
                    {notebooks.map((notebook) => (
                      <SelectItem key={notebook.id} value={notebook.id}>
                        {notebook.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Select 
                  value={source.sourceId} 
                  onValueChange={(value) => updateSource(index, "sourceId", value)}
                  disabled={!source.notebookId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md">
                    {notebookResources
                      .filter(resource => resource.notebook_id === source.notebookId)
                      .map((resource) => (
                        <SelectItem key={resource.id} value={resource.id}>
                          {resource.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              {form.sources.length > 1 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeSource(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Confidence Score */}
        <div className="space-y-2">
          <Label htmlFor="confidence">Confidence Level</Label>
          <Select 
            value={form.confidenceScore.toString()} 
            onValueChange={(value) => updateForm("confidenceScore", parseFloat(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-md">
              <SelectItem value="1.0">High Confidence (1.0)</SelectItem>
              <SelectItem value="0.8">Good Confidence (0.8)</SelectItem>
              <SelectItem value="0.6">Medium Confidence (0.6)</SelectItem>
              <SelectItem value="0.4">Low Confidence (0.4)</SelectItem>
              <SelectItem value="0.2">Very Low Confidence (0.2)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={createConcept} 
          disabled={!form.title.trim() || !form.nodeType || isCreating}
          className="w-full"
        >
          {isCreating ? "Adding to Graph..." : "Add Concept to Graph"}
        </Button>

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
          <strong>💡 Tip:</strong> Use this form after running each NotebookLM prompt. Each concept becomes a node in your research graph that you can connect to other concepts and your central research question.
        </div>
      </CardContent>
    </Card>
  );
}