import { useState, useEffect } from "react";
import { Search, Filter, Star, Clock, Tag, Copy, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PromptDetail } from "./PromptDetail";

interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  difficulty_level: string;
  estimated_time: string;
  copy_count: number;
  tags: string[];
  is_featured: boolean;
}

export function PromptLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const { toast } = useToast();

  const categories = ["All", "Preparation", "Strategic Planning", "Content Generation", "Refinement", "Finalization"];
  const difficulties = ["All", "Beginner", "Intermediate", "Advanced"];

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrompts(data || []);
    } catch (error) {
      console.error('Error fetching prompts:', error);
      toast({
        title: "Error",
        description: "Failed to load prompts.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || prompt.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesDifficulty = selectedDifficulty === "all" || prompt.difficulty_level.toLowerCase() === selectedDifficulty.toLowerCase();
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const handleCopyPrompt = async (prompt: Prompt) => {
    try {
      // Format the content properly by replacing \\n with actual line breaks
      const formattedContent = prompt.content.replace(/\\n/g, '\n');
      await navigator.clipboard.writeText(formattedContent || `Prompt: ${prompt.title}\n\nDescription: ${prompt.description}`);
      
      // Update copy count
      await supabase
        .from('prompts')
        .update({ copy_count: prompt.copy_count + 1 })
        .eq('id', prompt.id);

      // Track interaction
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_interactions')
          .insert({
            user_id: user.id,
            interaction_type: 'copy',
            item_type: 'prompt',
            item_id: prompt.id
          });
      }

      // Update local state
      setPrompts(prev => prev.map(p => 
        p.id === prompt.id ? { ...p, copy_count: p.copy_count + 1 } : p
      ));

      toast({
        title: "Copied!",
        description: `"${prompt.title}" copied to clipboard.`,
      });
    } catch (error) {
      console.error('Error copying prompt:', error);
      toast({
        title: "Error",
        description: "Failed to copy prompt.",
        variant: "destructive",
      });
    }
  };

  const handleFavoritePrompt = async (prompt: Prompt, event: React.MouseEvent) => {
    event.stopPropagation();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to favorite prompts.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if already favorited
      const { data: existingFavorite } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_type', 'prompt')
        .eq('item_id', prompt.id)
        .single();

      if (existingFavorite) {
        // Remove from favorites
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('item_type', 'prompt')
          .eq('item_id', prompt.id);

        toast({
          title: "Removed from favorites",
          description: "Prompt removed from your favorites.",
        });
      } else {
        // Add to favorites
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            item_type: 'prompt',
            item_id: prompt.id
          });

        // Track interaction
        await supabase
          .from('user_interactions')
          .insert({
            user_id: user.id,
            interaction_type: 'favorite',
            item_type: 'prompt',
            item_id: prompt.id
          });

        console.log('Favorite interaction tracked for prompt:', prompt.id);

        toast({
          title: "Added to favorites",
          description: "Prompt added to your favorites.",
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites.",
        variant: "destructive",
      });
    }
  };

  if (selectedPromptId) {
    return (
      <PromptDetail
        promptId={selectedPromptId}
        onBack={() => setSelectedPromptId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Prompt Library</h1>
            <p className="text-muted-foreground">
              Discover AI prompts to accelerate your grant writing workflow
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold gradient-text">{filteredPrompts.length}</div>
            <div className="text-sm text-muted-foreground">Available Prompts</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search prompts, tags, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 glass-button"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="glass-button">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category.toLowerCase()}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="glass-button">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((difficulty) => (
                  <SelectItem key={difficulty} value={difficulty.toLowerCase()}>
                    {difficulty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Prompts Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading prompts...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map((prompt) => (
            <Card 
              key={prompt.id} 
              className="glass-card p-6 hover:bg-white/10 transition-all duration-300 group cursor-pointer"
              onClick={() => setSelectedPromptId(prompt.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{prompt.title}</h3>
                    {prompt.is_featured && <Star className="w-4 h-4 text-accent" />}
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-2">{prompt.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="bg-white/5 text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {prompt.category}
                </Badge>
                <Badge variant="outline" className="bg-white/5 text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {prompt.estimated_time}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`bg-white/5 text-xs ${
                    prompt.difficulty_level === 'Beginner' ? 'text-green-400' :
                    prompt.difficulty_level === 'Intermediate' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}
                >
                  {prompt.difficulty_level}
                </Badge>
              </div>

              {prompt.tags && prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {prompt.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-accent/20 text-accent text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Copy className="w-4 h-4" />
                    {prompt.copy_count}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="glass-button opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleFavoritePrompt(prompt, e)}
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyPrompt(prompt);
                    }}
                    size="sm"
                    className="glass-button opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filteredPrompts.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No prompts found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}