import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Copy, CheckCircle, Circle, ArrowRight, Lightbulb, FileText, Clock, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  phase: string;
  estimatedTime: string;
  isCompleted: boolean;
  prompts?: string[];
  templates?: string[];
  content?: string;
  tips?: string[];
}

interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
}

interface Template {
  id: string;
  title: string;
  content: string;
  category: string;
}

const workflowSteps: WorkflowStep[] = [
  {
    id: "research-setup",
    title: "Research Environment Setup",
    description: "Create a dedicated workspace and import relevant documents",
    phase: "Preparation",
    estimatedTime: "30 minutes",
    isCompleted: false,
    content: `Create a dedicated workspace in NotebookLM or similar tool and import:
• Previous successful grant examples
• Funder guidelines and priorities  
• Your preliminary data and publications
• Any feedback from previous submissions`,
    tips: [
      "Organize all documents in a single workspace for easy access",
      "Use consistent naming conventions for your files",
      "Keep original guidelines documents separate from your working drafts"
    ]
  },
  {
    id: "funding-analysis",
    title: "Funding Alignment Analysis",
    description: "Analyze how your research aligns with the funder's priorities",
    phase: "Preparation", 
    estimatedTime: "45 minutes",
    isCompleted: false,
    content: `Use AI to analyze the alignment between your research and the funder's priorities. This critical step ensures your proposal speaks the funder's language and addresses their specific interests.

**Use this prompt:**

Analyze my research focus on [YOUR TOPIC] and the priorities of [FUNDING AGENCY] as described in the following guidelines: [PASTE GUIDELINES]. 
Identify:
1. 3-5 key alignment points between my research and their priorities
2. Potential gaps or misalignments I should address
3. Specific terminology and frameworks the funder values`,
    tips: [
      "Focus on terminology the funder uses in their guidelines",
      "Identify specific programs or initiatives your work supports",
      "Note any recent announcements or priority shifts from the funder"
    ]
  },
  {
    id: "proposal-structure",
    title: "Proposal Structure Generation", 
    description: "Create a tailored outline based on funder guidelines",
    phase: "Strategic Planning",
    estimatedTime: "30 minutes",
    isCompleted: false,
    content: `Generate a customized proposal structure that follows the funder's specific requirements while highlighting your research strengths.

**Use this prompt:**

Based on these [FUNDER] guidelines, create a detailed outline for my grant proposal on [RESEARCH TOPIC]. Include:
1. All required sections with word/page count allocations
2. Key points to emphasize in each section
3. Suggested data visualization opportunities
4. References to preliminary data I should include`,
    tips: [
      "Pay attention to word/page limits for each section",
      "Note required vs. optional sections",
      "Plan for visual elements and data presentations"
    ]
  },
  {
    id: "research-narrative",
    title: "Develop Core Research Narrative",
    description: "Craft a compelling story that connects problem to solution",
    phase: "Strategic Planning",
    estimatedTime: "60 minutes", 
    isCompleted: false,
    content: `Develop the central narrative that will thread through your entire proposal, connecting the significance of the problem to your innovative solution.

**Use this prompt:**

Help me craft a compelling 2-paragraph research narrative for a [FUNDER] grant that:
1. Establishes the significance of [PROBLEM]
2. Identifies the gap in current approaches
3. Introduces my innovative approach using [YOUR METHOD]
4. Emphasizes potential impact in terms that align with [FUNDER]'s priorities`,
    tips: [
      "Start with a hook that grabs reviewer attention",
      "Clearly articulate the gap your research fills",
      "Connect to broader societal or scientific impacts"
    ]
  },
  {
    id: "background-section",
    title: "Background & Significance Section",
    description: "Establish the importance and context of your research",
    phase: "Content Generation",
    estimatedTime: "90 minutes",
    isCompleted: false,
    content: `Draft a compelling background section that establishes the critical importance of your research problem and positions your approach as the logical next step.

**Use this prompt:**

Draft a background and significance section (approximately 500 words) for my grant proposal on [RESEARCH TOPIC] that:
1. Establishes the importance of the problem
2. Summarizes current knowledge and approaches
3. Identifies specific gaps or limitations
4. Explains how my approach addresses these limitations
5. Connects to broader impacts valued by [FUNDER]

Based on these key papers:
[PASTE 3-5 REFERENCE ABSTRACTS]`,
    tips: [
      "Use recent, high-impact citations",
      "Avoid simply summarizing literature - synthesize it",
      "End with a clear statement of the gap you'll address"
    ]
  },
  {
    id: "aims-objectives", 
    title: "Aims and Objectives",
    description: "Define clear, measurable, and achievable research goals",
    phase: "Content Generation",
    estimatedTime: "75 minutes",
    isCompleted: false,
    content: `Create specific aims that are independent, feasible, and collectively address your research question while fitting within the proposed timeframe.

**Use this prompt:**

Based on my research focus [BRIEF DESCRIPTION], generate 3 specific aims for a [FUNDER] grant proposal that:
1. Are clear, measurable, and achievable within [TIMEFRAME]
2. Build logically on each other but aren't dependent on earlier aims' success
3. Align with [FUNDER]'s priorities
4. Collectively address the research question: [QUESTION]

For each aim, include:
- A concise title
- 1-2 sentence overview
- 2-3 specific objectives or tasks`,
    tips: [
      "Each aim should be testable and have clear success metrics",
      "Aims should build on each other but not depend on prior success",
      "Include potential alternative approaches for risky elements"
    ]
  },
  {
    id: "methods-section",
    title: "Methods Section",
    description: "Detail your experimental approach and methodology",
    phase: "Content Generation", 
    estimatedTime: "120 minutes",
    isCompleted: false,
    content: `Provide detailed methodology that demonstrates feasibility while showing innovation and rigor in your experimental design.

**Use this prompt:**

Draft a methods section for Aim [NUMBER]: [AIM TITLE] that:
1. Outlines the experimental approach
2. Describes specific techniques, analyses, and tools
3. Addresses potential challenges and alternative approaches
4. Includes success metrics and validation strategies
5. References preliminary data showing feasibility

Technical details to include:
[PASTE YOUR METHODS NOTES]`,
    tips: [
      "Include preliminary data to show feasibility",
      "Address potential technical challenges",
      "Reference your expertise and available resources"
    ]
  },
  {
    id: "budget-justification",
    title: "Budget Justification",
    description: "Create detailed budget with clear justifications",
    phase: "Content Generation",
    estimatedTime: "60 minutes", 
    isCompleted: false,
    content: `Develop a realistic budget that directly supports your research aims with clear justification for every expense.

**Use this prompt:**

Create a detailed budget justification for a [AMOUNT] [FUNDER] grant over [DURATION] years that includes:
1. Personnel costs and roles (including [LIST KEY PERSONNEL])
2. Equipment needs for [LIST METHODS]
3. Supply costs
4. Travel expenses for [CONFERENCES/FIELDWORK]
5. Other relevant categories

For each item, provide 1-2 sentences explaining its necessity for the project.`,
    tips: [
      "Be specific about personnel time allocations",
      "Include equipment maintenance and calibration costs",
      "Factor in inflation for multi-year budgets"
    ]
  },
  {
    id: "reviewer-analysis",
    title: "Reviewer Perspective Analysis", 
    description: "Review your draft from a critical reviewer's viewpoint",
    phase: "Refinement",
    estimatedTime: "45 minutes",
    isCompleted: false,
    content: `Take a step back and critically evaluate your proposal as an experienced reviewer would, identifying potential weaknesses and areas for improvement.

**Use this prompt:**

You are an experienced grant reviewer for [FUNDER]. Review this draft section critically:
[PASTE SECTION]

Provide feedback on:
1. Scientific merit and innovation
2. Methodology and approach
3. Feasibility within timeframe and budget
4. Alignment with funding priorities
5. Clarity and organization
6. Potential questions or concerns

Be specific about both strengths and weaknesses.`,
    tips: [
      "Look for unsupported claims or logical gaps",
      "Check that methodology matches stated aims",
      "Ensure innovation is clearly articulated"
    ]
  },
  {
    id: "visual-assets",
    title: "Visual Asset Development",
    description: "Create figures, charts, and visual aids",
    phase: "Refinement",
    estimatedTime: "90 minutes",
    isCompleted: false,
    content: `Develop clear, professional visual elements that enhance understanding and make complex concepts accessible to reviewers.

**Use this prompt:**

Based on this textual description of [DATA/CONCEPT]:
[PASTE DESCRIPTION]

Suggest a visual representation that would strengthen my grant proposal by:
1. Clarifying the complex concept of [CONCEPT]
2. Making the information more accessible
3. Providing a detailed diagram caption
4. Suggesting an effective format (flowchart, graph, table, etc.)`,
    tips: [
      "Use consistent styling across all figures",
      "Include detailed, informative captions",
      "Make sure visuals are readable when printed in black and white"
    ]
  },
  {
    id: "executive-summary",
    title: "Executive Summary Creation",
    description: "Write a compelling summary that hooks reviewers",
    phase: "Finalization",
    estimatedTime: "45 minutes",
    isCompleted: false,
    content: `Craft an engaging executive summary that captures the essence of your proposal and motivates reviewers to read further.

**Use this prompt:**

Create a compelling executive summary (250 words) for my grant proposal on [TOPIC] that:
1. Hooks the reviewer with the significance of the problem
2. Clearly states my central hypothesis
3. Briefly outlines my innovative approach and aims
4. Emphasizes expected outcomes and broader impacts
5. Uses accessible language while maintaining scientific precision`,
    tips: [
      "Start with the problem's significance",
      "Clearly state your innovative approach",
      "End with expected impact and broader implications"
    ]
  },
  {
    id: "coherence-check",
    title: "Coherence and Flow Check",
    description: "Ensure logical flow and consistency throughout",
    phase: "Finalization",
    estimatedTime: "60 minutes",
    isCompleted: false,
    content: `Review your complete proposal for logical consistency, smooth transitions, and a coherent narrative thread that connects all sections.

**Use this prompt:**

Review my complete grant proposal for coherence and flow:
[PASTE FULL PROPOSAL]

Identify:
1. Any logical gaps between sections
2. Inconsistent terminology or concepts
3. Repetitive content that could be streamlined
4. Missing transitions between major ideas
5. Opportunities to strengthen the narrative thread`,
    tips: [
      "Check that conclusions match your stated aims",
      "Ensure consistent terminology throughout",
      "Verify that each section builds logically on previous ones"
    ]
  },
  {
    id: "final-qa",
    title: "Final Quality Assurance",
    description: "Comprehensive final review for submission readiness",
    phase: "Finalization", 
    estimatedTime: "90 minutes",
    isCompleted: false,
    content: `Conduct a thorough final review to ensure your proposal meets all requirements and presents your research in the best possible light.

**Use this prompt:**

Review this grant proposal for:
1. Alignment with all [FUNDER] guidelines and requirements
2. Consistency in formatting, references, and terminology
3. Grammatical issues or awkward phrasing
4. Balance between technical detail and accessibility
5. Compelling first and last paragraphs in each section

Suggest specific improvements for any issues found.`,
    tips: [
      "Double-check all formatting requirements",
      "Verify all references are complete and correctly formatted",
      "Have a colleague review for clarity and completeness"
    ]
  }
];

