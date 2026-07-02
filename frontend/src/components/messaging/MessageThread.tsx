import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { DirectMessage, Conversation } from '@/services/messagingService';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface MessageThreadProps {
    conversation: Conversation;
    messages: DirectMessage[];
    onSendMessage: (content: string) => void;
    onBack?: () => void;
    isLoading?: boolean;
    isSending?: boolean;
}

// Generate avatar color from name
function getAvatarColors(name: string = ''): { bg: string; text: string } {
    const colors = [
        { bg: 'bg-blue-500', text: 'text-white' },
        { bg: 'bg-emerald-500', text: 'text-white' },
        { bg: 'bg-purple-500', text: 'text-white' },
        { bg: 'bg-amber-500', text: 'text-white' },
        { bg: 'bg-rose-500', text: 'text-white' },
        { bg: 'bg-cyan-500', text: 'text-white' },
        { bg: 'bg-indigo-500', text: 'text-white' },
    ];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
}

// Get initials from name
function getInitials(name: string = ''): string {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2 && parts[0] && parts[1]) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase() || '?';
}

export const MessageThread: React.FC<MessageThreadProps> = ({
    conversation,
    messages,
    onSendMessage,
    onBack,
    isLoading = false,
    isSending = false,
}) => {
    const { user } = useAuth();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    const avatarColors = getAvatarColors(conversation?.other_user_name || 'Unknown User');
    const initials = getInitials(conversation?.other_user_name || 'Unknown User');

    // Scroll to bottom when new messages arrive (if user is at bottom)
    useEffect(() => {
        if (shouldAutoScroll && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, shouldAutoScroll]);

    // Track if user has scrolled up
    const handleScroll = () => {
        const container = containerRef.current;
        if (container) {
            const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
            setShouldAutoScroll(isAtBottom);
        }
    };

    // Scroll to bottom on initial load
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView();
        }
    }, [conversation.id]);

    return (
        <div className="flex flex-col h-full w-full bg-background">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-card/80 backdrop-blur-sm">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <div
                    className={cn(
                        'w-11 h-11 rounded-xl flex items-center justify-center font-semibold text-sm shadow-sm',
                        avatarColors.bg,
                        avatarColors.text
                    )}
                >
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="font-semibold truncate">{conversation?.other_user_name || 'New Conversation'}</h2>
                    <p className="text-xs text-muted-foreground capitalize">{conversation?.other_user_role || 'User'}</p>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-5 py-5 space-y-4"
            >
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                            <MessageCircle className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground font-medium">No messages yet</p>
                        <p className="text-muted-foreground/60 text-sm mt-1">
                            Send a message to start the conversation
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((message, index) => {
                            const isOwn = Number(message.sender_id) === Number(user?.id);
                            const prevMessage = messages[index - 1];
                            const showSenderName = !prevMessage || prevMessage.sender_id !== message.sender_id;

                            return (
                                <MessageBubble
                                    key={message.id}
                                    content={message.content}
                                    senderName={message.sender_name}
                                    timestamp={message.created_at}
                                    isOwn={isOwn}
                                    showSenderName={showSenderName}
                                />
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <MessageInput
                onSend={onSendMessage}
                disabled={isSending}
                placeholder={`Message ${conversation?.other_user_name || 'user'}...`}
            />
        </div>
    );
};

