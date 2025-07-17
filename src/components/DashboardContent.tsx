import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, GitBranch, BarChart3, Calendar, CheckCircle2, Clock, TrendingUp, Plus, Target, Star, Zap, LogOut, Copy, Heart, MessageCircle } from "lucide-react";
import { DashboardView } from "@/pages/Dashboard";
import { WorkflowManager } from "@/components/WorkflowManager";
import { WorkflowBuilder } from "@/components/WorkflowBuilder";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Helper function to convert step IDs to readable names
const getStepDisplayName = (stepId: string) => {
  const stepNames: { [key: string]: string } = {
    'research-setup': 'Research Environment Setup',
    'funding-analysis': 'Funding Alignment Analysis', 
    'proposal-structure': 'Proposal Structure Generation',
    'research-narrative': 'Core Research Narrative',
    'background-section': 'Background & Significance',
    'aims-objectives': 'Aims and Objectives',
    'methods-section': 'Methods Section',
    'budget-justification': 'Budget Justification',
    'reviewer-analysis': 'Reviewer Perspective Analysis',
    'visual-assets': 'Visual Asset Development',
    'executive-summary': 'Executive Summary Creation',
    'coherence-check': 'Coherence and Flow Check',
    'final-qa': 'Final Quality Assurance'
  };
  
  return stepNames[stepId] || stepId.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

interface DashboardContentProps {
  onNavigate: (view: DashboardView) => void;
  onSelectWorkflow?: (workflowId: string) => void;
}

export const DashboardContent = ({ onNavigate, onSelectWorkflow }: DashboardContentProps) => {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [showWorkflowManager, setShowWorkflowManager] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [workflowStats, setWorkflowStats] = useState({ total: 0, completed: 0, avgProgress: 0 });
  const [lastWorkflowId, setLastWorkflowId] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [weeklyTasksCompleted, setWeeklyTasksCompleted] = useState(0);
  const [weeklyTaskDetails, setWeeklyTaskDetails] = useState<any[]>([]);
  const { user, signOut } = useAuth();

  useEffect(() => {
    fetchUserProfile();
    fetchWorkflowStats();
    fetchRecentActivity();
    fetchWeeklyTasksCompleted();
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchWorkflowStats = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_workflows')
        .select('id, workflow_data, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching workflows:', error);
        return;
      }

      const workflows = data || [];
      const totalWorkflows = workflows.length;
      const completedWorkflows = workflows.filter(w => (w.workflow_data as any)?.progress === 100).length;
      const avgProgress = workflows.length > 0 
        ? Math.round(workflows.reduce((sum, w) => sum + ((w.workflow_data as any)?.progress || 0), 0) / workflows.length)
        : 0;

      // Set the most recently updated workflow as the last workflow
      if (workflows.length > 0) {
        setLastWorkflowId(workflows[0].id);
      }

      setWorkflowStats({
        total: totalWorkflows,
        completed: completedWorkflows,
        avgProgress
      });
    } catch (error) {
      console.error('Error fetching workflow stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    if (!user) return;
    
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Get user interactions (prompt activities)
      const { data: interactions, error: interactionsError } = await supabase
        .from('user_interactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (interactionsError) {
        console.error('Error fetching user interactions:', interactionsError);
      }

      // Get prompts and templates for metadata lookup
      const [promptsResult, templatesResult] = await Promise.all([
        supabase.from('prompts').select('id, title, category').limit(100),
        supabase.from('templates').select('id, title, category').limit(100)
      ]);

      // Create maps for quick lookup
      const promptsMap = new Map();
      const templatesMap = new Map();
      
      promptsResult.data?.forEach(prompt => {
        promptsMap.set(prompt.id, { title: prompt.title, category: prompt.category });
      });
      
      templatesResult.data?.forEach(template => {
        templatesMap.set(template.id, { title: template.title, category: template.category });
      });

      // Get workflow activities (for workflow task completion)
      const { data: workflows, error: workflowsError } = await supabase
        .from('user_workflows')
        .select('id, updated_at, workflow_data')
        .eq('user_id', user.id)
        .gte('updated_at', sevenDaysAgo.toISOString())
        .order('updated_at', { ascending: false })
        .limit(5);

      if (workflowsError) {
        console.error('Error fetching workflow activities:', workflowsError);
      }

      // Create a map of step IDs to workflow info for easier lookup
      const stepToWorkflowMap = new Map();
      
      // For each workflow, map all its completed steps to the workflow info
      workflows?.forEach(workflow => {
        const workflowData = workflow.workflow_data as any;
        const stepsCompleted = workflowData?.steps_completed || [];
        stepsCompleted.forEach((stepId: string) => {
          stepToWorkflowMap.set(stepId, {
            workflowId: workflow.id,
            workflowName: workflowData?.name || workflowData?.title || 'Grant Workflow',
            workflowType: workflowData?.funding_agency || 'Grant'
          });
        });
      });

      // Combine and format activities with enhanced metadata
      const allActivities = [
        ...(interactions || []).map(interaction => {
          let metadata = {};
          
          // For workflow step completions, get workflow info from step mapping
          if (interaction.interaction_type === 'workflow_step_completed' && interaction.item_id) {
            const workflowInfo = stepToWorkflowMap.get(interaction.item_id);
            if (workflowInfo) {
              metadata = {
                workflowName: workflowInfo.workflowName,
                stepName: getStepDisplayName(interaction.item_id),
                workflowType: workflowInfo.workflowType
              };
            } else {
              // Fallback: try to get a readable step name
              metadata = {
                stepName: getStepDisplayName(interaction.item_id)
              };
            }
          }
          // For prompt activities
          else if (interaction.item_type === 'prompt' && interaction.item_id) {
            const promptInfo = promptsMap.get(interaction.item_id);
            if (promptInfo) {
              metadata = {
                title: promptInfo.title,
                category: promptInfo.category
              };
            }
          }
          // For template activities  
          else if (interaction.item_type === 'template' && interaction.item_id) {
            const templateInfo = templatesMap.get(interaction.item_id);
            if (templateInfo) {
              metadata = {
                title: templateInfo.title,
                category: templateInfo.category
              };
            }
          }
          
          return {
            ...interaction,
            type: 'interaction',
            activity_type: interaction.interaction_type,
            activity_date: interaction.created_at,
            metadata
          };
        }),
        ...(workflows || []).map(workflow => ({
          ...workflow,
          type: 'workflow',
          activity_type: 'workflow_update',
          activity_date: workflow.updated_at,
          metadata: {
            workflowName: (workflow.workflow_data as any)?.name || (workflow.workflow_data as any)?.title || 'Grant Workflow'
          }
        }))
      ].sort((a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime())
       .slice(0, 10);

      setRecentActivity(allActivities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const fetchWeeklyTasksCompleted = async () => {
    if (!user) return;
    
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Get workflow step completions
      const { data, error } = await supabase
        .from('user_interactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('interaction_type', 'workflow_step_completed')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching weekly tasks:', error);
        return;
      }

      // Get all user workflows to map step IDs to workflow info
      const { data: allWorkflows } = await supabase
        .from('user_workflows')
        .select('id, workflow_data')
        .eq('user_id', user.id);

      // Create enhanced task details with workflow metadata
      const enhancedTaskDetails = data?.map(task => {
        let workflowInfo = null;
        
        // Find which workflow this step belongs to
        allWorkflows?.forEach(workflow => {
          const workflowData = workflow.workflow_data as any;
          const stepsCompleted = workflowData?.steps_completed || [];
          if (stepsCompleted.includes(task.item_id)) {
            workflowInfo = {
              workflowId: workflow.id,
              workflowName: workflowData?.name || workflowData?.title || 'Grant Workflow',
              workflowType: workflowData?.funding_agency || 'Grant'
            };
          }
        });

        return {
          ...task,
          workflowInfo
        };
      }) || [];

      setWeeklyTasksCompleted(data?.length || 0);
      setWeeklyTaskDetails(enhancedTaskDetails);
    } catch (error) {
      console.error('Error fetching weekly tasks:', error);
    }
  };

  const handleSelectWorkflow = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    setShowWorkflowManager(false);
  };

  const handleBackToManager = () => {
    setShowWorkflowManager(true);
    setSelectedWorkflowId(null);
  };

  if (!showWorkflowManager && selectedWorkflowId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBackToManager}>
              ← Back to Workflows
            </Button>
            <h1 className="text-2xl font-bold">Grant Writing Workflow</h1>
          </div>
          <Button variant="outline" onClick={() => signOut()}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
        <WorkflowBuilder workflowId={selectedWorkflowId} />
      </div>
    );
  }

  if (!showWorkflowManager) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Grant Workflows</h1>
          <Button variant="outline" onClick={() => signOut()}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
        <WorkflowManager onSelectWorkflow={handleSelectWorkflow} />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground space-y-8">
      {/* Header with user info and sign out */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {userProfile?.display_name || 'Researcher'}!
          </h1>
          <p className="text-xl text-muted-foreground">
            Continue your grant writing mastery journey
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <Button variant="outline" onClick={() => signOut()}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workflow Progress</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{workflowStats.completed} of {workflowStats.total} workflows completed</span>
              </div>
              <Progress value={workflowStats.total > 0 ? (workflowStats.completed / workflowStats.total) * 100 : 0} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Dialog>
          <DialogTrigger asChild>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200/20 cursor-pointer hover:bg-purple-500/5 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasks This Week</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">{weeklyTasksCompleted} tasks</div>
                <p className="text-xs text-muted-foreground">Workflow steps completed</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-500" />
                Workflow Tasks Completed This Week
              </DialogTitle>
              <DialogDescription>
                All workflow steps you've completed in the last 7 days
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {weeklyTaskDetails.length > 0 ? (
                weeklyTaskDetails.map((task, index) => {
                  const stepName = getStepDisplayName(task.item_id);
                  
                  return (
                    <div key={task.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                      <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0 bg-green-500"></div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="font-medium text-sm">Completed: {stepName}</span>
                        </div>
                        {task.workflowInfo && (
                          <div className="flex items-center gap-2">
                            <span className="text-blue-400 text-sm">
                              {task.workflowInfo.workflowName}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              ({task.workflowInfo.workflowType})
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(task.created_at).toLocaleDateString()} at {new Date(task.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No workflow tasks completed this week yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">Start working on your grant workflows to see your progress here!</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <>
                <div className="text-sm font-medium text-blue-400">
                  {recentActivity[0].activity_type === 'copy' ? 'Copied prompt' :
                   recentActivity[0].activity_type === 'like' ? 'Liked content' :
                   recentActivity[0].activity_type === 'comment' ? 'Added comment' :
                   recentActivity[0].activity_type === 'favorite' ? 'Favorited prompt' :
                   recentActivity[0].activity_type === 'workflow_update' ? 'Updated workflow' :
                   'Recent activity'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(recentActivity[0].activity_date).toLocaleDateString()}
                </p>
              </>
            ) : (
              <>
                <div className="text-sm font-medium text-blue-400">No recent activity</div>
                <p className="text-xs text-muted-foreground">Start exploring prompts</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card 
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer hover:shadow-lg transition-all" 
          onClick={() => {
            if (lastWorkflowId && onSelectWorkflow) {
              onSelectWorkflow(lastWorkflowId);
              onNavigate('workflow');
            } else {
              onNavigate('manage-workflows');
            }
          }}
        >
          <CardContent className="p-6 text-center">
            <GitBranch className="h-8 w-8 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Continue Current Workflow</h3>
            <p className="text-blue-100 text-sm">{lastWorkflowId ? 'Continue your grant writing process' : 'Select a workflow to continue'}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer hover:shadow-lg transition-all" onClick={() => onNavigate('manage-workflows')}>
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">View Workflows</h3>
            <p className="text-blue-100 text-sm">Manage your grant projects</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer hover:shadow-lg transition-all" onClick={() => onNavigate('prompts')}>
          <CardContent className="p-6 text-center">
            <BookOpen className="h-8 w-8 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Browse Prompts</h3>
            <p className="text-blue-100 text-sm">Access our AI prompt library</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={`${activity.type}-${activity.id}-${index}`} className="flex items-start space-x-4">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.activity_type === 'copy' ? 'bg-blue-500' :
                    activity.activity_type === 'like' ? 'bg-green-500' :
                    activity.activity_type === 'comment' ? 'bg-purple-500' :
                    activity.activity_type === 'favorite' ? 'bg-red-500' :
                    activity.activity_type === 'workflow_update' ? 'bg-orange-500' :
                    'bg-gray-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm">
                      {activity.activity_type === 'copy' ? 'Copied' :
                       activity.activity_type === 'like' ? 'Liked' :
                       activity.activity_type === 'comment' ? 'Commented on' :
                       activity.activity_type === 'favorite' ? 'Favorited' :
                       activity.activity_type === 'workflow_update' ? 'Updated' :
                       activity.activity_type === 'workflow_step_completed' ? 'Completed' :
                       'Interacted with'} {
                        activity.activity_type === 'workflow_step_completed' ? 'step in' :
                        activity.type === 'workflow' ? 'workflow' : 
                        activity.item_type || 'content'
                      }
                      {/* Workflow metadata */}
                      {(activity.type === 'workflow' || activity.activity_type === 'workflow_step_completed') && activity.metadata?.workflowName && (
                        <span className="text-blue-400 ml-1">
                          {activity.metadata.workflowName}
                        </span>
                      )}
                      {/* Prompt/Template metadata */}
                      {(activity.item_type === 'prompt' || activity.item_type === 'template') && activity.metadata?.title && (
                        <span className="text-blue-400 ml-1">
                          "{activity.metadata.title}"
                        </span>
                      )}
                      {activity.activity_type === 'workflow_step_completed' && activity.metadata?.stepName && (
                        <span className="text-muted-foreground ml-1 text-xs">
                          ({activity.metadata.stepName})
                        </span>
                      )}
                      {/* Category for prompts/templates */}
                      {(activity.item_type === 'prompt' || activity.item_type === 'template') && activity.metadata?.category && (
                        <span className="text-muted-foreground ml-1 text-xs">
                          in {activity.metadata.category}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.activity_date).toLocaleDateString()} at {new Date(activity.activity_date).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No recent activity in the last 7 days.</p>
                <p className="text-sm text-muted-foreground mt-2">Start exploring prompts to see your activity here!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};