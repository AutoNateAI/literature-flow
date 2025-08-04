import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Trash2, ExternalLink, BookOpen, Target, Edit3, TrendingUp, Lightbulb, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WorkflowBuilder } from "./WorkflowBuilder";
import { ConceptExtractor } from "./ConceptExtractor";
import { ResourceManager } from "./ResourceManager";

interface NotebookUploadProps {
  projectId: string;
}

interface Source {
  title: string;
  url?: string;
  sourceName: string;
  type: string;
}

interface Notebook {
  id: string;
  title: string;
  briefing: string;
  upload_count: number;
  notebook_url?: string;
  created_at: string;
}

const SOURCE_TYPES = [
  "youtube video",
  "publication", 
  "white paper",
  "blog",
  "pdf document",
  "article",
  "research paper",
  "website",
  "book chapter",
  "other"
];

export function NotebookUpload({ projectId }: NotebookUploadProps) {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [notebookTitle, setNotebookTitle] = useState("");
  const [notebookUrl, setNotebookUrl] = useState("");
  const [briefing, setBriefing] = useState("");
  const [sources, setSources] = useState<Source[]>([{
    title: "",
    url: "",
    sourceName: "",
    type: ""
  }]);

  const { user } = useAuth();

  useEffect(() => {
    fetchNotebooks();
    fetchInsights();
  }, [projectId, user]);

  const fetchNotebooks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notebooks')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotebooks(data || []);
    } catch (error) {
      console.error("Error fetching notebooks:", error);
    }
  };

  const fetchInsights = async () => {
    if (!user) return;

    try {
      // Get insights with their connected concepts
      const { data: insightsData, error: insightsError } = await supabase
        .from('graph_nodes')
        .select(`
          *,
          source_edges:graph_edges!target_node_id(
            source_node:graph_nodes!source_node_id(*)
          )
        `)
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .eq('node_type', 'insight')
        .order('created_at', { ascending: false });

      if (insightsError) throw insightsError;

      // Format the data to include concepts
      const formattedInsights = (insightsData || []).map(insight => ({
        ...insight,
        concepts: insight.source_edges?.map(edge => edge.source_node).filter(Boolean) || []
      }));

      setInsights(formattedInsights);
    } catch (error) {
      console.error("Error fetching insights:", error);
    }
  };

  const resetForm = () => {
    setNotebookTitle("");
    setNotebookUrl("");
    setBriefing("");
    setSources([{
      title: "",
      url: "",
      sourceName: "",
      type: ""
    }]);
    setEditingNotebook(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (notebook: Notebook) => {
    setEditingNotebook(notebook);
    setNotebookTitle(notebook.title);
    setNotebookUrl(notebook.notebook_url || "");
    setBriefing(notebook.briefing || "");
    // Load sources from notebook_resources table
    loadNotebookSources(notebook.id);
    setIsModalOpen(true);
  };

  const loadNotebookSources = async (notebookId: string) => {
    try {
      const { data, error } = await supabase
        .from('notebook_resources')
        .select('*')
        .eq('notebook_id', notebookId);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setSources(data.map(resource => ({
          title: resource.title,
          url: resource.source_url || "",
          sourceName: resource.title, // Use title as source name for now
          type: resource.file_type || ""
        })));
      }
    } catch (error) {
      console.error("Error loading sources:", error);
    }
  };

  const addSource = () => {
    setSources([...sources, {
      title: "",
      url: "",
      sourceName: "",
      type: ""
    }]);
  };

  const removeSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  const updateSource = (index: number, field: keyof Source, value: string) => {
    const updatedSources = [...sources];
    updatedSources[index] = { ...updatedSources[index], [field]: value };
    setSources(updatedSources);
  };

  const saveNotebook = async () => {
    if (!user || !notebookTitle.trim()) {
      toast.error("Please provide a notebook title");
      return;
    }

    setIsCreating(true);

    try {
      let notebookId = editingNotebook?.id;

      if (editingNotebook) {
        // Update existing notebook
        const { error } = await supabase
          .from('notebooks')
          .update({
            title: notebookTitle,
            briefing: briefing,
            notebook_url: notebookUrl,
            upload_count: sources.filter(s => s.title.trim()).length
          })
          .eq('id', editingNotebook.id);

        if (error) throw error;
      } else {
        // Create new notebook
        const { data: notebook, error } = await supabase
          .from('notebooks')
          .insert({
            project_id: projectId,
            user_id: user.id,
            title: notebookTitle,
            briefing: briefing,
            notebook_url: notebookUrl,
            upload_count: sources.filter(s => s.title.trim()).length
          })
          .select()
          .single();

        if (error) throw error;
        notebookId = notebook.id;

        // Track notebook creation
        await supabase
          .from('user_interactions')
          .insert({
            user_id: user.id,
            item_id: notebookId,
            item_type: 'notebook',
            interaction_type: 'created'
          });
      }

      // Clear existing resources if editing
      if (editingNotebook) {
        await supabase
          .from('notebook_resources')
          .delete()
          .eq('notebook_id', editingNotebook.id);
      }

      // Insert sources as notebook_resources
      const validSources = sources.filter(s => s.title.trim());
      if (validSources.length > 0) {
        const { error: resourcesError } = await supabase
          .from('notebook_resources')
          .insert(
            validSources.map(source => ({
              notebook_id: notebookId,
              project_id: projectId,
              user_id: user.id,
              title: source.title,
              source_url: source.url || null,
              file_type: source.type || null
            }))
          );

        if (resourcesError) throw resourcesError;
      }

      resetForm();
      setIsModalOpen(false);
      fetchNotebooks();

      toast.success(editingNotebook ? "Notebook updated successfully!" : "Notebook created successfully!");
    } catch (error) {
      console.error("Error saving notebook:", error);
      toast.error("Failed to save notebook");
    } finally {
      setIsCreating(false);
    }
  };

  const deleteNotebook = async (notebookId: string) => {
    try {
      // Delete resources first
      await supabase
        .from('notebook_resources')
        .delete()
        .eq('notebook_id', notebookId);

      // Delete notebook
      const { error } = await supabase
        .from('notebooks')
        .delete()
        .eq('id', notebookId);

      if (error) throw error;

      setNotebooks(prev => prev.filter(n => n.id !== notebookId));
      toast.success("Notebook deleted");
    } catch (error) {
      console.error("Error deleting notebook:", error);
      toast.error("Failed to delete notebook");
    }
  };

  return (
    <Tabs defaultValue="workflow" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4 h-auto md:h-10 gap-1 md:gap-0 p-1">
        <TabsTrigger value="workflow" className="text-xs md:text-sm px-2 md:px-3 py-2 md:py-2">
          <span className="hidden sm:inline">Analysis </span>Workflow
        </TabsTrigger>
        <TabsTrigger value="notebooks" className="text-xs md:text-sm px-2 md:px-3 py-2 md:py-2">Notebooks</TabsTrigger>
        <TabsTrigger value="extract" className="text-xs md:text-sm px-2 md:px-3 py-2 md:py-2">
          <span className="hidden sm:inline">Extract </span>Concepts
        </TabsTrigger>
        <TabsTrigger value="resources" className="text-xs md:text-sm px-2 md:px-3 py-2 md:py-2">Insights</TabsTrigger>
      </TabsList>

      <TabsContent value="notebooks" className="space-y-6">
        {/* Header with Create Button */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  NotebookLM Integration
                </CardTitle>
                <CardDescription>
                  Manage your NotebookLM notebooks and their sources for this project
                </CardDescription>
              </div>
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openCreateModal} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Notebook
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] w-[95vw] md:w-full">
                  <div className="max-h-[75vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingNotebook ? "Edit Notebook" : "Create New Notebook"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingNotebook ? "Update your notebook details and sources" : "Set up a new NotebookLM notebook with sources"}
                      </DialogDescription>
                    </DialogHeader>
                  
                  <div className="space-y-4">
                    {/* Notebook Details */}
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="notebook-title">Notebook Title *</Label>
                        <Input
                          id="notebook-title"
                          value={notebookTitle}
                          onChange={(e) => setNotebookTitle(e.target.value)}
                          placeholder="e.g., AI Ethics Literature Review"
                        />
                      </div>
                      <div>
                        <Label htmlFor="notebook-url">NotebookLM URL</Label>
                        <Input
                          id="notebook-url"
                          value={notebookUrl}
                          onChange={(e) => setNotebookUrl(e.target.value)}
                          placeholder="https://notebooklm.google.com/notebook/..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="briefing">Research Context (Optional)</Label>
                        <Textarea
                          id="briefing"
                          value={briefing}
                          onChange={(e) => setBriefing(e.target.value)}
                          placeholder="Provide context about your research question..."
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Sources */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Sources</Label>
                        <Button variant="outline" size="sm" onClick={addSource}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Source
                        </Button>
                      </div>
                      
                      {sources.map((source, index) => (
                        <Card key={index} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Source {index + 1}</h4>
                              {sources.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSource(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label>Title *</Label>
                                <Input
                                  value={source.title}
                                  onChange={(e) => updateSource(index, 'title', e.target.value)}
                                  placeholder="Source title"
                                />
                              </div>
                              <div>
                                <Label>Source Name</Label>
                                <Input
                                  value={source.sourceName}
                                  onChange={(e) => updateSource(index, 'sourceName', e.target.value)}
                                  placeholder="Author/Publication name"
                                />
                              </div>
                              <div>
                                <Label>URL (Optional)</Label>
                                <Input
                                  value={source.url}
                                  onChange={(e) => updateSource(index, 'url', e.target.value)}
                                  placeholder="https://..."
                                />
                              </div>
                              <div>
                                <Label>Type</Label>
                                <Select
                                  value={source.type}
                                  onValueChange={(value) => updateSource(index, 'type', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background border shadow-md z-50">
                                    {SOURCE_TYPES.map((type) => (
                                      <SelectItem key={type} value={type}>
                                        {type}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={saveNotebook}
                        disabled={!notebookTitle.trim() || isCreating}
                      >
                        {isCreating ? "Saving..." : editingNotebook ? "Update Notebook" : "Create Notebook"}
                      </Button>
                    </div>
                  </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
        </Card>

        {/* Notebooks List */}
        {notebooks.length > 0 ? (
          <div className="space-y-4">
            {notebooks.map((notebook) => (
              <Card key={notebook.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div 
                    className="flex-1"
                    onClick={() => openEditModal(notebook)}
                  >
                    <h4 className="font-semibold text-lg">{notebook.title}</h4>
                    {notebook.briefing && (
                      <p className="text-sm text-muted-foreground mt-1 mb-3">{notebook.briefing}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {notebook.upload_count} sources
                      </span>
                      <span>Created {new Date(notebook.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(notebook)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    {notebook.notebook_url && (
                      <Button
                        variant="default"
                        size="sm"
                        asChild
                      >
                        <a href={notebook.notebook_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Open NotebookLM
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotebook(notebook.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-medium mb-2">No notebooks yet</h3>
              <p className="text-muted-foreground mb-4">Create your first NotebookLM integration to get started</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="workflow">
        <WorkflowBuilder workflowId={projectId} />
      </TabsContent>

      <TabsContent value="extract">
        <ConceptExtractor 
          projectId={projectId} 
          notebookId={notebooks[0]?.id}
        />
      </TabsContent>

      <TabsContent value="resources" className="space-y-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Research Insights</h3>
              <p className="text-sm text-muted-foreground">Insights derived from literature map analysis</p>
            </div>
            <Dialog open={showInsightModal} onOpenChange={setShowInsightModal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Insight
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <ConceptExtractor 
                  projectId={projectId} 
                  onConceptCreated={() => {
                    fetchInsights();
                    setShowInsightModal(false);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="space-y-4">
            {insights.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center py-8">
                    No insights created yet. Create insights by connecting concepts from your research graph.
                  </p>
                </CardContent>
              </Card>
            ) : (
              insights.map((insight) => (
                <Card key={insight.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      {insight.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p>{insight.content}</p>
                    {insight.concepts && insight.concepts.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Supporting Concepts:</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {insight.concepts.map((concept) => (
                            <Badge key={concept.id} variant="secondary" className="flex items-center gap-1">
                              {concept.node_type === 'concept' && <Lightbulb className="h-3 w-3" />}
                              {concept.node_type === 'gap' && <AlertTriangle className="h-3 w-3" />}
                              {concept.node_type === 'hypothesis' && <Target className="h-3 w-3" />}
                              {concept.title}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(insight.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}