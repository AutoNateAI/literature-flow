import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BookOpen, FileText, Lightbulb, Trash2, Calendar, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Project {
  id: string;
  title: string;
  hypothesis: string | null;
  paper_type: string;
  theme: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectManagerProps {
  onSelectProject?: (projectId: string) => void;
  onCreateNew: () => void;
}

export function ProjectManager({ onSelectProject, onCreateNew }: ProjectManagerProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(projects.filter(p => p.id !== projectId));
      toast.success("Project deleted successfully");
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error("Failed to delete project");
    }
  };

  const getProjectIcon = (paperType: string) => {
    return paperType === 'research' ? BookOpen : Lightbulb;
  };

  const getProjectTypeLabel = (paperType: string) => {
    return paperType === 'research' ? 'Research Paper' : 'Stand-Alone Paper';
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Manage Projects</h1>
          <p className="text-muted-foreground">Loading your projects...</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Manage Projects</h1>
          <p className="text-muted-foreground">You haven't created any projects yet</p>
        </div>
        
        <Card className="glass-card text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <FileText className="w-6 h-6" />
              No Projects Found
            </CardTitle>
            <CardDescription>
              Start your literature review journey by creating your first project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-muted-foreground">
              Create a new project to begin organizing your research, setting up workflows, and tracking your progress.
            </div>
            <Button onClick={onCreateNew} className="glass-button" size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Projects</h1>
          <p className="text-muted-foreground">View and manage your literature review projects</p>
        </div>
        <Button onClick={onCreateNew} className="glass-button">
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const Icon = getProjectIcon(project.paper_type);
          
          return (
            <Card key={project.id} className="glass-card hover:shadow-lg transition-all flex flex-col">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-primary" />
                    <Badge variant="secondary" className={`text-xs ${
                      project.paper_type === 'research' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {getProjectTypeLabel(project.paper_type)}
                    </Badge>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{project.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteProject(project.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <CardTitle className="text-lg line-clamp-2">{project.title}</CardTitle>
                {project.theme && (
                  <CardDescription>
                    <Badge variant="outline" className="text-xs">
                      {project.theme}
                    </Badge>
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1">
                  {project.hypothesis && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {project.hypothesis}
                    </p>
                  )}
                </div>
                
                <div className="mt-auto space-y-3">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3 mr-1" />
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </div>
                  
                  <Button 
                    onClick={() => onSelectProject?.(project.id)} 
                    className="w-full glass-button"
                    size="sm"
                  >
                    Continue Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}