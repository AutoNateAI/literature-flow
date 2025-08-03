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
    description: "Create a dedicated workspace and organize your literature review system",
    phase: "Setup",
    estimatedTime: "30 minutes",
    isCompleted: false,
    content: `Create a dedicated workspace in NotebookLM or similar tool and organize:
• Your reference management system (Zotero, Mendeley, etc.)
• Research question and objectives documents
• Initial paper collection and reading lists
• Note-taking templates and organization system`,
    tips: [
      "Use a consistent file naming system for papers and notes",
      "Set up automated backup for your reference database",
      "Create folder structures that match your planned review themes"
    ]
  },
  {
    id: "research-question",
    title: "Research Question Refinement",
    description: "Define clear, focused research questions for your literature review",
    phase: "Setup", 
    estimatedTime: "45 minutes",
    isCompleted: false,
    content: `Use AI to refine and clarify your research questions, ensuring they're specific enough to guide your literature search effectively.

**Use this prompt:**

Help me refine my research interest in [BROAD TOPIC] into a focused research question.

Specifically, I'm interested in:
- [SPECIFIC ASPECT 1]
- [SPECIFIC ASPECT 2]
- [SPECIFIC ASPECT 3]

For my research question:
1. Propose 3-5 clearly formulated research questions
2. For each question, explain why it's significant
3. Identify key concepts that should be included
4. Suggest limitations for scope (time period, populations, etc.)
5. Recommend inclusion/exclusion criteria for my literature review`,
    tips: [
      "Start broad but quickly narrow to a specific, answerable question",
      "Consider what databases and search terms your question suggests",
      "Think about the practical scope - how many papers can you realistically review?"
    ]
  },
  {
    id: "search-strategy",
    title: "Literature Search Strategy", 
    description: "Develop a comprehensive and systematic search approach",
    phase: "Collection",
    estimatedTime: "30 minutes",
    isCompleted: false,
    content: `Create a systematic search strategy that will ensure you capture all relevant literature for your review.

**Use this prompt:**

Based on my research question: [INSERT RESEARCH QUESTION]

Help me develop a comprehensive search strategy that includes:
1. Primary search terms with Boolean operators (AND, OR, NOT)
2. Secondary terms and synonyms to include
3. Key databases to search (e.g., PubMed, Web of Science, ACM Digital Library)
4. Recommended filters (publication years, methodologies, languages)
5. Suggestions for citation tracking and reference list checking
6. Gray literature sources worth exploring
7. A structured approach to document my search process

My field of study is [YOUR FIELD], and I'm particularly interested in [SPECIFIC INTERESTS].`,
    tips: [
      "Test search terms in multiple databases to refine your strategy",
      "Document your search process for reproducibility",
      "Plan to search both recent papers and seminal older works"
    ]
  },
  {
    id: "paper-analysis",
    title: "Systematic Paper Analysis",
    description: "Analyze individual papers using AI to extract key insights",
    phase: "Analysis",
    estimatedTime: "60 minutes", 
    isCompleted: false,
    content: `Use AI to systematically analyze each paper, extracting key findings, methodologies, and theoretical frameworks.

**Use this prompt:**

Provide a comprehensive summary of this academic paper:
[PASTE PAPER TEXT OR TITLE/ABSTRACT]

Include:
1. Full citation information
2. Research objectives and questions addressed
3. Theoretical framework or conceptual model used
4. Methodology (design, sample, measures, procedures)
5. Key findings organized by research questions/objectives
6. Stated limitations and future research directions
7. Practical or theoretical implications
8. Connections to [MY RESEARCH FOCUS]
9. Key quotations worth noting (with page numbers if available)

Format this summary for easy reference later in my literature review.`,
    tips: [
      "Process papers in batches for efficiency",
      "Save detailed notes in your reference manager",
      "Look for recurring themes across papers"
    ]
  },
  {
    id: "thematic-analysis",
    title: "Multi-Paper Thematic Analysis",
    description: "Identify themes and patterns across multiple papers",
    phase: "Analysis",
    estimatedTime: "90 minutes",
    isCompleted: false,
    content: `Analyze groups of papers to identify common themes, methodological approaches, and areas of consensus or debate.

**Use this prompt:**

Analyze these paper summaries on [TOPIC] and identify key themes:
[PASTE MULTIPLE PAPER SUMMARIES]

For this analysis:
1. Identify 5-7 major themes that emerge across these papers
2. For each theme, note which papers address it and their key findings
3. Highlight areas of consensus among researchers
4. Identify contradictions or debates within each theme
5. Note methodological approaches used to study each theme
6. Suggest how these themes relate to each other
7. Indicate which themes appear most established vs. emerging

Present the results as a thematic map I can use to structure my literature review.`,
    tips: [
      "Look for both explicit and implicit themes",
      "Pay attention to methodological patterns",
      "Note which themes have strong vs. weak evidence"
    ]
  },
  {
    id: "synthesis-framework", 
    title: "Literature Synthesis & Framework Development",
    description: "Synthesize findings into coherent frameworks and identify gaps",
    phase: "Synthesis",
    estimatedTime: "75 minutes",
    isCompleted: false,
    content: `Synthesize your analyzed literature into coherent narratives and identify research gaps for future work.

**Use this prompt:**

Synthesize the literature on [TOPIC] based on these paper summaries:
[PASTE SUMMARIES OR REFERENCE NOTEBOOK]

Create a comprehensive synthesis that:
1. Integrates findings across studies into a coherent narrative
2. Organizes insights by the key themes:
   [LIST YOUR IDENTIFIED THEMES]
3. Highlights the strength of evidence for each major conclusion
4. Articulates areas of scholarly consensus and disagreement
5. Places findings in theoretical context
6. Discusses practical implications of the collective evidence
7. Identifies patterns in how research has approached this topic
8. Connects this synthesis to my research focus on [YOUR FOCUS]

Format this as a scholarly synthesis I can adapt for my literature review.`,
    tips: [
      "Focus on synthesis rather than just summarization",
      "Identify both theoretical and methodological contributions",
      "Look for opportunities to propose new conceptual frameworks"
    ]
  },
  {
    id: "gap-analysis",
    title: "Research Gap Analysis",
    description: "Identify opportunities for future research and contribution",
    phase: "Synthesis", 
    estimatedTime: "120 minutes",
    isCompleted: false,
    content: `Conduct a systematic analysis to identify gaps in the literature that represent opportunities for future research.

**Use this prompt:**

Based on my literature review on [TOPIC], conduct a comprehensive gap analysis:

1. Identify explicit gaps mentioned by authors in their future research sections
2. Detect implicit gaps based on:
   - Limitations across multiple studies
   - Inconsistent or contradictory findings
   - Theoretical weaknesses or assumptions
   - Methodological shortcomings
   - Underrepresented populations or contexts
   - Emerging phenomena not yet well-studied
3. Categorize gaps as theoretical, methodological, contextual, or practical
4. Assess the significance of each gap to advancing knowledge in the field
5. Evaluate which gaps align with my research interests in [YOUR INTEREST]
6. Suggest how addressing these gaps could contribute to theory or practice
7. Recommend specific research questions that would address priority gaps

Present this as a structured gap analysis I can use to position my research.`,
    tips: [
      "Look for both explicit and implicit gaps",
      "Consider gaps across different levels (theoretical, methodological, empirical)",
      "Prioritize gaps based on significance and feasibility"
    ]
  },
  {
    id: "writing-process",
    title: "Literature Review Writing",
    description: "Draft your literature review sections systematically",
    phase: "Output Generation",
    estimatedTime: "60 minutes", 
    isCompleted: false,
    content: `Begin writing your literature review using AI assistance to create well-structured, scholarly sections.

**Use this prompt:**

Draft an introduction for my literature review on [TOPIC] that:

1. Establishes the importance and relevance of the topic
2. Clearly states my specific focus and research question:
   [YOUR RESEARCH QUESTION]
3. Briefly explains the scope of the review (time period, types of studies, etc.)
4. Provides context on the current state of knowledge
5. Outlines the structure of the review organized by:
   [YOUR MAJOR THEMES]
6. States the purpose and contribution of this review
7. Includes appropriate academic language and transitions

Write this in a formal academic style suitable for [INTENDED AUDIENCE/PUBLICATION].`,
    tips: [
      "Start with your strongest argument for the topic's importance",
      "Clearly define your scope and limitations",
      "Use signposting to guide readers through your review structure"
    ]
  },
  {
    id: "quality-review",
    title: "Quality and Consistency Review", 
    description: "Review your draft for quality, flow, and consistency",
    phase: "Refinement",
    estimatedTime: "45 minutes",
    isCompleted: false,
    content: `Systematically review your literature review draft to ensure it meets academic standards and flows coherently.

**Use this prompt:**

Review my draft literature review on [TOPIC] for quality and consistency:
[PASTE YOUR DRAFT]

Evaluate:
1. Logical flow and organization of ideas
2. Consistency in terminology and concepts throughout
3. Balance in coverage across themes and perspectives
4. Integration of critical analysis (not just summarizing papers)
5. Appropriate use of citations and evidence
6. Clarity and academic tone of writing
7. Strengths of the current draft
8. Specific areas for improvement

Provide detailed feedback I can use to refine my literature review.`,
    tips: [
      "Check for consistent terminology and definitions throughout",
      "Ensure you're synthesizing rather than just summarizing",
      "Verify that your conclusions are supported by the evidence presented"
    ]
  },
  {
    id: "visual-elements",
    title: "Visual Elements Creation",
    description: "Create conceptual maps, timelines, and other visual aids",
    phase: "Refinement",
    estimatedTime: "90 minutes",
    isCompleted: false,
    content: `Create visual elements that enhance your literature review and make complex relationships clear to readers.

**Use this prompt:**

Based on my literature review on [TOPIC], describe how to create these visual elements:

1. A conceptual map showing relationships between key theories and concepts
2. A chronological timeline of major developments in this research area
3. A methodological comparison table categorizing studies by approach
4. A gap analysis visualization highlighting research opportunities
5. A thematic network showing connections between major themes

For each visual, provide:
- Key elements to include
- Suggested structure and organization
- Data to be represented
- Design considerations
- How it will enhance understanding of the literature
- A detailed description I can use to create it`,
    tips: [
      "Focus on visuals that add value, not just decoration",
      "Make sure complex relationships are clearly represented",
      "Consider your audience's familiarity with visual conventions in your field"
    ]
  },
  {
    id: "abstract-creation",
    title: "Abstract Creation",
    description: "Write a compelling abstract that summarizes your review",
    phase: "Finalization",
    estimatedTime: "45 minutes",
    isCompleted: false,
    content: `Create a comprehensive abstract that effectively summarizes your entire literature review for potential readers.

**Use this prompt:**

Based on my completed literature review on [TOPIC], draft a comprehensive abstract (250 words max) that:

1. Introduces the topic and its importance
2. States the specific focus and purpose of the review
3. Briefly describes the review methodology (sources, inclusion criteria)
4. Summarizes key findings organized by main themes
5. Highlights significant gaps or contradictions identified
6. Concludes with implications and future research directions
7. Follows conventions for academic abstracts in [YOUR FIELD]

Write this in a formal, concise style suitable for academic publication.`,
    tips: [
      "Make every word count within the word limit",
      "Follow the standard abstract structure for your field",
      "Ensure the abstract can stand alone as a complete summary"
    ]
  },
  {
    id: "citation-check",
    title: "Citation and Evidence Review",
    description: "Strengthen your evidence base and citation practices",
    phase: "Finalization",
    estimatedTime: "60 minutes",
    isCompleted: false,
    content: `Systematically review your citations and evidence to ensure they properly support your arguments and meet academic standards.

**Use this prompt:**

Review the use of citations and evidence in my literature review:
[PASTE YOUR DRAFT]

Assess:
1. Areas that need additional citation support
2. Places where evidence presented doesn't fully support claims made
3. Sections relying too heavily on a single source
4. Opportunities to integrate additional perspectives
5. Balance between seminal works and current research
6. Use of primary vs secondary sources
7. Potential citation patterns that could suggest bias

Provide specific suggestions for strengthening the evidence base of my review.`,
    tips: [
      "Ensure every major claim is supported by appropriate evidence",
      "Balance recent research with foundational work in the field",
      "Check that citation format is consistent throughout"
    ]
  },
  {
    id: "final-review",
    title: "Final Literature Review Polish",
    description: "Final comprehensive review and polishing for publication",
    phase: "Finalization", 
    estimatedTime: "90 minutes",
    isCompleted: false,
    content: `Conduct a comprehensive final review to ensure your literature review is polished and ready for submission or publication.

**Use this prompt:**

Perform a final review of my literature review on [TOPIC] for:
1. Overall argument strength and logical progression
2. Consistency in writing style and academic tone
3. Completeness of the literature coverage
4. Clarity of the research gaps identified
5. Strength of conclusions and future research recommendations
6. Formatting, citations, and reference list accuracy
7. Adherence to target journal or submission guidelines

Provide specific recommendations for final improvements before submission.`,
    tips: [
      "Read your review aloud to catch awkward phrasing",
      "Verify that your conclusions follow logically from your analysis",
      "Double-check that all cited works appear in your reference list"
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
        .maybeSingle();

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
        .maybeSingle();

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

  const copyStepPrompt = async (promptContent: string) => {
    if (!promptContent) return;

    // Clean the prompt content for copying
    const cleanContent = promptContent.trim();
    
    try {
      await navigator.clipboard.writeText(cleanContent);
      
      // Track the copy action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const interactionData = {
          user_id: user.id,
          interaction_type: 'prompt_copied',
          item_type: 'workflow_prompt',
          item_id: workflowId || 'general_workflow'
        };

        try {
          await supabase
            .from('user_interactions')
            .insert(interactionData);
          
          console.log('✅ Prompt copy action tracked successfully');
        } catch (error) {
          console.error('❌ Error tracking prompt copy:', error);
        }
      }
      
      toast({
        title: "Prompt copied!",
        description: "The prompt has been copied to your clipboard.",
      });
    } catch (error) {
      console.error('Failed to copy prompt:', error);
      toast({
        title: "Copy failed",
        description: "Failed to copy the prompt. Please try again.",
        variant: "destructive"
      });
    }
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
        <h1 className="text-4xl font-bold gradient-text">Literature Review Workflow</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Follow this comprehensive AI-assisted workflow to dramatically accelerate and improve your literature review process. 
          Each step includes specific prompts and templates to guide you through creating compelling, fundable proposals.
        </p>
        {workflowData && (
          <div className="mt-6 p-4 bg-muted rounded-lg max-w-2xl mx-auto">
            <h3 className="font-semibold text-lg">{workflowData.title}</h3>
            <p className="text-sm text-muted-foreground">
              {workflowData.paper_type === 'research' ? 'Research Paper' : 'Stand-Alone Paper'} • {workflowData.theme}
            </p>
            {workflowData.hypothesis && (
              <p className="text-sm text-muted-foreground mt-2 italic">"{workflowData.hypothesis}"</p>
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
                                     <Button 
                                       variant="ghost" 
                                       size="sm" 
                                       onClick={() => copyStepPrompt(promptContent)}
                                       className="p-1 h-auto"
                                     >
                                       <Copy className="w-4 h-4 text-accent" />
                                     </Button>
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
            Congratulations! You've completed all steps in the Literature Review Workflow. 
            Your proposal is now ready for final review and submission.
          </p>
        </Card>
      )}
    </div>
  );
}