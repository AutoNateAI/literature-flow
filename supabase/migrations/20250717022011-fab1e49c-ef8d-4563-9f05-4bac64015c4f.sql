-- =============================================================================
-- COMPLETE DATABASE SETUP SCRIPT - SAFE VERSION
-- =============================================================================

-- Create function for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  title TEXT,
  institution TEXT,
  research_area TEXT,
  avatar_url TEXT,
  bio TEXT,
  xp_points INTEGER DEFAULT 0,
  weekly_streak INTEGER DEFAULT 0,
  total_prompts_copied INTEGER DEFAULT 0,
  total_templates_copied INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update prompts table structure (safely)
DO $$
BEGIN
  -- Add new columns to prompts if they don't exist
  BEGIN
    ALTER TABLE public.prompts ADD COLUMN description TEXT;
  EXCEPTION WHEN duplicate_column THEN
    -- Column already exists, do nothing
  END;
  
  BEGIN
    ALTER TABLE public.prompts ADD COLUMN difficulty_level TEXT;
  EXCEPTION WHEN duplicate_column THEN
    -- Column already exists, do nothing
  END;
  
  BEGIN
    ALTER TABLE public.prompts ADD COLUMN estimated_time TEXT;
  EXCEPTION WHEN duplicate_column THEN
    -- Column already exists, do nothing
  END;
  
  BEGIN
    ALTER TABLE public.prompts ADD COLUMN like_count INTEGER DEFAULT 0;
  EXCEPTION WHEN duplicate_column THEN
    -- Column already exists, do nothing
  END;
  
  BEGIN
    ALTER TABLE public.prompts ADD COLUMN dislike_count INTEGER DEFAULT 0;
  EXCEPTION WHEN duplicate_column THEN
    -- Column already exists, do nothing
  END;
  
  BEGIN
    ALTER TABLE public.prompts ADD COLUMN created_by UUID;
  EXCEPTION WHEN duplicate_column THEN
    -- Column already exists, do nothing
  END;
  
  BEGIN
    ALTER TABLE public.prompts ADD COLUMN is_featured BOOLEAN DEFAULT false;
  EXCEPTION WHEN duplicate_column THEN
    -- Column already exists, do nothing
  END;
END$$;

-- Update templates table structure (safely)
DO $$
BEGIN
  -- Add new columns to templates if they don't exist
  BEGIN
    ALTER TABLE public.templates ADD COLUMN description TEXT;
  EXCEPTION WHEN duplicate_column THEN
    -- Column already exists, do nothing
  END;
  
  BEGIN
    ALTER TABLE public.templates ADD COLUMN type TEXT DEFAULT 'Document Template';
  EXCEPTION WHEN duplicate_column THEN
    -- Column already exists, do nothing
  END;
  
  BEGIN
    ALTER TABLE public.templates ADD COLUMN file_type TEXT;
  EXCEPTION WHEN duplicate_column THEN
    -- Column already exists, do nothing
  END;
  
  BEGIN
    ALTER TABLE public.templates ADD COLUMN file_size TEXT;
  EXCEPTION WHEN duplicate_column THEN
    -- Column already exists, do nothing
  END;
  
  BEGIN
    ALTER TABLE public.templates ADD COLUMN download_count INTEGER DEFAULT 0;
  EXCEPTION WHEN duplicate_column THEN
    -- Column already exists, do nothing
  END;
  
  BEGIN
    ALTER TABLE public.templates ADD COLUMN like_count INTEGER DEFAULT 0;
  EXCEPTION WHEN duplicate_column THEN
    -- Column already exists, do nothing
  END;
  
  BEGIN
    ALTER TABLE public.templates ADD COLUMN created_by UUID;
  EXCEPTION WHEN duplicate_column THEN
    -- Column already exists, do nothing
  END;
  
  BEGIN
    ALTER TABLE public.templates ADD COLUMN is_featured BOOLEAN DEFAULT false;
  EXCEPTION WHEN duplicate_column THEN
    -- Column already exists, do nothing
  END;
END$$;

-- Create missing tables
CREATE TABLE IF NOT EXISTS public.user_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workflow_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('prompt', 'template')),
  item_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('prompt', 'template')),
  item_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, title)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'title', 'Researcher')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
BEFORE UPDATE ON public.profiles 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_workflows_updated_at ON public.user_workflows;
CREATE TRIGGER update_user_workflows_updated_at 
BEFORE UPDATE ON public.user_workflows 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;
CREATE TRIGGER update_comments_updated_at 
BEFORE UPDATE ON public.comments 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

SELECT '✅ Database tables created successfully!' as message;