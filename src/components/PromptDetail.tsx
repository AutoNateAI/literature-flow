import { useState, useEffect } from "react";
import { ArrowLeft, Copy, Heart, ThumbsUp, ThumbsDown, MessageCircle, Clock, Tag, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  difficulty_level: string;
  estimated_time: string;
  copy_count: number;
  like_count: number;
  dislike_count: number;
  is_featured: boolean;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_comment_id?: string;
}

interface PromptDetailProps {
  promptId: string;
  onBack: () => void;
}

export function PromptDetail({ promptId, onBack }: PromptDetailProps) {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPromptDetail();
    fetchComments();
    checkIfFavorited();
  }, [promptId]);

  const fetchPromptDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', promptId)
        .single();

      if (error) throw error;
      setPrompt(data);
    } catch (error) {
      console.error('Error fetching prompt:', error);
      toast({
        title: "Error",
        description: "Failed to load prompt details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('item_type', 'prompt')
        .eq('item_id', promptId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const checkIfFavorited = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_type', 'prompt')
        .eq('item_id', promptId)
        .single();

      setIsFavorited(!!data);
    } catch (error) {
      // Not favorited
    }
  };

  const handleCopy = async () => {
    if (!prompt) return;
    
    // Format the content properly by replacing \\n with actual line breaks
    const formattedContent = prompt.content.replace(/\\n/g, '\n');
    await navigator.clipboard.writeText(formattedContent);
    
    // Update copy count
    await supabase
      .from('prompts')
      .update({ copy_count: prompt.copy_count + 1 })
      .eq('id', promptId);

    // Track interaction
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('user_interactions')
        .insert({
          user_id: user.id,
          interaction_type: 'copy',
          item_type: 'prompt',
          item_id: promptId
        });
    }

    setPrompt(prev => prev ? { ...prev, copy_count: prev.copy_count + 1 } : null);
    
    toast({
      title: "Copied!",
      description: "Prompt copied to clipboard.",
    });
  };

  const handleFavorite = async () => {
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
      if (isFavorited) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('item_type', 'prompt')
          .eq('item_id', promptId);
      } else {
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            item_type: 'prompt',
            item_id: promptId
          });
      }

      setIsFavorited(!isFavorited);
      toast({
        title: isFavorited ? "Removed from favorites" : "Added to favorites",
        description: isFavorited ? "Prompt removed from your favorites." : "Prompt added to your favorites.",
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites.",
        variant: "destructive",
      });
    }
  };

  const handleLike = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await supabase
        .from('prompts')
        .update({ like_count: (prompt?.like_count || 0) + 1 })
        .eq('id', promptId);

      await supabase
        .from('user_interactions')
        .insert({
          user_id: user.id,
          interaction_type: 'like',
          item_type: 'prompt',
          item_id: promptId
        });

      console.log('Like interaction tracked for prompt:', promptId);

      setPrompt(prev => prev ? { ...prev, like_count: prev.like_count + 1 } : null);
      
      toast({
        title: "Liked!",
        description: "Thanks for your feedback.",
      });
    } catch (error) {
      console.error('Error liking prompt:', error);
    }
  };

  const handleAddComment = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !newComment.trim()) return;

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          item_type: 'prompt',
          item_id: promptId,
          content: newComment.trim()
        })
        .select()
        .single();

      if (error) throw error;

      // Track the comment interaction
      await supabase
        .from('user_interactions')
        .insert({
          user_id: user.id,
          interaction_type: 'comment',
          item_type: 'prompt',
          item_id: promptId
        });

      console.log('Comment interaction tracked for prompt:', promptId);

      setComments(prev => [...prev, data]);
      setNewComment("");
      
      toast({
        title: "Comment added",
        description: "Your comment has been posted.",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  if (!prompt) {
    return <div className="text-center">Prompt not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="glass-button"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Button>
      </div>

      <Card className="glass-card p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold gradient-text">{prompt.title}</h1>
              {prompt.is_featured && <Star className="w-6 h-6 text-accent" />}
            </div>
            <p className="text-muted-foreground text-lg">{prompt.description}</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleFavorite}
              className={`glass-button ${isFavorited ? "text-red-500 border-red-500" : ""}`}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
            </Button>
            <Button onClick={handleCopy} className="glass-button">
              <Copy className="w-4 h-4 mr-2" />
              Copy Prompt
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <Badge variant="outline" className="bg-white/5">
            <Tag className="w-3 h-3 mr-1" />
            {prompt.category}
          </Badge>
          <Badge variant="outline" className="bg-white/5">
            <Clock className="w-3 h-3 mr-1" />
            {prompt.estimated_time}
          </Badge>
          <Badge 
            variant="outline" 
            className={`bg-white/5 ${
              prompt.difficulty_level === 'Beginner' ? 'text-green-400' :
              prompt.difficulty_level === 'Intermediate' ? 'text-yellow-400' :
              'text-red-400'
            }`}
          >
            {prompt.difficulty_level}
          </Badge>
          {prompt.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="bg-accent/20 text-accent">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Prompt Content</h3>
          <div className="glass-card p-6 bg-black/20 rounded-lg max-h-96 overflow-y-auto">
            <div className="prose prose-invert max-w-none">
              {prompt.content.replace(/\\n/g, '\n').split('\n\n').map((paragraph, index) => {
                // Handle code blocks
                if (paragraph.startsWith('```')) {
                  const endIndex = prompt.content.indexOf('```', prompt.content.indexOf(paragraph) + 3);
                  const codeContent = paragraph.replace(/```[\w]*\n?/, '').replace(/```$/, '');
                  return (
                    <div key={index} className="my-4">
                      <pre className="bg-black/40 p-4 rounded-lg overflow-x-auto">
                        <code className="text-sm font-mono text-green-400">{codeContent}</code>
                      </pre>
                    </div>
                  );
                }
                
                // Handle headers
                if (paragraph.startsWith('#')) {
                  const level = paragraph.match(/^#+/)?.[0]?.length || 1;
                  const text = paragraph.replace(/^#+\s/, '');
                  const HeaderTag = `h${Math.min(level + 2, 6)}` as keyof JSX.IntrinsicElements;
                  return (
                    <HeaderTag key={index} className="font-bold text-accent mb-2 mt-4">
                      {text}
                    </HeaderTag>
                  );
                }
                
                // Handle bullet points
                if (paragraph.includes('\n- ') || paragraph.startsWith('- ')) {
                  const items = paragraph.split('\n- ').filter(item => item.trim());
                  return (
                    <ul key={index} className="list-disc list-inside space-y-1 my-3">
                      {items.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-muted-foreground">
                          {item.replace(/^- /, '')}
                        </li>
                      ))}
                    </ul>
                  );
                }
                
                // Handle numbered lists
                if (paragraph.includes('\n1. ') || /^\d+\./.test(paragraph)) {
                  const items = paragraph.split(/\n\d+\.\s/).filter(item => item.trim());
                  return (
                    <ol key={index} className="list-decimal list-inside space-y-1 my-3">
                      {items.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-muted-foreground">
                          {item.replace(/^\d+\.\s/, '')}
                        </li>
                      ))}
                    </ol>
                  );
                }
                
                // Regular paragraphs
                return paragraph.trim() ? (
                  <p key={index} className="mb-3 text-muted-foreground leading-relaxed">
                    {paragraph}
                  </p>
                ) : null;
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLike}
                className="glass-button"
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                {prompt.like_count}
              </Button>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Copy className="w-4 h-4" />
              <span>{prompt.copy_count} copies</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Comments Section */}
      <Card className="glass-card p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Comments ({comments.length})
        </h3>

        <div className="space-y-4 mb-6">
          {comments.map((comment) => (
            <div key={comment.id} className="glass-card p-4 bg-white/5">
              <p className="text-sm">{comment.content}</p>
              <div className="text-xs text-muted-foreground mt-2">
                {new Date(comment.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              No comments yet. Be the first to share your thoughts!
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="glass-button"
          />
          <Button 
            onClick={handleAddComment}
            className="glass-button"
            disabled={!newComment.trim()}
          >
            Post Comment
          </Button>
        </div>
      </Card>
    </div>
  );
}