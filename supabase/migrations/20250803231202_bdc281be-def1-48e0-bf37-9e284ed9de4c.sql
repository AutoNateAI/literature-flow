-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add missing RLS policies for favorites table
CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- Add missing RLS policies for comments table  
CREATE POLICY "Users can view all comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create their own comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Add missing RLS policies for user_workflows table
CREATE POLICY "Users can view their own user_workflows" ON public.user_workflows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own user_workflows" ON public.user_workflows FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own user_workflows" ON public.user_workflows FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own user_workflows" ON public.user_workflows FOR DELETE USING (auth.uid() = user_id);

-- Add missing RLS policies for profiles table
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE USING (auth.uid() = user_id);