interface WorkflowBuilderProps {
  workflowId?: string | null;
}

export function WorkflowBuilder({ workflowId }: WorkflowBuilderProps = {}) {
  const [steps, setSteps] = useState<WorkflowStep[]>(workflowSteps);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [workflowData, setWorkflowData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPrompts();
    fetchTemplates();
    if (workflowId) {
      fetchWorkflowData();
    } else {
      loadUserProgress();
    }
  }, [workflowId]);

  const fetchWorkflowData = async () => {
    if (!workflowId) return;
    
    try {
      const { data, error } = await supabase
        .from('user_workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error) throw error;
      
      if (data) {
        setWorkflowData(data.workflow_data);
        const currentStep = (data.workflow_data as any)?.current_step || 1;
        const stepsCompleted = (data.workflow_data as any)?.steps_completed || [];
        
        setSteps(prev => prev.map(step => ({
          ...step,
          isCompleted: stepsCompleted.includes(step.id)
        })));
      }
    } catch (error) {
      console.error('Error fetching workflow:', error);
    }
  };

  const updateWorkflowProgress = async (stepId: string, completed: boolean) => {
    if (!workflowId) return;

    try {
      const currentCompleted = steps.filter(s => s.isCompleted).map(s => s.id);
      const updatedCompleted = completed 
        ? [...currentCompleted, stepId].filter((s, i, arr) => arr.indexOf(s) === i)
        : currentCompleted.filter(s => s !== stepId);

      const updatedData = {
        ...workflowData,
        steps_completed: updatedCompleted,
        progress: Math.round((updatedCompleted.length / steps.length) * 100)
      };

      const { error } = await supabase
        .from('user_workflows')
        .update({ workflow_data: updatedData })
        .eq('id', workflowId);

      if (error) throw error;

      setWorkflowData(updatedData);
    } catch (error) {
      console.error('Error updating workflow progress:', error);
    }
  };

  const fetchPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('id, title, content, category');
      
      if (error) throw error;
      setPrompts(data || []);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('id, title, content, category');
      
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const loadUserProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_workflows')
        .select('workflow_data')
        .eq('user_id', user.id)
        .single();

      if (data?.workflow_data) {
        const workflowData = data.workflow_data as any;
        setSteps(prev => prev.map(step => ({
          ...step,
          isCompleted: workflowData[step.id] || false
        })));
      }
    } catch (error) {
      // No existing workflow data
    }
  };

  const saveUserProgress = async (updatedSteps: WorkflowStep[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const workflowData = updatedSteps.reduce((acc, step) => ({
        ...acc,
        [step.id]: step.isCompleted
      }), {});

      await supabase
        .from('user_workflows')
        .upsert({
          user_id: user.id,
          workflow_data: workflowData
        });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const toggleStepCompletion = async (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    const newCompleted = !step?.isCompleted;
    
    const updatedSteps = steps.map(step =>
      step.id === stepId ? { ...step, isCompleted: newCompleted } : step
    );
    setSteps(updatedSteps);
    
    if (workflowId) {
      updateWorkflowProgress(stepId, newCompleted);
    } else {
      saveUserProgress(updatedSteps);
    }

    // Track step completion in user_interactions if step is being completed
    if (newCompleted) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('🔄 Attempting to track workflow step completion:', stepId, 'for user:', user?.id);
        
        if (user) {
          // Prepare the interaction data with workflow context
          const interactionData = {
            user_id: user.id,
            interaction_type: 'workflow_step_completed',
            item_type: 'workflow_step',
            item_id: stepId
          };

          // If we have a workflow context, we could store additional metadata
          // For now, we'll rely on the step ID and get workflow info from current session
          const result = await supabase
            .from('user_interactions')
            .insert(interactionData);
          
          console.log('✅ Workflow step completion tracked successfully:', stepId, result);
        } else {
          console.error('❌ No user found when trying to track workflow step');
        }
      } catch (error) {
        console.error('❌ Error tracking workflow step completion:', error);
      }
    }
    
    toast({
      title: newCompleted ? "Step completed!" : "Step marked incomplete",
      description: newCompleted ? "Great progress on your grant proposal!" : "Step marked as incomplete.",
    });
  };

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const copyPromptContent = async (promptId: string) => {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return;

    await navigator.clipboard.writeText(prompt.content);
    toast({
      title: "Prompt copied!",
      description: `"${prompt.title}" copied to clipboard.`,
    });
  };

  const groupedSteps = steps.reduce((acc, step) => {
    if (!acc[step.phase]) {
      acc[step.phase] = [];
    }
    acc[step.phase].push(step);
    return acc;
  }, {} as Record<string, WorkflowStep[]>);

  const completedSteps = steps.filter(step => step.isCompleted).length;
  const totalSteps = steps.length;
  const progress = (completedSteps / totalSteps) * 100;

  const getPromptsByIds = (promptIds?: string[]) => {
    if (!promptIds) return [];
    return prompts.filter(p => promptIds.some(id => 
      p.title.toLowerCase().includes(id) || p.category.toLowerCase().includes(id)
    ));
  };

  const getTemplatesByIds = (templateIds?: string[]) => {
    if (!templateIds) return [];
    return templates.filter(t => templateIds.some(id => 
      t.title.toLowerCase().includes(id) || t.category.toLowerCase().includes(id)
    ));
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold gradient-text">Grant Writing Workflow</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Follow this comprehensive AI-assisted workflow to dramatically accelerate and improve your grant writing process. 
          Each step includes specific prompts and templates to guide you through creating compelling, fundable proposals.
        </p>
        {workflowData && (
          <div className="mt-6 p-4 bg-muted rounded-lg max-w-2xl mx-auto">
            <h3 className="font-semibold text-lg">{workflowData.title}</h3>
            <p className="text-sm text-muted-foreground">
              {workflowData.funding_agency} • {workflowData.amount} • Due: {new Date(workflowData.deadline).toLocaleDateString()}
            </p>
            {workflowData.description && (
              <p className="text-sm text-muted-foreground mt-2">{workflowData.description}</p>
            )}
          </div>
        )}
      </div>

      {/* Progress Overview */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Your Progress</h2>
          <Badge variant="outline" className="bg-primary/20 text-primary">
            {completedSteps} of {totalSteps} steps
          </Badge>
        </div>
        <Progress value={progress} className="mb-2" />
        <p className="text-sm text-muted-foreground">
          {progress.toFixed(0)}% complete - Keep up the great work!
        </p>
      </Card>

      {/* Workflow Steps by Phase */}
      {Object.entries(groupedSteps).map(([phase, phaseSteps]) => (
        <div key={phase} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-primary-glow"></div>
            <h2 className="text-2xl font-bold">{phase} Phase</h2>
          </div>

          <div className="space-y-4">
            {phaseSteps.map((step, index) => (
              <Card key={step.id} className="glass-card overflow-hidden">
                <div 
                  className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleStepExpansion(step.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStepCompletion(step.id);
                        }}
                        className="mt-1 p-0 h-6 w-6"
                      >
                        {step.isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </Button>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-lg font-semibold ${step.isCompleted ? 'text-green-400' : 'text-foreground'}`}>
                            {step.title}
                          </h3>
                          <Badge variant="outline" className="bg-white/5">
                            <Clock className="w-3 h-3 mr-1" />
                            {step.estimatedTime}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">{step.description}</p>
                        
                        {(step.prompts || step.templates) && (
                          <div className="flex gap-2 mt-3">
                            {step.prompts && (
                              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                                <Lightbulb className="w-3 h-3 mr-1" />
                                {step.prompts.length} Prompt{step.prompts.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
                            {step.templates && (
                              <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                                <FileText className="w-3 h-3 mr-1" />
                                {step.templates.length} Template{step.templates.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm" className="ml-4">
                      {expandedSteps.has(step.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {expandedSteps.has(step.id) && (
                  <div className="border-t border-white/10 p-6 bg-black/20">
                    {step.content && (
                      <div className="mb-6 space-y-6">
                        {(() => {
                          const parts = step.content.split('**Use this prompt:**');
                          const beforePrompt = parts[0];
                          const promptContent = parts[1];

                          return (
                            <>
                              {/* Step Details Section */}
                              <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <Target className="w-4 h-4" />
                                  Step Details
                                </h4>
                                <div className="prose prose-invert max-w-none">
                                  {beforePrompt.split('\n').map((line, i) => {
                                    if (line.startsWith('•')) {
                                      return (
                                        <div key={i} className="flex items-start gap-2 mb-2">
                                          <div className="w-1 h-1 rounded-full bg-accent mt-2"></div>
                                          <span className="text-muted-foreground">{line.substring(1).trim()}</span>
                                        </div>
                                      );
                                    }
                                    return line.trim() ? (
                                      <p key={i} className="mb-3 text-muted-foreground">{line}</p>
                                    ) : null;
                                  })}
                                </div>
                              </div>

                              {/* Prompt Section */}
                              {promptContent && (
                                <div>
                                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <Copy className="w-4 h-4 text-accent" />
                                    📝 Use this prompt:
                                  </h4>
                                  <div className="glass-card p-4 bg-black/20 rounded-lg border-l-4 border-accent">
                                    <pre className="whitespace-pre-wrap text-sm font-mono text-green-400 leading-relaxed">
                                      {promptContent.trim()}
                                    </pre>
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}

                    {step.tips && step.tips.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold mb-3">💡 Pro Tips</h4>
                        <ul className="space-y-2">
                          {step.tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <ArrowRight className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                              <span className="text-sm text-muted-foreground">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {step.prompts && (
                      <div className="mb-6">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4" />
                          Related Prompts
                        </h4>
                        <div className="space-y-3">
                          {getPromptsByIds(step.prompts).map((prompt) => (
                            <div key={prompt.id} className="glass-card p-4 bg-blue-500/10 border-blue-500/20">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-medium text-blue-400 mb-1">{prompt.title}</h5>
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {prompt.content.substring(0, 150)}...
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyPromptContent(prompt.id)}
                                  className="ml-3 glass-button"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {step.templates && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Related Templates
                        </h4>
                        <div className="space-y-3">
                          {getTemplatesByIds(step.templates).map((template) => (
                            <div key={template.id} className="glass-card p-4 bg-purple-500/10 border-purple-500/20">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-medium text-purple-400 mb-1">{template.title}</h5>
                                  <p className="text-xs text-muted-foreground">
                                    {template.category} template
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="ml-3 glass-button"
                                >
                                  <FileText className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Completion Summary */}
      {completedSteps === totalSteps && (
        <Card className="glass-card p-8 text-center bg-gradient-to-br from-green-500/20 to-blue-500/20 border-green-500/30">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-400 mb-2">Workflow Complete!</h2>
          <p className="text-muted-foreground">
            Congratulations! You've completed all steps in the Grant Writing Workflow. 
            Your proposal is now ready for final review and submission.
          </p>
        </Card>
      )}
    </div>
  );
}