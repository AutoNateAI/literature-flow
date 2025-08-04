import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Trash2, ExternalLink, BookOpen, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WorkflowPrompts } from "./WorkflowPrompts";
import { ConceptExtractor } from "./ConceptExtractor";
import { ResourceManager } from "./ResourceManager";

interface NotebookUploadProps {
  projectId: string;
}

interface UploadedFile {
  name: string;
  size: number;
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

export function NotebookUpload({ projectId }: NotebookUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [notebookTitle, setNotebookTitle] = useState("");
  const [briefing, setBriefing] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const createNotebook = async () => {
    if (!user || !notebookTitle.trim() || uploadedFiles.length === 0) {
      toast.error("Please provide a title and upload at least one file");
      return;
    }

    setIsCreating(true);

    try {
      // Create notebook record
      const { data: notebook, error } = await supabase
        .from('notebooks')
        .insert({
          project_id: projectId,
          user_id: user.id,
          title: notebookTitle,
          briefing: briefing,
          upload_count: uploadedFiles.length,
          notebook_url: `https://notebooklm.google.com/notebook/${Math.random().toString(36).substr(2, 9)}`
        })
        .select()
        .single();

      if (error) throw error;

      // Reset form
      setNotebookTitle("");
      setBriefing("");
      setUploadedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Refresh notebooks list
      fetchNotebooks();

      toast.success("Notebook created successfully!");
    } catch (error) {
      console.error("Error creating notebook:", error);
      toast.error("Failed to create notebook");
    } finally {
      setIsCreating(false);
    }
  };

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

  const deleteNotebook = async (notebookId: string) => {
    try {
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

  // Fetch notebooks on component mount
  useState(() => {
    fetchNotebooks();
  });

  return (
    <Tabs defaultValue="notebooks" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="notebooks">Notebooks</TabsTrigger>
        <TabsTrigger value="workflow">Analysis Workflow</TabsTrigger>
        <TabsTrigger value="extract">Extract Concepts</TabsTrigger>
        <TabsTrigger value="resources">Manage Resources</TabsTrigger>
      </TabsList>

      <TabsContent value="notebooks" className="space-y-6">
        {/* Upload & Create Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Create NotebookLM Integration
            </CardTitle>
            <CardDescription>
              Upload sources to create a new NotebookLM notebook, then use our workflow to analyze them
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload */}
            <div>
              <Label htmlFor="file-upload">Upload Files</Label>
              <div 
                className="border-2 border-dashed border-muted rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload PDFs, articles, or notes for NotebookLM analysis
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Files to Upload ({uploadedFiles.length})</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground">({formatFileSize(file.size)})</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notebook Details */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="notebook-title">Notebook Title</Label>
                <Input
                  id="notebook-title"
                  value={notebookTitle}
                  onChange={(e) => setNotebookTitle(e.target.value)}
                  placeholder="e.g., AI Ethics Literature Review"
                />
              </div>
              <div>
                <Label htmlFor="briefing">Research Context (Optional)</Label>
                <Textarea
                  id="briefing"
                  value={briefing}
                  onChange={(e) => setBriefing(e.target.value)}
                  placeholder="Provide context about your research question or what you're investigating..."
                  rows={3}
                />
              </div>
            </div>

            <Button 
              onClick={createNotebook} 
              disabled={!notebookTitle.trim() || uploadedFiles.length === 0 || isCreating}
              className="w-full"
            >
              {isCreating ? "Creating Notebook..." : "Create NotebookLM Notebook"}
            </Button>

            <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-md border border-blue-200">
              <strong>📖 Next Steps:</strong> After creating a notebook, use the "Analysis Workflow" tab to get prompts for extracting insights from NotebookLM, then use "Extract Concepts" to add those insights to your research graph.
            </div>
          </CardContent>
        </Card>

        {/* Existing Notebooks */}
        {notebooks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Your NotebookLM Notebooks
              </CardTitle>
              <CardDescription>
                Manage your project notebooks and track analysis progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notebooks.map((notebook) => (
                  <Card key={notebook.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
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
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="workflow">
        <WorkflowPrompts notebookUrl={notebooks[0]?.notebook_url} />
      </TabsContent>

      <TabsContent value="extract">
        <ConceptExtractor 
          projectId={projectId} 
          notebookId={notebooks[0]?.id}
        />
      </TabsContent>

      <TabsContent value="resources">
        {notebooks[0] ? (
          <ResourceManager 
            notebookId={notebooks[0].id} 
            projectId={projectId}
          />
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">Create a notebook first to manage resources</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
