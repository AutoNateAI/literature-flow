import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Trash2, ExternalLink, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ResourceManagerProps {
  notebookId: string;
  projectId: string;
}

interface Resource {
  id: string;
  title: string;
  file_type: string;
  file_size: string;
  source_url?: string;
  created_at: string;
}

export function ResourceManager({ notebookId, projectId }: ResourceManagerProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [newResource, setNewResource] = useState({
    title: "",
    file_type: "",
    file_size: "",
    source_url: ""
  });
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchResources();
  }, [notebookId]);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('notebook_resources')
        .select('*')
        .eq('notebook_id', notebookId)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error("Error fetching resources:", error);
      toast.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  const addResource = async () => {
    if (!user || !newResource.title.trim()) {
      toast.error("Please provide a resource title");
      return;
    }

    setIsAdding(true);

    try {
      const { error } = await supabase
        .from('notebook_resources')
        .insert({
          notebook_id: notebookId,
          project_id: projectId,
          user_id: user.id,
          title: newResource.title,
          file_type: newResource.file_type,
          file_size: newResource.file_size,
          source_url: newResource.source_url
        });

      if (error) throw error;

      setNewResource({
        title: "",
        file_type: "",
        file_size: "",
        source_url: ""
      });

      fetchResources();
      toast.success("Resource added successfully!");
    } catch (error) {
      console.error("Error adding resource:", error);
      toast.error("Failed to add resource");
    } finally {
      setIsAdding(false);
    }
  };

  const deleteResource = async (resourceId: string) => {
    try {
      const { error } = await supabase
        .from('notebook_resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      setResources(prev => prev.filter(r => r.id !== resourceId));
      toast.success("Resource deleted");
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast.error("Failed to delete resource");
    }
  };

  const getFileTypeColor = (fileType: string) => {
    const colors = {
      'pdf': 'bg-red-100 text-red-800',
      'doc': 'bg-blue-100 text-blue-800',
      'docx': 'bg-blue-100 text-blue-800',
      'txt': 'bg-gray-100 text-gray-800',
      'url': 'bg-green-100 text-green-800'
    };
    return colors[fileType.toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div>Loading resources...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Add New Resource */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Resource to Notebook
          </CardTitle>
          <CardDescription>
            Track the sources you've uploaded to this NotebookLM notebook
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resource-title">Resource Title</Label>
              <Input
                id="resource-title"
                value={newResource.title}
                onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Smith et al. 2023 - AI Ethics Framework"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file-type">File Type</Label>
              <Input
                id="file-type"
                value={newResource.file_type}
                onChange={(e) => setNewResource(prev => ({ ...prev, file_type: e.target.value }))}
                placeholder="e.g., PDF, DOC, URL"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file-size">File Size</Label>
              <Input
                id="file-size"
                value={newResource.file_size}
                onChange={(e) => setNewResource(prev => ({ ...prev, file_size: e.target.value }))}
                placeholder="e.g., 2.5 MB"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source-url">Source URL (Optional)</Label>
              <Input
                id="source-url"
                value={newResource.source_url}
                onChange={(e) => setNewResource(prev => ({ ...prev, source_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
          <Button 
            onClick={addResource} 
            disabled={!newResource.title.trim() || isAdding}
            className="w-full"
          >
            {isAdding ? "Adding Resource..." : "Add Resource"}
          </Button>
        </CardContent>
      </Card>

      {/* Resources List */}
      <Card>
        <CardHeader>
          <CardTitle>Resources in Notebook ({resources.length})</CardTitle>
          <CardDescription>
            Sources that have been uploaded to this NotebookLM notebook
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resources.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Upload className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No resources added yet</p>
              <p className="text-sm">Add the sources you've uploaded to NotebookLM above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {resources.map((resource) => (
                <div key={resource.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <h4 className="font-medium">{resource.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {resource.file_type && (
                          <Badge variant="secondary" className={getFileTypeColor(resource.file_type)}>
                            {resource.file_type.toUpperCase()}
                          </Badge>
                        )}
                        {resource.file_size && (
                          <span className="text-xs text-muted-foreground">{resource.file_size}</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Added {new Date(resource.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {resource.source_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a href={resource.source_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteResource(resource.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}