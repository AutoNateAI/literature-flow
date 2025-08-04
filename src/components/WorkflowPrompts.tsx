import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WorkflowPrompt {
  id: string;
  stage_name: string;
  prompt_title: string;
  prompt_content: string;
  expected_output: string;
  order_index: number;
}

interface WorkflowPromptsProps {
  notebookUrl?: string;
}

export function WorkflowPrompts({ notebookUrl }: WorkflowPromptsProps) {
  const [prompts, setPrompts] = useState<WorkflowPrompt[]>([]);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('workflow_prompts')
        .select('*')
        .order('order_index');

      if (error) throw error;
      setPrompts(data || []);
    } catch (error) {
      console.error("Error fetching workflow prompts:", error);
      toast.error("Failed to load workflow prompts");
    } finally {
      setLoading(false);
    }
  };

  const copyPrompt = async (promptContent: string, promptId: string) => {
    try {
      await navigator.clipboard.writeText(promptContent);
      setCopiedPrompt(promptId);
      toast.success("Prompt copied to clipboard!");
      
      setTimeout(() => {
        setCopiedPrompt(null);
      }, 2000);
    } catch (error) {
      toast.error("Failed to copy prompt");
    }
  };

  const getStageColor = (stageName: string) => {
    const colors = {
      concept_extraction: "bg-blue-100 text-blue-800",
      gap_analysis: "bg-yellow-100 text-yellow-800", 
      discrepancy_analysis: "bg-red-100 text-red-800",
      pivotal_publications: "bg-green-100 text-green-800"
    };
    return colors[stageName as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return <div>Loading workflow prompts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">NotebookLM Analysis Workflow</h2>
        <p className="text-muted-foreground">
          Follow these prompts in NotebookLM to extract insights for your research graph
        </p>
        {notebookUrl && (
          <Button asChild variant="outline">
            <a href={notebookUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open NotebookLM
            </a>
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {prompts.map((prompt, index) => (
          <Card key={prompt.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{prompt.prompt_title}</CardTitle>
                    <Badge variant="secondary" className={getStageColor(prompt.stage_name)}>
                      {prompt.stage_name.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyPrompt(prompt.prompt_content, prompt.id)}
                >
                  {copiedPrompt === prompt.id ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Prompt for NotebookLM:</h4>
                <div className="p-3 bg-muted rounded-md text-sm leading-relaxed">
                  {prompt.prompt_content}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2 text-green-700">Expected Output:</h4>
                <p className="text-sm text-muted-foreground italic">
                  {prompt.expected_output}
                </p>
              </div>

              <div className="text-xs text-muted-foreground border-t pt-3">
                💡 <strong>Tip:</strong> Copy this prompt, paste it into NotebookLM, then copy the results back to create graph nodes in the next step.
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">Next Steps:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Use each prompt above in your NotebookLM notebook</li>
            <li>Copy the generated insights</li>
            <li>Return to the Concept Extractor to create graph nodes</li>
            <li>Build relationships between concepts in the Graph View</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}