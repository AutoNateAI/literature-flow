import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FileText, BookOpen, Lightbulb, ArrowRight } from "lucide-react";
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

export function EntryModule({ onProjectCreated }: EntryModuleProps) {
  const { user } = useAuth();
  const [paperType, setPaperType] = useState<'research' | 'standalone'>('research');
  const [title, setTitle] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [theme, setTheme] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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

      const { data, error } = await supabase
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

      if (error) throw error;

      toast.success("Project created successfully!");
      onProjectCreated(data.id);
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
            <div className="grid grid-cols-2 gap-4">
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
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
                  <BookOpen className="w-5 h-5" />
                  <span className="font-medium">Research Paper</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Multi-source literature-based research with systematic analysis
                </p>
              </div>

              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
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
                  <Lightbulb className="w-5 h-5" />
                  <span className="font-medium">Stand-Alone Paper</span>
                </div>
                <p className="text-sm text-muted-foreground">
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