import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FileText, BookOpen, Lightbulb, ArrowRight, Plus, Trash2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface EntryModuleProps {
  onProjectCreated: (projectId: string) => void;
}

const researchThemes = [
  "Psychology",
  "AI Ethics", 
  "Education",
  "Public Health",
  "Computer Science",
  "Medicine",
  "Environmental Science",
  "Social Sciences",
  "Business & Management",
  "Engineering",
  "Physics",
  "Biology",
  "Chemistry",
  "Other"
];

const resourceTypes = [
  "Research Paper",
  "Book Chapter", 
  "Conference Paper",
  "Journal Article",
  "Thesis/Dissertation",
  "Report",
  "Website/Blog",
  "Other"
];

export function EntryModule({ onProjectCreated }: EntryModuleProps) {
  const { user } = useAuth();
  const [paperType, setPaperType] = useState<'research' | 'standalone'>('research');
  const [title, setTitle] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [theme, setTheme] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // NotebookLM setup
  const [notebooks, setNotebooks] = useState<Array<{
    title: string;
    url: string;
    resources: Array<{ title: string; type: string; }>
  }>>([]);
  
  const addNotebook = () => {
    setNotebooks([...notebooks, { title: '', url: '', resources: [] }]);
  };
  
  const removeNotebook = (index: number) => {
    setNotebooks(notebooks.filter((_, i) => i !== index));
  };
  
  const updateNotebook = (index: number, field: 'title' | 'url', value: string) => {
    const updated = [...notebooks];
    updated[index][field] = value;
    setNotebooks(updated);
  };
  
  const addResource = (notebookIndex: number) => {
    const updated = [...notebooks];
    updated[notebookIndex].resources.push({ title: '', type: 'Research Paper' });
    setNotebooks(updated);
  };
  
  const removeResource = (notebookIndex: number, resourceIndex: number) => {
    const updated = [...notebooks];
    updated[notebookIndex].resources = updated[notebookIndex].resources.filter((_, i) => i !== resourceIndex);
    setNotebooks(updated);
  };
  
  const updateResource = (notebookIndex: number, resourceIndex: number, field: 'title' | 'type', value: string) => {
    const updated = [...notebooks];
    updated[notebookIndex].resources[resourceIndex][field] = value;
    setNotebooks(updated);
  };

  const handleCreateProject = async () => {
    if (!user) {
      toast.error("Please log in to create a project");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a project title");
      return;
    }

    if (paperType === 'research' && !theme) {
      toast.error("Please select a research theme");
      return;
    }

    setIsCreating(true);

    try {
      // Generate structural outline based on theme and paper type
      const structuralOutline = generateOutline(paperType, theme);

      // Create the project first
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: title.trim(),
          hypothesis: hypothesis.trim() || null,
          paper_type: paperType,
          theme: theme || null,
          structural_outline: structuralOutline
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Create notebooks and resources if any
      for (const notebook of notebooks) {
        if (notebook.title.trim() && notebook.url.trim()) {
          const { data: notebookData, error: notebookError } = await supabase
            .from('notebooks')
            .insert({
              project_id: projectData.id,
              user_id: user.id,
              title: notebook.title.trim(),
              notebook_url: notebook.url.trim()
            })
            .select()
            .single();

          if (notebookError) throw notebookError;

          // Add resources for this notebook
          for (const resource of notebook.resources) {
            if (resource.title.trim()) {
              const { error: resourceError } = await supabase
                .from('notebook_resources')
                .insert({
                  notebook_id: notebookData.id,
                  project_id: projectData.id,
                  user_id: user.id,
                  title: resource.title.trim(),
                  file_type: resource.type
                });

              if (resourceError) throw resourceError;
            }
          }
        }
      }

      // Create corresponding user_workflow record
      const { data: workflowData, error: workflowError } = await supabase
        .from('user_workflows')
        .insert({
          id: projectData.id, // Use the same ID as the project
          user_id: user.id,
          workflow_data: {
            project_id: projectData.id,
            title: title.trim(),
            paper_type: paperType,
            theme: theme || null,
            steps_completed: [],
            progress: 0,
            created_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (workflowError) throw workflowError;

      toast.success("Project created successfully!");
      onProjectCreated(projectData.id);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error("Failed to create project. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const generateOutline = (type: 'research' | 'standalone', selectedTheme: string) => {
    if (type === 'research') {
      return {
        sections: [
          { id: 'introduction', title: 'Introduction', order: 1 },
          { id: 'literature_review', title: 'Literature Review', order: 2 },
          { id: 'methodology', title: 'Methodology', order: 3 },
          { id: 'analysis', title: 'Analysis & Findings', order: 4 },
          { id: 'discussion', title: 'Discussion', order: 5 },
          { id: 'conclusion', title: 'Conclusion', order: 6 }
        ],
        theme: selectedTheme,
        focus_areas: getThemeFocusAreas(selectedTheme)
      };
    } else {
      return {
        sections: [
          { id: 'introduction', title: 'Introduction', order: 1 },
          { id: 'background', title: 'Background & Context', order: 2 },
          { id: 'main_argument', title: 'Main Argument/Analysis', order: 3 },
          { id: 'synthesis', title: 'Synthesis', order: 4 },
          { id: 'conclusion', title: 'Conclusion', order: 5 }
        ],
        type: 'standalone'
      };
    }
  };

  const getThemeFocusAreas = (selectedTheme: string) => {
    const focusMap: Record<string, string[]> = {
      'Psychology': ['Cognitive processes', 'Behavioral patterns', 'Mental health', 'Social psychology'],
      'AI Ethics': ['Algorithmic bias', 'Privacy concerns', 'Transparency', 'Societal impact'],
      'Education': ['Learning methodologies', 'Educational technology', 'Student outcomes', 'Pedagogical approaches'],
      'Public Health': ['Disease prevention', 'Health policy', 'Epidemiology', 'Community health'],
      'Computer Science': ['Algorithms', 'Software engineering', 'Data structures', 'System design'],
      'Medicine': ['Clinical research', 'Treatment efficacy', 'Patient outcomes', 'Medical technology'],
      'Environmental Science': ['Climate change', 'Sustainability', 'Conservation', 'Environmental policy'],
      'Social Sciences': ['Social behavior', 'Cultural studies', 'Demographics', 'Social policy'],
      'Business & Management': ['Strategy', 'Operations', 'Leadership', 'Organizational behavior'],
      'Engineering': ['Design principles', 'Innovation', 'Technology development', 'System optimization']
    };
    return focusMap[selectedTheme] || ['Research methodology', 'Data analysis', 'Theoretical framework'];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold gradient-text">Start Your Literature Review</h1>
        <p className="text-xl text-muted-foreground">
          Choose your paper type and get AI-powered guidance throughout your research journey
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Select Paper Type
          </CardTitle>
          <CardDescription>
            Choose the type of paper you're working on to get customized workflow templates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Paper Type Toggle */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Paper Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className={`p-3 md:p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  paperType === 'research' 
                    ? 'border-primary bg-primary/10 shadow-lg' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setPaperType('research')}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Switch 
                    checked={paperType === 'research'} 
                    onChange={() => setPaperType('research')}
                  />
                  <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="font-medium text-sm md:text-base">Research Paper</span>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Multi-source literature-based research with systematic analysis
                </p>
              </div>

              <div 
                className={`p-3 md:p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  paperType === 'standalone' 
                    ? 'border-primary bg-primary/10 shadow-lg' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setPaperType('standalone')}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Switch 
                    checked={paperType === 'standalone'} 
                    onChange={() => setPaperType('standalone')}
                  />
                  <Lightbulb className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="font-medium text-sm md:text-base">Stand-Alone Paper</span>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Synthesis, review, or opinion piece with focused analysis
                </p>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                placeholder="Enter your research question or paper title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="glass-input"
              />
            </div>

            {paperType === 'research' && (
              <div className="space-y-2">
                <Label htmlFor="theme">Research Theme *</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="Select your research domain" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border shadow-lg z-50" side="bottom" align="start">
                    {researchThemes.map((themeOption) => (
                      <SelectItem key={themeOption} value={themeOption}>
                        {themeOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="hypothesis">
                Hypothesis {paperType === 'standalone' && '(Optional)'}
              </Label>
              <Textarea
                id="hypothesis"
                placeholder={
                  paperType === 'research' 
                    ? "State your research hypothesis or main research question"
                    : "Optional: Describe your main argument or thesis (for opinion/synthesis papers)"
                }
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                className="glass-input min-h-[100px]"
              />
            </div>
          </div>

          {/* NotebookLM Integration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">NotebookLM Sources (Optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addNotebook}
                className="glass-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Notebook
              </Button>
            </div>
            
            {notebooks.map((notebook, notebookIndex) => (
              <Card key={notebookIndex} className="glass-card border-border/50">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Notebook {notebookIndex + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNotebook(notebookIndex)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Notebook Title</Label>
                      <Input
                        placeholder="e.g., AI Ethics Literature"
                        value={notebook.title}
                        onChange={(e) => updateNotebook(notebookIndex, 'title', e.target.value)}
                        className="glass-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        NotebookLM URL
                        <ExternalLink className="w-3 h-3" />
                      </Label>
                      <Input
                        placeholder="https://notebooklm.google.com/..."
                        value={notebook.url}
                        onChange={(e) => updateNotebook(notebookIndex, 'url', e.target.value)}
                        className="glass-input"
                      />
                    </div>
                  </div>
                  
                  {/* Resources */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Resources in this Notebook</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addResource(notebookIndex)}
                        className="glass-button text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Resource
                      </Button>
                    </div>
                    
                    {notebook.resources.map((resource, resourceIndex) => (
                      <div key={resourceIndex} className="flex items-center gap-2 p-2 rounded border border-border/30">
                        <Input
                          placeholder="Resource title"
                          value={resource.title}
                          onChange={(e) => updateResource(notebookIndex, resourceIndex, 'title', e.target.value)}
                          className="glass-input text-sm"
                        />
                        <Select 
                          value={resource.type} 
                          onValueChange={(value) => updateResource(notebookIndex, resourceIndex, 'type', value)}
                        >
                          <SelectTrigger className="glass-input w-[140px] text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {resourceTypes.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeResource(notebookIndex, resourceIndex)}
                          className="text-destructive hover:text-destructive p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button 
            onClick={handleCreateProject}
            disabled={isCreating || !title.trim() || (paperType === 'research' && !theme)}
            className="w-full glass-button"
            size="lg"
          >
            {isCreating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Creating Project...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Create Project & Continue
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}