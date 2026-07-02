import React, { useState, useMemo } from 'react';
import { ChatSessionWithSummary } from '@/services/chatService';
import { formatRelativeTime } from '@/lib/utils';
import { MessageSquare, Plus, Trash2, MoreVertical, Search, Calendar, History, Clock } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ConversationSidebarProps {
    sessions: ChatSessionWithSummary[];
    activeSessionId: number | null;
    onSelectSession: (session: ChatSessionWithSummary) => void;
    onCreateNew: () => void;
    onDelete: (sessionId: number) => void;
    isCreating?: boolean;
}

type GroupedSessions = {
    [key: string]: ChatSessionWithSummary[];
};

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
    sessions,
    activeSessionId,
    onSelectSession,
    onCreateNew,
    onDelete,
    isCreating = false,
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Filter sessions based on search term
    const filteredSessions = useMemo(() => {
        if (!searchTerm.trim()) return sessions;
        const term = searchTerm.toLowerCase();
        return sessions.filter(s =>
            (s.title || `Conversation #${s.id}`).toLowerCase().includes(term) ||
            (s.last_message || '').toLowerCase().includes(term)
        );
    }, [sessions, searchTerm]);

    // Group sessions by date
    const groupedSessions = useMemo(() => {
        const groups: GroupedSessions = {
            'Today': [],
            'Yesterday': [],
            'Previous 7 Days': [],
            'Older': []
        };

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const startOfLastWeek = new Date(startOfToday);
        startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

        filteredSessions.forEach(session => {
            const date = new Date(session.last_message_at || session.updated_at);
            if (date >= startOfToday) {
                groups['Today'].push(session);
            } else if (date >= startOfYesterday) {
                groups['Yesterday'].push(session);
            } else if (date >= startOfLastWeek) {
                groups['Previous 7 Days'].push(session);
            } else {
                groups['Older'].push(session);
            }
        });

        return groups;
    }, [filteredSessions]);

    const hasGroups = Object.values(groupedSessions).some(group => group.length > 0);

    return (
        <div className="w-80 border-r border-border bg-secondary/5 flex flex-col h-full overflow-hidden">
            {/* Header Actions */}
            <div className="p-4 space-y-4 border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                <button
                    onClick={onCreateNew}
                    disabled={isCreating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/95 shadow-sm shadow-primary/20 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm border border-primary/10"
                >
                    <Plus className="w-5 h-5" />
                    New Conversation
                </button>

                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-secondary/10 border border-transparent focus:border-primary/20 focus:bg-background rounded-xl text-sm transition-all focus:outline-none placeholder:text-muted-foreground/60"
                    />
                </div>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar">
                {!hasGroups ? (
                    <div className="text-center py-12 px-4 animate-in fade-in slide-in-from-bottom-4">
                        <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h4 className="text-sm font-medium text-foreground/80 mb-1">
                            {searchTerm ? 'No results found' : 'No conversations yet'}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            {searchTerm ? 'Try a different search term' : 'Start your first AI chat session'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(groupedSessions).map(([groupName, groupSessions]) => {
                            if (groupSessions.length === 0) return null;

                            return (
                                <div key={groupName} className="space-y-2">
                                    <div className="px-3 flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                                            {groupName}
                                        </span>
                                        <div className="h-px flex-1 bg-border/40" />
                                    </div>
                                    <div className="space-y-1">
                                        {groupSessions.map((session) => (
                                            <ConversationItem
                                                key={session.id}
                                                session={session}
                                                isActive={session.id === activeSessionId}
                                                onClick={() => onSelectSession(session)}
                                                onDelete={() => onDelete(session.id)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer Summary */}
            <div className="px-6 py-3 border-t border-border bg-background/50 backdrop-blur-sm">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground/70 font-medium">
                    <div className="flex items-center gap-2">
                        <History className="w-3 h-3" />
                        <span>{sessions.length} sessions total</span>
                    </div>
                    {searchTerm && (
                        <span>{filteredSessions.length} found</span>
                    )}
                </div>
            </div>
        </div>
    );
};

interface ConversationItemProps {
    session: ChatSessionWithSummary;
    isActive: boolean;
    onClick: () => void;
    onDelete: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
    session,
    isActive,
    onClick,
    onDelete,
}) => {
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Delete this conversation? This action cannot be undone.')) {
            onDelete();
        }
    };

    const title = session.title || `Conversation #${session.id}`;
    const messageCount = session.message_count || 0;
    const lastMessageAt = session.last_message_at || session.updated_at;

    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 border border-transparent",
                isActive
                    ? "bg-primary/10 border-primary/20 shadow-sm"
                    : "hover:bg-secondary/40 hover:border-secondary/60"
            )}
        >
            {/* Active Indicator Bar */}
            {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-primary rounded-r-full" />
            )}

            <div className="flex items-start justify-between gap-3 min-w-0">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className={cn(
                            "w-4 h-4 flex-shrink-0 transition-colors",
                            isActive ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground/70"
                        )} />
                        <h3 className={cn(
                            "text-sm font-semibold truncate transition-colors",
                            isActive ? "text-primary" : "text-foreground group-hover:text-primary/80"
                        )}>
                            {title}
                        </h3>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground/60 transition-colors group-hover:text-muted-foreground/80">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {messageCount} {messageCount === 1 ? 'msg' : 'msgs'}
                        </span>
                        <span>•</span>
                        <span>{formatRelativeTime(lastMessageAt)}</span>
                    </div>
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className={cn(
                                    "p-1.5 rounded-lg hover:bg-secondary/80 transition-all",
                                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                )}
                            >
                                <MoreVertical className="w-4 h-4 text-muted-foreground/60" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl border-border/50">
                            <DropdownMenuItem
                                onClick={handleDelete}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-lg m-1"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                <span className="text-sm font-medium">Delete chat</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
};
