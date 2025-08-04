import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BookOpen, 
  ExternalLink, 
  Edit2, 
  Save, 
  X, 
  Plus, 
  FileText, 
  Tags,
  TrendingUp,
  CheckCircle,
  XCircle,
  Minus
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NotebookManagerProps {
  projectId: string;
}

interface Notebook {
  id: string;
  title: string;
  briefing: string;
  upload_count: number;
  notebook_url?: string;
  created_at: string;
  updated_at: string;
}

interface Passage {
  id: string;
  title: string;
  content: string;
  tags: string[];
  source_file?: string;
  page_number?: number;
  created_at: string;
}

interface Claim {
  id: string;
  content: string;
  claim_type: string;
  confidence_score: number;
  tags: string[];
  source_text?: string;
  created_at: string;
}

export function NotebookManager({ projectId }: NotebookManagerProps) {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebook, setSelectedNotebook] = useState<string | null>(null);
  const [passages, setPassages] = useState<Passage[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [editingNotebook, setEditingNotebook] = useState<string | null>(null);
  const [editData, setEditData] = useState({ title: '', briefing: '' });
  const [newPassage, setNewPassage] = useState({
    title: '',
    content: '',
    tags: '',
    source_file: '',
    page_number: ''
  });
  const [newClaim, setNewClaim] = useState({
    content: '',
    claim_type: 'evidence',
    confidence_score: 0.5,
    tags: '',
    source_text: ''
  });
  const [showAddPassage, setShowAddPassage] = useState(false);
  const [showAddClaim, setShowAddClaim] = useState(false);
  const { user } = useAuth();

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

  const fetchPassages = async (notebookId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('passages')
        .select('*')
        .eq('notebook_id', notebookId)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPassages(data || []);
    } catch (error) {
      console.error("Error fetching passages:", error);
    }
  };

  const fetchClaims = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('claims')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClaims(data || []);
    } catch (error) {
      console.error("Error fetching claims:", error);
    }
  };

  const updateNotebook = async (notebookId: string) => {
    try {
      const { error } = await supabase
        .from('notebooks')
        .update({
          title: editData.title,
          briefing: editData.briefing
        })
        .eq('id', notebookId);

      if (error) throw error;

      setEditingNotebook(null);
      fetchNotebooks();
      toast.success("Notebook updated");
    } catch (error) {
      console.error("Error updating notebook:", error);
      toast.error("Failed to update notebook");
    }
  };

  const addPassage = async () => {
    if (!user || !selectedNotebook || !newPassage.title.trim()) {
      toast.error("Please provide a title for the passage");
      return;
    }

    try {
      const { error } = await supabase
        .from('passages')
        .insert({
          notebook_id: selectedNotebook,
          project_id: projectId,
          title: newPassage.title,
          content: newPassage.content,
          tags: newPassage.tags ? newPassage.tags.split(',').map(t => t.trim()) : [],
          source_file: newPassage.source_file || null,
          page_number: newPassage.page_number ? parseInt(newPassage.page_number) : null
        });

      if (error) throw error;

      setNewPassage({ title: '', content: '', tags: '', source_file: '', page_number: '' });
      setShowAddPassage(false);
      fetchPassages(selectedNotebook);
      toast.success("Passage added");
    } catch (error) {
      console.error("Error adding passage:", error);
      toast.error("Failed to add passage");
    }
  };

  const addClaim = async () => {
    if (!user || !newClaim.content.trim()) {
      toast.error("Please provide content for the claim");
      return;
    }

    try {
      const { error } = await supabase
        .from('claims')
        .insert({
          project_id: projectId,
          user_id: user.id,
          passage_id: null, // Will be linked manually
          content: newClaim.content,
          claim_type: newClaim.claim_type,
          confidence_score: newClaim.confidence_score,
          tags: newClaim.tags ? newClaim.tags.split(',').map(t => t.trim()) : [],
          source_text: newClaim.source_text || null
        });

      if (error) throw error;

      setNewClaim({
        content: '',
        claim_type: 'evidence',
        confidence_score: 0.5,
        tags: '',
        source_text: ''
      });
      setShowAddClaim(false);
      fetchClaims();
      toast.success("Claim added");
    } catch (error) {
      console.error("Error adding claim:", error);
      toast.error("Failed to add claim");
    }
  };

  const getClaimTypeColor = (type: string) => {
    switch (type) {
      case 'evidence': return 'bg-green-100 text-green-800';
      case 'counterargument': return 'bg-red-100 text-red-800';
      case 'methodology': return 'bg-blue-100 text-blue-800';
      case 'finding': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceIcon = (score: number) => {
    if (score >= 0.7) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (score >= 0.4) return <Minus className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  useEffect(() => {
    fetchNotebooks();
    fetchClaims();
  }, [projectId, user]);

  useEffect(() => {
    if (selectedNotebook) {
      fetchPassages(selectedNotebook);
    }
  }, [selectedNotebook]);

  return (
    <div className="space-y-6">
      {/* Notebooks List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Project Notebooks
          </CardTitle>
          <CardDescription>
            Manage NotebookLM notebooks linked to this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notebooks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No notebooks found. Create one from the upload section.
            </p>
          ) : (
            <div className="grid gap-4">
              {notebooks.map((notebook) => (
                <div
                  key={notebook.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedNotebook === notebook.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedNotebook(notebook.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {editingNotebook === notebook.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editData.title}
                            onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Notebook title"
                          />
                          <Textarea
                            value={editData.briefing}
                            onChange={(e) => setEditData(prev => ({ ...prev, briefing: e.target.value }))}
                            placeholder="Briefing"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => updateNotebook(notebook.id)}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setEditingNotebook(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h4 className="font-medium">{notebook.title}</h4>
                          {notebook.briefing && (
                            <p className="text-sm text-muted-foreground mt-1">{notebook.briefing}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{notebook.upload_count} files</span>
                            <span>Created {new Date(notebook.created_at).toLocaleDateString()}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {notebook.notebook_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={notebook.notebook_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingNotebook(notebook.id);
                          setEditData({ title: notebook.title, briefing: notebook.briefing });
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notebook Details */}
      {selectedNotebook && (
        <Tabs defaultValue="passages" className="space-y-4">
          <TabsList>
            <TabsTrigger value="passages">Passages</TabsTrigger>
            <TabsTrigger value="claims">Claims</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="passages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Passages</span>
                  <Button onClick={() => setShowAddPassage(!showAddPassage)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Passage
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {showAddPassage && (
                  <div className="p-4 border rounded-lg space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={newPassage.title}
                          onChange={(e) => setNewPassage(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Passage title"
                        />
                      </div>
                      <div>
                        <Label>Tags (comma-separated)</Label>
                        <Input
                          value={newPassage.tags}
                          onChange={(e) => setNewPassage(prev => ({ ...prev, tags: e.target.value }))}
                          placeholder="e.g., methodology, bias, LLMs"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Content</Label>
                      <Textarea
                        value={newPassage.content}
                        onChange={(e) => setNewPassage(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Passage content or summary"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Source File</Label>
                        <Input
                          value={newPassage.source_file}
                          onChange={(e) => setNewPassage(prev => ({ ...prev, source_file: e.target.value }))}
                          placeholder="e.g., smith_2023.pdf"
                        />
                      </div>
                      <div>
                        <Label>Page Number</Label>
                        <Input
                          type="number"
                          value={newPassage.page_number}
                          onChange={(e) => setNewPassage(prev => ({ ...prev, page_number: e.target.value }))}
                          placeholder="Page number"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={addPassage}>Add Passage</Button>
                      <Button variant="outline" onClick={() => setShowAddPassage(false)}>Cancel</Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {passages.map((passage) => (
                    <div key={passage.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium">{passage.title}</h5>
                          {passage.content && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {passage.content.substring(0, 200)}...
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {passage.tags?.map((tag) => (
                              <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {passage.source_file && <span>{passage.source_file}</span>}
                            {passage.page_number && <span>Page {passage.page_number}</span>}
                            <span>{new Date(passage.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="claims" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Claims & Evidence</span>
                  <Button onClick={() => setShowAddClaim(!showAddClaim)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Claim
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {showAddClaim && (
                  <div className="p-4 border rounded-lg space-y-4">
                    <div>
                      <Label>Claim Content</Label>
                      <Textarea
                        value={newClaim.content}
                        onChange={(e) => setNewClaim(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Describe the claim or evidence"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Claim Type</Label>
                        <Select value={newClaim.claim_type} onValueChange={(value) => setNewClaim(prev => ({ ...prev, claim_type: value }))}>
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
                      <div>
                        <Label>Confidence Score (0-1)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={newClaim.confidence_score}
                          onChange={(e) => setNewClaim(prev => ({ ...prev, confidence_score: parseFloat(e.target.value) }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Tags (comma-separated)</Label>
                      <Input
                        value={newClaim.tags}
                        onChange={(e) => setNewClaim(prev => ({ ...prev, tags: e.target.value }))}
                        placeholder="e.g., bias, accuracy, performance"
                      />
                    </div>
                    <div>
                      <Label>Source Text (optional)</Label>
                      <Textarea
                        value={newClaim.source_text}
                        onChange={(e) => setNewClaim(prev => ({ ...prev, source_text: e.target.value }))}
                        placeholder="Original text supporting this claim"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={addClaim}>Add Claim</Button>
                      <Button variant="outline" onClick={() => setShowAddClaim(false)}>Cancel</Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {claims.map((claim) => (
                    <div key={claim.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getClaimTypeColor(claim.claim_type)}>
                              {claim.claim_type}
                            </Badge>
                            {getConfidenceIcon(claim.confidence_score)}
                            <span className="text-xs text-muted-foreground">
                              {Math.round(claim.confidence_score * 100)}% confidence
                            </span>
                          </div>
                          <p className="text-sm">{claim.content}</p>
                          {claim.source_text && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              "{claim.source_text.substring(0, 150)}..."
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {claim.tags?.map((tag) => (
                              <Badge key={tag} variant="outline">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Auto-Generated Insights
                </CardTitle>
                <CardDescription>
                  Summary insights generated from NotebookLM analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Insights will be automatically generated from your NotebookLM analysis and displayed here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}