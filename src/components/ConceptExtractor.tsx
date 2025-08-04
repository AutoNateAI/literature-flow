import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Lightbulb, AlertTriangle, BookOpen, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConceptExtractorProps {
  projectId: string;
  notebookId?: string;
}

interface ConceptForm {
  title: string;
  content: string;
  nodeType: string;
  conceptSource: string;
  confidenceScore: number;
}

const nodeTypes = [
  { value: "concept", label: "Key Concept", icon: Lightbulb, color: "bg-blue-100 text-blue-800" },
  { value: "gap", label: "Research Gap", icon: AlertTriangle, color: "bg-yellow-100 text-yellow-800" },
  { value: "discrepancy", label: "Discrepancy", icon: AlertTriangle, color: "bg-red-100 text-red-800" },
  { value: "publication", label: "Pivotal Publication", icon: BookOpen, color: "bg-green-100 text-green-800" },
  { value: "hypothesis", label: "Research Question/Hypothesis", icon: Target, color: "bg-purple-100 text-purple-800" }
];

export function ConceptExtractor({ projectId, notebookId }: ConceptExtractorProps) {
  const [form, setForm] = useState<ConceptForm>({
    title: "",
    content: "",
    nodeType: "",
    conceptSource: "",
    confidenceScore: 1.0
  });
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();

  const updateForm = (field: keyof ConceptForm, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
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

      const { error } = await supabase
        .from('graph_nodes')
        .insert({
          project_id: projectId,
          user_id: user.id,
          node_type: form.nodeType,
          title: form.title,
          content: form.content,
          concept_source: form.conceptSource,
          extraction_method: 'notebooklm',
          confidence_score: form.confidenceScore,
          notebook_id: notebookId,
          position_x: positionX,
          position_y: positionY,
          size: form.nodeType === 'hypothesis' ? 'large' : 'medium',
          color: getNodeColor(form.nodeType)
        });

      if (error) throw error;

      // Reset form
      setForm({
        title: "",
        content: "",
        nodeType: "",
        conceptSource: "",
        confidenceScore: 1.0
      });

      toast.success("Concept added to graph!");
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
            <SelectContent>
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

        {/* Source */}
        <div className="space-y-2">
          <Label htmlFor="concept-source">Source Information</Label>
          <Textarea
            id="concept-source"
            value={form.conceptSource}
            onChange={(e) => updateForm("conceptSource", e.target.value)}
            placeholder="Which sources/papers did this come from? (as reported by NotebookLM)"
            rows={3}
          />
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
            <SelectContent>
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