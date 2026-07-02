import React from 'react';
import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';
import { Conversation } from '@/services/messagingService';

interface ConversationListProps {
    conversations: Conversation[];
    selectedId?: number;
    onSelect: (conversation: Conversation) => void;
    isLoading?: boolean;
}

// Generate avatar color from name
function getAvatarColors(name: string): { bg: string; text: string } {
    const colors = [
        { bg: 'bg-blue-500', text: 'text-white' },
        { bg: 'bg-emerald-500', text: 'text-white' },
        { bg: 'bg-purple-500', text: 'text-white' },
        { bg: 'bg-amber-500', text: 'text-white' },
        { bg: 'bg-rose-500', text: 'text-white' },
        { bg: 'bg-cyan-500', text: 'text-white' },
        { bg: 'bg-indigo-500', text: 'text-white' },
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
}

// Get initials from name
function getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

export const ConversationList: React.FC<ConversationListProps> = ({
    conversations,
    selectedId,
    onSelect,
    isLoading = false,
}) => {
    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">No conversations yet</p>
                <p className="text-muted-foreground/60 text-sm mt-1">
                    Start a new conversation using the button above
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto">
            {conversations.map((conversation) => {
                const isSelected = selectedId === conversation.id;
                const hasUnread = conversation.unread_count > 0;
                const avatarColors = getAvatarColors(conversation.other_user_name);
                const initials = getInitials(conversation.other_user_name);

                return (
                    <button
                        key={conversation.id}
                        onClick={() => onSelect(conversation)}
                        className={cn(
                            'w-full px-4 py-3.5 flex items-center gap-3 transition-all text-left border-l-4',
                            isSelected
                                ? 'bg-primary/5 border-l-primary'
                                : 'border-l-transparent hover:bg-secondary/50'
                        )}
                    >
                        {/* Avatar with initials */}
                        <div
                            className={cn(
                                'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-semibold text-sm shadow-sm',
                                avatarColors.bg,
                                avatarColors.text
                            )}
                        >
                            {initials}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <span
                                    className={cn(
                                        'text-sm truncate',
                                        hasUnread ? 'font-semibold text-foreground' : 'font-medium'
                                    )}
                                >
                                    {conversation.other_user_name}
                                </span>
                                <span className="text-[11px] text-muted-foreground flex-shrink-0">
                                    {formatRelativeTime(conversation.last_message_at)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-1">
                                <p
                                    className={cn(
                                        'text-xs truncate',
                                        hasUnread ? 'text-foreground' : 'text-muted-foreground'
                                    )}
                                >
                                    {conversation.last_message || 'No messages yet'}
                                </p>
                                {hasUnread && (
                                    <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-semibold">
                                        {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                                    </span>
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    if (days > 0) {
        return `${days}d`;
    }
    if (hours > 0) {
        return `${hours}h`;
    }
    if (minutes > 0) {
        return `${minutes}m`;
    }
    return 'Now';
}

