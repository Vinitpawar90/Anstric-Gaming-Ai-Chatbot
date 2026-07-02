import React from 'react';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
    content: string;
    senderName: string;
    timestamp: string;
    isOwn: boolean;
    showSenderName?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
    content,
    senderName,
    timestamp,
    isOwn,
    showSenderName = true,
}) => {
    const formattedTime = new Date(timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    return (
        <div className={cn('flex flex-col max-w-[70%] gap-1', isOwn ? 'items-end ml-auto' : 'items-start')}>
            {showSenderName && !isOwn && (
                <span className="text-xs text-muted-foreground font-medium px-3">{senderName}</span>
            )}
            <div
                className={cn(
                    'rounded-2xl px-4 py-2.5 break-words shadow-sm bg-primary text-primary-foreground',
                    isOwn ? 'rounded-br-lg' : 'rounded-bl-lg'
                )}
            >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
            </div>
            <span className="text-[10px] text-muted-foreground/70 px-3">{formattedTime}</span>
        </div>
    );
};

