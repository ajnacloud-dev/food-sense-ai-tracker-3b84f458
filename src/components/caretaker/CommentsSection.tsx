
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, User, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  comment_text: string;
  author_type: 'caretaker' | 'participant';
  created_at: string;
  caretaker_id: string;
  participant_id: string;
}

interface CommentsSectionProps {
  participantId: string;
  contentType: 'food_entry' | 'workout' | 'receipt' | 'general';
  contentId?: string;
  isCaretaker?: boolean;
}

const CommentsSection = ({ participantId, contentType, contentId, isCaretaker = false }: CommentsSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
    subscribeToComments();
  }, [participantId, contentType, contentId]);

  const fetchComments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('participant_comments')
        .select('*')
        .eq('participant_id', participantId)
        .eq('content_type', contentType)
        .order('created_at', { ascending: true });

      if (contentId) {
        query = query.eq('content_id', contentId);
      } else {
        query = query.is('content_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Type assertion to ensure author_type is properly typed
      const typedComments = (data || []).map(comment => ({
        ...comment,
        author_type: comment.author_type as 'caretaker' | 'participant'
      }));
      
      setComments(typedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    }
  };

  const subscribeToComments = () => {
    const channel = supabase
      .channel('comments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participant_comments',
          filter: `participant_id=eq.${participantId}`
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('participant_comments')
        .insert({
          participant_id: participantId,
          caretaker_id: isCaretaker ? user.id : participantId,
          content_type: contentType,
          content_id: contentId || null,
          comment_text: newComment.trim(),
          author_type: isCaretaker ? 'caretaker' : 'participant'
        });

      if (error) throw error;

      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments
        </CardTitle>
        <CardDescription>
          {contentType === 'general' ? 'General discussion' : `Comments for this ${contentType.replace('_', ' ')}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments List */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {comment.author_type === 'caretaker' ? (
                      <UserCheck className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {comment.author_type === 'caretaker' ? 'Caretaker' : 'Participant'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.comment_text}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No comments yet. Start the conversation!</p>
            </div>
          )}
        </div>

        {/* Add Comment */}
        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <Button 
            onClick={handleSubmitComment}
            disabled={loading || !newComment.trim()}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            Add Comment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommentsSection;
