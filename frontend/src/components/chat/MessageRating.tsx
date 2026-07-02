import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { chatService } from '@/services/chatService';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface MessageRatingProps {
    messageId: number;
    currentRating?: 'up' | 'down' | null;
    onRatingChange?: (rating: 'up' | 'down') => void;
}

export default function MessageRating({
    messageId,
    currentRating,
    onRatingChange,
}: MessageRatingProps) {
    const [rating, setRating] = useState<'up' | 'down' | null>(currentRating || null);
    const [showCommentDialog, setShowCommentDialog] = useState(false);
    const [comment, setComment] = useState('');
    const [pendingRating, setPendingRating] = useState<'up' | 'down' | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleRatingClick = (newRating: 'up' | 'down') => {
        // If clicking the same rating, show comment dialog
        if (rating === newRating) {
            setPendingRating(newRating);
            setShowCommentDialog(true);
            return;
        }

        // If changing rating, ask for comment
        setPendingRating(newRating);
        setShowCommentDialog(true);
    };

    const handleSubmitRating = async () => {
        if (!pendingRating) return;

        setIsSubmitting(true);
        try {
            await chatService.rateMessage(messageId, pendingRating, comment || undefined);
            setRating(pendingRating);
            onRatingChange?.(pendingRating);

            toast({
                title: 'Rating submitted',
                description: 'Thank you for your feedback!',
            });

            setShowCommentDialog(false);
            setComment('');
            setPendingRating(null);
        } catch (error) {
            console.error('Failed to submit rating:', error);
            toast({
                title: 'Error',
                description: 'Failed to submit rating. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkipComment = async () => {
        if (!pendingRating) return;

        setIsSubmitting(true);
        try {
            await chatService.rateMessage(messageId, pendingRating);
            setRating(pendingRating);
            onRatingChange?.(pendingRating);

            toast({
                title: 'Rating submitted',
                description: 'Thank you for your feedback!',
            });

            setShowCommentDialog(false);
            setPendingRating(null);
        } catch (error) {
            console.error('Failed to submit rating:', error);
            toast({
                title: 'Error',
                description: 'Failed to submit rating. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 px-2 ${rating === 'up'
                            ? 'text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                    onClick={() => handleRatingClick('up')}
                >
                    <ThumbsUp className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 px-2 ${rating === 'down'
                            ? 'text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                    onClick={() => handleRatingClick('down')}
                >
                    <ThumbsDown className="h-4 w-4" />
                </Button>
            </div>

            {/* Comment Dialog */}
            <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {pendingRating === 'up' ? 'What did you like?' : 'What could be improved?'}
                        </DialogTitle>
                        <DialogDescription>
                            Your feedback helps us improve the AI responses. (Optional)
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <Textarea
                            placeholder="Add your comment here..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowCommentDialog(false);
                                setComment('');
                                setPendingRating(null);
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={handleSkipComment}
                            disabled={isSubmitting}
                        >
                            Skip
                        </Button>
                        <Button
                            onClick={handleSubmitRating}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
