-- Create prompts table
CREATE TABLE public.prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  copy_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create templates table
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  copy_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workflows table
CREATE TABLE public.workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  workflow_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_interactions table
CREATE TABLE public.user_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('prompt', 'template', 'workflow_step')),
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('copy', 'like', 'comment', 'favorite', 'workflow_step_completed')),
  workflow_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for prompts
CREATE POLICY "Users can view their own prompts" ON public.prompts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own prompts" ON public.prompts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own prompts" ON public.prompts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own prompts" ON public.prompts FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for templates
CREATE POLICY "Users can view their own templates" ON public.templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own templates" ON public.templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own templates" ON public.templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own templates" ON public.templates FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for workflows
CREATE POLICY "Users can view their own workflows" ON public.workflows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own workflows" ON public.workflows FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own workflows" ON public.workflows FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workflows" ON public.workflows FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_interactions
CREATE POLICY "Users can view their own interactions" ON public.user_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own interactions" ON public.user_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own interactions" ON public.user_interactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own interactions" ON public.user_interactions FOR DELETE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_prompts_updated_at
BEFORE UPDATE ON public.prompts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at
BEFORE UPDATE ON public.workflows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_prompts_user_id ON public.prompts(user_id);
CREATE INDEX idx_prompts_category ON public.prompts(category);
CREATE INDEX idx_templates_user_id ON public.templates(user_id);
CREATE INDEX idx_templates_category ON public.templates(category);
CREATE INDEX idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX idx_user_interactions_user_id ON public.user_interactions(user_id);
CREATE INDEX idx_user_interactions_item_id ON public.user_interactions(item_id);