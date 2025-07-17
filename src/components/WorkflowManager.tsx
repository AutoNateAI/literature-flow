import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, FileText, Calendar, Target, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Workflow {
  id: string;
  title: string;
  description: string;
  funding_agency: string;
  deadline: string;
  amount: string;
  progress: number;
  created_at: string;
  updated_at: string;
}

interface WorkflowManagerProps {
  onSelectWorkflow: (workflowId: string) => void;
}

export const WorkflowManager = ({ onSelectWorkflow }: WorkflowManagerProps) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    title: "",
    description: "",
    funding_agency: "",
    deadline: "",
    amount: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('user_workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedWorkflows = data?.map(workflow => ({
        id: workflow.id,
        title: (workflow.workflow_data as any)?.title || 'Untitled Grant',
        description: (workflow.workflow_data as any)?.description || '',
        funding_agency: (workflow.workflow_data as any)?.funding_agency || '',
        deadline: (workflow.workflow_data as any)?.deadline || '',
        amount: (workflow.workflow_data as any)?.amount || '',
        progress: (workflow.workflow_data as any)?.progress || 0,
        created_at: workflow.created_at,
        updated_at: workflow.updated_at
      })) || [];

      setWorkflows(formattedWorkflows);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast({
        title: "Error",
        description: "Failed to load workflows",
        variant: "destructive"
      });
    }
  };

  const createWorkflow = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be signed in to create workflows",
          variant: "destructive"
        });
        return;
      }

      const workflowData = {
        ...newWorkflow,
        progress: 0,
        steps_completed: [],
        current_step: 1
      };

      const { error } = await supabase
        .from('user_workflows')
        .insert({
          user_id: user.id,
          workflow_data: workflowData
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Grant workflow created successfully"
      });

      setIsCreateDialogOpen(false);
      setNewWorkflow({
        title: "",
        description: "",
        funding_agency: "",
        deadline: "",
        amount: ""
      });
      fetchWorkflows();
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast({
        title: "Error",
        description: "Failed to create workflow",
        variant: "destructive"
      });
    }
  };

  const deleteWorkflow = async (workflowId: string) => {
    try {
      const { error } = await supabase
        .from('user_workflows')
        .delete()
        .eq('id', workflowId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Workflow deleted successfully"
      });
      fetchWorkflows();
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast({
        title: "Error",
        description: "Failed to delete workflow",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (progress: number) => {
    if (progress === 0) return "bg-gray-500";
    if (progress < 50) return "bg-orange-500";
    if (progress < 100) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStatusText = (progress: number) => {
    if (progress === 0) return "Not Started";
    if (progress < 50) return "In Progress";
    if (progress < 100) return "Near Completion";
    return "Completed";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">My Grant Workflows</h2>
          <p className="text-muted-foreground">Manage your grant writing projects</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Grant Workflow
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Grant Workflow</DialogTitle>
              <DialogDescription>
                Start tracking a new grant application process
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Grant Title</Label>
                <Input
                  id="title"
                  value={newWorkflow.title}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., NIH R01 Research Grant"
                />
              </div>
              <div>
                <Label htmlFor="funding_agency">Funding Agency</Label>
                <Input
                  id="funding_agency"
                  value={newWorkflow.funding_agency}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, funding_agency: e.target.value }))}
                  placeholder="e.g., National Institutes of Health"
                />
              </div>
              <div>
                <Label htmlFor="amount">Grant Amount</Label>
                <Input
                  id="amount"
                  value={newWorkflow.amount}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="e.g., $500,000"
                />
              </div>
              <div>
                <Label htmlFor="deadline">Application Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={newWorkflow.deadline}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of your research project..."
                />
              </div>
              <Button onClick={createWorkflow} className="w-full">
                Create Workflow
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {workflows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Grant Workflows Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first grant workflow to start tracking your application progress
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="relative group">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{workflow.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {workflow.funding_agency}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteWorkflow(workflow.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className={`${getStatusColor(workflow.progress)} text-white`}>
                    {getStatusText(workflow.progress)}
                  </Badge>
                  {workflow.amount && (
                    <Badge variant="secondary">{workflow.amount}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflow.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {workflow.description}
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{workflow.progress}%</span>
                    </div>
                    <Progress value={workflow.progress} className="h-2" />
                  </div>

                  {workflow.deadline && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      Due: {new Date(workflow.deadline).toLocaleDateString()}
                    </div>
                  )}

                  <Button 
                    onClick={() => onSelectWorkflow(workflow.id)}
                    className="w-full"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Continue Workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};